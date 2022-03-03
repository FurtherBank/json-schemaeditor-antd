import _ from "lodash";
import { FatherInfo, FieldProps } from "./Field";
import { absorbProperties, addRef, filterIter, filterObjSchema, findKeyRefs, getRefSchemaMap, jsonDataType } from "./utils";

const maxCollapseLayer = 5;
const longFormats = ["row"];
const extraLongFormats = ["multiline"];

export const gridOption = [
  { gutter: 0, column: 1 },
  { gutter: 0, column: 2, lg: 3, xl: 4, xxl: 5 },
  { gutter: 0, column: 4, lg: 6, xl: 8, xxl: 10 }
]
export const defaultTypeValue: any = {
  string: "",
  number: 0,
  integer: 0,
  object: {},
  array: [],
  null: null,
  boolean: false,
}

/**
 * 确定一个变量在enum中作为一个选项显示时的名称
 * @param v
 * @returns
 */
const toEnumName = (v: any) => {
  const t = jsonDataType(v);
  switch (t) {
    case "object":
      return v.hasOwnProperty("name")
        ? v.name.toString()
        : `Object[${Object.keys(v).length}]`;
    case "array":
      return `Array[${v.length}]`;
    case "null":
      return "null"; // 注意 null 没有 toString
    default:
      return v.toString();
  }
};

/**
 * 确定一个schema在of中作为一个选项显示时的名称
 * @param schemaMap 模式映射
 * @returns
 */
const toOfName = (schemaMap: Map<string, boolean | Schema>) => {
  const schemas = filterObjSchema(schemaMap.values())
  const title = absorbProperties(schemas, 'title', 'first')
  if (title) return title
  const type = absorbProperties(schemas, 'type', 'intersection')
  if (type.length === 1) return type[0]
  return ''
};

/**
 * 确定schema是否可以短优化。条件：
 * 1. 类型确定且为string/number/bool/null，且没有oneof
 * 2. 有enum
 * @param schema
 */
const schemaShortable = (ref: string, rootSchema: RootSchema | boolean | undefined) => {
  const schemaMap = getRefSchemaMap(ref, rootSchema)
  
  if (schemaMap.has(ref) && schemaMap.get(ref) === false) return true
  
  const existToTrue = ['const', 'enum']
  for (let i = 0; i < existToTrue.length; i++) {
    const key = existToTrue[i];
    const keySchema = absorbProperties(schemaMap, key, 'first')
    if (keySchema !== undefined) return true
  }
  
  const types = absorbProperties(schemaMap, 'type', 'intersection')
  if (types.length === 1) {
    const type = types[0]
    switch (type) {
      case "string":
        const format = absorbProperties(schemaMap, 'format', 'first')
        if (format && (extraLongFormats.includes(format) || longFormats.includes(format))) return false;
        return true;
      case "number":
      case "integer":
      case "boolean":
      case "null":
        return true;
      default:
        return false;
    }
  }
  return false;
};

export const getFormatType = (format: string | undefined) => {
  if (extraLongFormats.includes(format!)) return 2
  if (longFormats.includes(format!)) return 1
  return 0
}

/**
 * 当前json在既定的schema下是否可以创建新的属性。
 * @param data 当前json
 * @param schemas
 */
const canSchemaCreate = (props: FieldProps) => {
  const { data, valueSchemaMap } = props
  const dataType = jsonDataType(data);
  for (const schema of valueSchemaMap!.values()) {
    if (schema === false) return false
  }
  const filteredSchemas = filterObjSchema(valueSchemaMap!.values());
  let autoCompleteKeys: string[] = [];
  switch (dataType) {
    case "object":
      /**
       * object可以创建新属性，需要关注的条件：
       * 1. patternProperties 不为空，我们默认 patternProperties 只要有可用的正则就肯定能再创建。
       * 2. additionalProperties 不为 false
       * 3. 不超过 maxLength
       */
      const nowKeys = Object.keys(data);
      return filteredSchemas.every((schema) => {
        const {
          maxProperties,
          properties,
          additionalProperties,
          patternProperties,
        } = schema;
        // 1. 长度验证
        if (maxProperties !== undefined && nowKeys.length >= maxProperties)
          return false;
        // 在这之前先收集一下可以自动补全的字段。。。
        let restKeys = [];
        if (properties) {
          restKeys = Object.keys(properties).filter(
            (key) => !nowKeys.includes(key)
          );
          autoCompleteKeys = autoCompleteKeys.concat(restKeys);
          return restKeys.length > 0;
        }
        // 2. additionalProperties 验证
        if (additionalProperties !== false) return true;
        // 3. patternProperties 有键
        if (patternProperties && Object.keys(patternProperties).length > 0)
          return true;
        // 4. 有无剩余键
        return restKeys.length > 0;
      })
        ? autoCompleteKeys
        : false;
    case "array":
      return filteredSchemas.every((schema) => {
        const { maxItems, items, additionalItems } = schema;
        const itemsLength =
          items instanceof Array && additionalItems === false
            ? items.length
            : +Infinity;
        const maxLength = maxItems === undefined ? +Infinity : maxItems;
        return maxLength < itemsLength
          ? data.length < maxLength
          : data.length < itemsLength;
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
const canSchemaRename = (props: FieldProps) => {
  const {field, schemaEntry, editionName, entrySchemaMap, fatherInfo} = props
  const title = absorbProperties(entrySchemaMap!, "title", "first") as string | undefined
  
  if (field === null) {
    return editionName!
  } else if (fatherInfo && fatherInfo.type === 'array') {
    return title ? title +' '+ field : field
  } else if (schemaEntry === undefined) {
    return ''
  } else {
    const path = schemaEntry.split('/')
    switch (path[path.length-1]) {
      case 'additionalProperties':
        return ''
      default:
        switch (path[path.length-2]) {
          case 'properties':
            return title ? title : field
          case 'patternProperties':
            return new RegExp(path[path.length-1])
          default:
            console.log('意外的判断情况');
            return ''
        }
    }
  }
}

/**
 * 判断 该字段是否可删除。可删除条件：
 * 1. `field === null` 意味着根字段，不可删除
 * 2. 如果父亲是数组，只要不在数组 items 里面即可删除
 * 3. 如果父亲是对象，只要不在 required 里面即可删除
 * 
 * @param props 
 */
const canDelete = (props: FieldProps) => {
  const { fatherInfo, field, cache } = props
  const { itemCache, propertyCache } = cache!
  if (field === null) return false
  if (fatherInfo) {
    const {valueEntry: fatherValueEntry} = fatherInfo
    switch (fatherInfo.type) {
      case 'array':
        const itemCacheValue = fatherValueEntry ? itemCache.get(fatherValueEntry) : null
        const index = parseInt(field)
        if (itemCacheValue) {
          return itemCacheValue.itemLength ? index >= itemCacheValue.itemLength : true
        } else {
          return true
        }
      case 'object':
        const propertyCacheValue = fatherValueEntry ? propertyCache.get(fatherValueEntry) : null
        if (propertyCacheValue) {
          return !propertyCacheValue.required.includes(field)
        } else {
          return true
        }
      default:
        console.log('意外的判断情况');
        return false
    }
  }
  return false
}

/**
 * 通过一个schemaEntry 得到schema，确定其创建时默认对象。  
 * 允许找不到schema的场合
 * @param props 
 * @param entry 
 * @returns 
 */
export const getDefaultValue = (props: FieldProps, entry: string | undefined): any => {
  const { cache, rootSchema } = props
  const {ofCache} = cache!
  if (!entry) return null
  const ofCacheValue = ofCache.get(entry)
  if (ofCacheValue) {
    return getDefaultValue(props, addRef(ofCacheValue.ofRef, '0')!)
  }
  const entryMap = getRefSchemaMap(entry, rootSchema)
  const allTypes = absorbProperties(entryMap, 'type', 'intersection')
  if (allTypes.length > 0) {
    const type = allTypes[0]
    return defaultTypeValue[type]
  } else {
    return null
  }
}
export { maxCollapseLayer, toEnumName, toOfName, schemaShortable, canSchemaCreate, canSchemaRename, canDelete };
