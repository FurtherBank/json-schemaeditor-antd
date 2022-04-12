import produce from 'immer';
import { JSONSchema6 } from 'json-schema';
import _, { isEqual } from 'lodash';
import { ContextContent, SchemaCache } from '.';
import { FieldProps, setItemCache, setPropertyCache } from './Field';
import { ajvInstance, Caches } from './reducer';
import {
  absorbProperties,
  absorbSchema,
  addRef,
  exactIndexOf,
  filterIter,
  filterObjSchema,
  findKeyRefs,
  getPathVal,
  getRefSchemaMap,
  getValueByPattern,
  jsonDataType,
} from './utils';

const maxCollapseLayer = 3;
export const maxItemsPerPageByShortLevel = [16, 32, 48];
const longFormats = ['row', 'uri', 'uri-reference'];
const extraLongFormats = ['multiline'];

export const gridOption = [
  { gutter: 2, column: 1 },
  { gutter: 2, column: 2, lg: 2, xl: 2, xxl: 2 },
  { gutter: 2, column: 4, lg: 4, xl: 4, xxl: 4 },
];

export const defaultTypeValue: any = {
  string: '',
  number: 0,
  integer: 0,
  object: {},
  array: [],
  null: null,
  boolean: false,
};

/**
 * 确定一个数据的**常量名称**。
 * 定义具体详见 [常量名称](https://gitee.com/furtherbank/json-schemaeditor-antd#常量名称)
 * @param v
 * @returns
 */
const toConstName = (v: any) => {
  const t = jsonDataType(v);
  switch (t) {
    case 'object':
      return v.hasOwnProperty('name') ? v.name.toString() : `Object[${Object.keys(v).length}]`;
    case 'array':
      return `Array[${v.length}]`;
    case 'null':
      return 'null'; // 注意 null 没有 toString
    default:
      return v.toString();
  }
};

/**
 * 确定一个模式在 of 选项中展示的**模式名称**。
 * 定义具体详见 [模式名称](https://gitee.com/furtherbank/json-schemaeditor-antd#模式名称)
 * @param schemaMap 模式名称
 * @returns
 */
const toOfName = (schemaMap: Map<string, boolean | JSONSchema6>) => {
  const schemas = filterObjSchema(schemaMap.values());
  const title = absorbProperties(schemas, 'title');
  if (title) return title;
  const type = absorbProperties(schemas, 'type');
  if (type.length === 1) return type[0];
  return '';
};

/**
 * 确定schema是否可以短优化。条件：
 * 1. 类型确定且为string/number/bool/null，且没有oneof
 * 2. 有enum
 * @param schema
 */
const schemaShortable = (ref: string, rootSchema: JSONSchema6 | boolean | undefined) => {
  const schemaMap = getRefSchemaMap(ref, rootSchema);

  if (schemaMap.has(ref) && schemaMap.get(ref) === false) return true;

  const existToTrue = ['const', 'enum'];
  for (let i = 0; i < existToTrue.length; i++) {
    const key = existToTrue[i];
    const keySchema = absorbProperties(schemaMap, key);
    if (keySchema !== undefined) return true;
  }

  const types = absorbProperties(schemaMap, 'type');
  if (types.length === 1) {
    const type = types[0];
    switch (type) {
      case 'string':
        const format = absorbProperties(schemaMap, 'format');
        if (format && (extraLongFormats.includes(format) || longFormats.includes(format)))
          return false;
        return true;
      case 'number':
      case 'integer':
      case 'boolean':
      case 'null':
        return true;
      default:
        return false;
    }
  }
  return false;
};

export const getFormatType = (format: string | undefined) => {
  if (extraLongFormats.includes(format!)) return 2;
  if (longFormats.includes(format!)) return 1;
  return 0;
};

/**
 * 当前json在既定的schema下是否可以创建新的属性。
 * @param props
 * @param schemaCache
 */
const canSchemaCreate = (props: FieldProps, schemaCache: SchemaCache) => {
  const { data } = props;
  const { valueSchemaMap } = schemaCache;
  const dataType = jsonDataType(data);
  for (const schema of valueSchemaMap!.values()) {
    if (schema === false) return false;
  }
  const filteredSchemas = filterObjSchema(valueSchemaMap!.values());
  let autoCompleteKeys: string[] = [];
  switch (dataType) {
    case 'object':
      /**
       * object可以创建新属性，需要关注的条件：
       * 1. patternProperties 不为空，我们默认 patternProperties 只要有可用的正则就肯定能再创建。
       * 2. additionalProperties 不为 false
       * 3. 不超过 maxLength
       */
      const nowKeys = Object.keys(data);
      return filteredSchemas.every((schema) => {
        const { maxProperties, properties, additionalProperties, patternProperties } = schema;
        // 1. 长度验证
        if (maxProperties !== undefined && nowKeys.length >= maxProperties) return false;
        // 在这之前先收集一下可以自动补全的字段。。。
        let restKeys = [];
        if (properties) {
          restKeys = Object.keys(properties).filter((key) => !nowKeys.includes(key));
          autoCompleteKeys = autoCompleteKeys.concat(restKeys);
          return restKeys.length > 0;
        }
        // 2. additionalProperties 验证
        if (additionalProperties !== false) return true;
        // 3. patternProperties 有键
        if (patternProperties && Object.keys(patternProperties).length > 0) return true;
        // 4. 有无剩余键
        return restKeys.length > 0;
      })
        ? autoCompleteKeys
        : false;
    case 'array':
      return filteredSchemas.every((schema) => {
        const { maxItems, items, additionalItems } = schema;
        const itemsLength =
          items instanceof Array && additionalItems === false ? items.length : +Infinity;
        const maxLength = maxItems === undefined ? +Infinity : maxItems;
        return maxLength < itemsLength ? data.length < maxLength : data.length < itemsLength;
      })
        ? []
        : false;
    default:
      return false;
  }
};

/**
 * 判断该字段(来自一个对象)是否可以重新命名
 * @param props
 * @returns 返回字符串为不可命名，返回正则为命名范围，返回空串即可命名
 */
const canSchemaRename = (props: FieldProps, schemaCache: SchemaCache) => {
  const { field, schemaEntry, fatherInfo } = props;
  const { entrySchemaMap, itemCache, propertyCache, valueSchemaMap } = schemaCache;
  // 注意，一个模式的 title 看 entryMap，如果有of等不理他
  const title = absorbProperties(entrySchemaMap!, 'title') as string | undefined;

  if (field === null) {
    return title ? title : ' ';
  }
  // 不是根节点，不保证 FatherInfo 一定存在，因为可能有抽屉！
  const { valueEntry: fatherValueEntry, type: fatherType } = fatherInfo ?? {};
  const propertyCacheValue = fatherValueEntry ? propertyCache.get(fatherValueEntry) : null;
  if (fatherType === 'array') {
    return title ? title + ' ' + field : field;
  } else if (!propertyCacheValue) {
    return '';
  } else {
    const { props, patternProps } = propertyCacheValue;

    if (props[field]) return title ? title : field;

    const pattern = getValueByPattern(patternProps, field);
    if (pattern) return new RegExp(pattern);

    return '';
  }
};

/**
 * 判断 该字段是否可删除。可删除条件：
 * 1. `field === null` 意味着根字段，不可删除
 * 2. 如果父亲是数组，只要不在数组 items 里面即可删除
 * 3. 如果父亲是对象，只要不在 required 里面即可删除
 *
 * @param props
 * @param schemaCache
 */
const canDelete = (props: FieldProps, schemaCache: SchemaCache) => {
  const { fatherInfo, field } = props;
  const { itemCache, propertyCache } = schemaCache;

  if (field === null) return false;
  if (fatherInfo) {
    const { valueEntry: fatherValueEntry } = fatherInfo;
    switch (fatherInfo.type) {
      case 'array':
        const itemCacheValue = fatherValueEntry ? itemCache.get(fatherValueEntry) : null;
        const index = parseInt(field);
        if (itemCacheValue) {
          return itemCacheValue.itemLength ? index >= itemCacheValue.itemLength : true;
        } else {
          return true;
        }
      case 'object':
        const propertyCacheValue = fatherValueEntry ? propertyCache.get(fatherValueEntry) : null;
        if (propertyCacheValue) {
          return !propertyCacheValue.required.includes(field);
        } else {
          return true;
        }
      default:
        console.log('意外的判断情况');
        return false;
    }
  }
  return false;
};

/**
 * 通过一个schemaEntry 得到schema，确定其创建时默认对象。
 * 允许找不到schema的场合，且前后变量保持最大兼容(未实装)
 * @param schemaCache
 * @param entry
 * @returns
 */
export const getDefaultValue = (
  schemaCache: SchemaCache,
  entry: string | undefined,
  nowData: any = undefined,
): any => {
  const { ofCache, itemCache, propertyCache, rootSchema } = schemaCache!;
  if (!entry) return null;
  const entryMap = getRefSchemaMap(entry, rootSchema);
  const nowDataType = jsonDataType(nowData);
  const propertyCacheValue = propertyCache.get(entry);
  // 0. 如果nowData是对象，就先剪掉不在列表中的属性，然后进行合并
  if (nowDataType === 'object' && propertyCacheValue) {
    const { props, patternProps } = propertyCacheValue;
    nowData = produce(nowData, (draft: any) => {
      for (const key of Object.keys(draft)) {
        if (!props[key] && !getValueByPattern(patternProps, key)) delete draft[key];
      }
    });
  }
  // 1. 优先返回规定的 default 字段值(注意深拷贝，否则会形成对象环！)
  const defaultValue = absorbProperties(entryMap, 'default');
  if (defaultValue !== undefined) {
    const defaultType = jsonDataType(defaultValue);
    if (defaultType === 'object' && nowDataType === 'object') {
      // 特殊：如果默认是 object，会采取最大合并
      return Object.assign({}, nowData, _.cloneDeep(defaultValue));
    }
    return _.cloneDeep(defaultValue);
  } else {
    // 2. 如果有 const/enum，采用其值
    const constValue = absorbProperties(entryMap, 'const');
    if (constValue !== undefined) return _.cloneDeep(constValue);
    const enumValue = absorbProperties(entryMap, 'enum');
    if (enumValue !== undefined) return _.cloneDeep(enumValue[0]);
    // 3. oneOf/anyOf 选择第0项的schema返回
    const ofCacheValue = ofCache.get(entry);
    if (ofCacheValue) {
      return getDefaultValue(schemaCache, addRef(ofCacheValue.ofRef, '0')!);
    }
  }
  // 4. 按照 schema 寻找答案
  const allTypes = absorbProperties(entryMap, 'type');
  if (allTypes.length > 0) {
    const type = allTypes[0];
    switch (type) {
      case 'object':
        const result = jsonDataType(nowData) === 'object' ? _.clone(nowData) : {};
        const allPropsRef = findKeyRefs(entryMap, 'properties', true, false) as string[];

        for (const ref of allPropsRef) {
          // 仅对 required 中的属性进行创建
          const required = getPathVal(rootSchema, addRef(ref, 'required')!) || [];
          for (const propName of required) {
            result[propName] = getDefaultValue(schemaCache, addRef(ref, 'properties', propName));
          }
        }

        return result;
      case 'array':
        const itemsRef = findKeyRefs(entryMap, 'items') as string | undefined;
        const additionalItems = absorbProperties(entryMap, 'additionalItems');
        const itemCacheValue = itemCache.get(entry);

        const arrayResult =
          jsonDataType(nowData) === 'array' && additionalItems ? _.clone(nowData) : [];

        if (itemCacheValue && itemCacheValue.itemLength !== undefined) {
          const { itemLength } = itemCacheValue;
          for (let i = 0; i < itemLength; i++) {
            arrayResult[i] = getDefaultValue(schemaCache, addRef(itemsRef, i.toString()));
          }
        }
        return arrayResult;
      default:
        break;
    }
    return _.cloneDeep(defaultTypeValue[type]);
  } else {
    return null;
  }
};

/**
 * 通过对应entry对数据进行浅验证。注意会无视entry的oneOf/anyOf信息。
 * 详情说明见 [浅验证](https://gitee.com/furtherbank/json-schemaeditor-antd#浅验证)
 * @param data
 * @param valueEntry
 * @param schemaCache
 * @param deep
 * @returns
 */
export const shallowValidate = (
  data: any,
  valueEntry: string,
  schemaCache: ContextContent,
  deep = true,
): boolean => {
  const { itemCache, propertyCache, rootSchema } = schemaCache;
  const schemaMap = getRefSchemaMap(valueEntry, rootSchema);
  const unitedSchema = absorbSchema(schemaMap);
  if (!unitedSchema) return false;
  const { const: constValue, enum: enumValue, type, format } = unitedSchema;
  const dataType = jsonDataType(data);
  if (constValue !== undefined) {
    return isEqual(data, constValue);
  } else if (enumValue !== undefined) {
    return exactIndexOf(enumValue, data) > -1;
  } else if (dataType === type || (type === 'integer' && Number.isInteger(data))) {
    // 类型相同，进行详细验证
    switch (type) {
      case 'object':
        if (deep) {
          const propertyCacheValue = propertyCache.has(valueEntry)
            ? propertyCache.get(valueEntry)
            : setPropertyCache(propertyCache, valueEntry, schemaMap, rootSchema);
          if (propertyCacheValue) {
            const { props, patternProps, additional, required } = propertyCacheValue;
            return required.every((key) => {
              if (data[key] === undefined) return false;
              const propRef = props[key]?.ref;
              if (propRef) {
                return shallowValidate(data[key], propRef, schemaCache, false);
              }
              return true;
            });
          } else {
            return true;
          }
        }
        return true;
      case 'array':
        if (deep) {
          const itemCacheValue = itemCache.has(valueEntry)
            ? itemCache.get(valueEntry)
            : setItemCache(itemCache, valueEntry, schemaMap, rootSchema);
          if (itemCacheValue) {
            const itemRef = findKeyRefs(schemaMap, 'items') as string;
            const additionalItemRef = findKeyRefs(schemaMap, 'additionalItems') as string;
            const { itemLength } = itemCacheValue;
            return data.every((value: any, i: number) => {
              if (itemLength !== undefined) {
                return i >= itemLength
                  ? shallowValidate(value, additionalItemRef, schemaCache, false)
                  : shallowValidate(value, addRef(itemRef, i.toString())!, schemaCache, false);
              } else {
                return shallowValidate(value, itemRef, schemaCache, false);
              }
            });
          } else {
            return true;
          }
        }
        return true;
      case 'string':
        if (format) {
          return ajvInstance.validate({ type: 'string', format }, data);
        }
        return true;
      default:
        return true;
    }
  } else if (type) {
    return false;
  }
  return true;
};

export {
  maxCollapseLayer,
  toConstName,
  toOfName,
  schemaShortable,
  canSchemaCreate,
  canSchemaRename,
  canDelete,
};
