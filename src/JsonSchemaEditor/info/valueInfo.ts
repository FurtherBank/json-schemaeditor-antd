import { schemaShortable } from "../FieldOptions";
import { propertySchemaCache, itemSchemaCache, ShortOpt } from "../reducer";
import { findKeyRefs, getPathVal, addRef, getRefSchemaMap, absorbProperties } from "../utils";
import { JSONSchema6 } from 'json-schema';

/**
 * 设置 propCache
 * @param propertyCache
 * @param valueEntry
 * @param valueSchemaMap
 * @param rootSchema
 * @returns
 */
 export const setPropertyCache = (
    propertyCache: Map<string, propertySchemaCache | null>,
    valueEntry: string,
    valueSchemaMap: Map<string, JSONSchema6 | boolean>,
    rootSchema: JSONSchema6,
  ) => {
    // 得到以下属性的 ref
    const propertyRefs = findKeyRefs(valueSchemaMap, 'properties', true) as string[];
    const patternRefs = findKeyRefs(valueSchemaMap, 'patternProperties', true) as string[];
    const additionalRef = findKeyRefs(valueSchemaMap, 'additionalProperties', false) as
      | string
      | undefined;
    const requiredRefs = findKeyRefs(valueSchemaMap, 'required', true) as string[];
  
    if (propertyRefs.length + patternRefs.length > 0 || additionalRef) {
      // 对字段是否是短字段进行分类
      const props = {} as any;
      propertyRefs.reverse().forEach((ref) => {
        const schemas = getPathVal(rootSchema, ref);
        if (!schemas || schemas === true) return;
        for (const key in schemas) {
          props[key] = {
            shortable: schemaShortable(addRef(ref, key)!, rootSchema),
            ref: addRef(ref, key)!,
          };
        }
      });
      const patternProps = {} as any;
      patternRefs.reverse().forEach((ref) => {
        const schemas = getPathVal(rootSchema, ref);
        if (!schemas || schemas === true) return;
        for (const key in schemas) {
          patternProps[key] = {
            shortable: schemaShortable(addRef(ref, key)!, rootSchema),
            ref: addRef(ref, key)!,
          };
        }
      });
      const additionalValid = additionalRef ? getPathVal(rootSchema, additionalRef) !== false : false;
      const additionalShortAble = additionalRef ? schemaShortable(additionalRef, rootSchema) : false;
      // 得到 required 字段
      const required = requiredRefs.flatMap((ref) => {
        const schemas = getPathVal(rootSchema, ref);
        if (!schemas || schemas === true) return [];
        return schemas;
      });
      propertyCache.set(valueEntry, {
        props,
        patternProps,
        required,
        additional: additionalValid
          ? { ref: additionalRef!, shortable: additionalShortAble }
          : undefined,
      });
    } else {
      propertyCache.set(valueEntry, null);
    }
    return propertyCache.get(valueEntry);
  };
  
  /**
   * 设置 itemCache
   * @param itemCache
   * @param valueEntry
   * @param valueSchemaMap
   * @param rootSchema
   */
  export const setItemCache = (
    itemCache: Map<string, itemSchemaCache | null>,
    valueEntry: string,
    valueSchemaMap: Map<string, JSONSchema6 | boolean>,
    rootSchema: JSONSchema6,
  ) => {
    // 先进行对象的 itemCache 设置
    const itemRef = findKeyRefs(valueSchemaMap, 'items') as string;
    const additionalItemRef = findKeyRefs(valueSchemaMap, 'additionalItems') as string;
    if (itemRef) {
      const itemSchema = getPathVal(rootSchema, itemRef);
      // 如果所有 schema 没有 title，认为是extra 短优化，此外是普通短优化
      if (itemSchema instanceof Array) {
        const additionalItemSchemaMap = getRefSchemaMap(additionalItemRef, rootSchema);
        const itemListShort = itemSchema.every((schema, i) => {
          return schemaShortable(addRef(itemRef, i.toString())!, rootSchema);
        });
        const additionalItemShort = schemaShortable(additionalItemRef, rootSchema);
        if (itemListShort && additionalItemShort) {
          // 判断是否是extra短优化(true/false 不能shortable，故不需要先过滤)
          const itemListNoTitle = itemSchema.every((schema, i) => {
            const fieldRef = addRef(itemRef, i.toString())!;
            const fieldMap = getRefSchemaMap(fieldRef, rootSchema);
            return absorbProperties(fieldMap, 'title') === undefined;
          });
          const additionalItemHasTitle =
            absorbProperties(additionalItemSchemaMap, 'title') !== undefined;
          if (!itemListNoTitle || additionalItemHasTitle) {
            itemCache.set(valueEntry, {
              shortOpt: ShortOpt.short,
              itemLength: itemSchema.length,
            });
          } else {
            itemCache.set(valueEntry, {
              shortOpt: ShortOpt.extra,
              itemLength: itemSchema.length,
            });
          }
        } else {
          itemCache.set(valueEntry, {
            shortOpt: ShortOpt.no,
            itemLength: itemSchema.length,
          });
        }
      } else {
        const oneTypeArrayShortAble = schemaShortable(itemRef, rootSchema);
        const itemHasTitle = itemSchema.title !== undefined;
        if (oneTypeArrayShortAble) {
          if (itemHasTitle) {
            itemCache.set(valueEntry, { shortOpt: ShortOpt.short });
          } else {
            itemCache.set(valueEntry, { shortOpt: ShortOpt.extra });
          }
        } else {
          itemCache.set(valueEntry, { shortOpt: ShortOpt.no });
        }
      }
    } else {
      itemCache.set(valueEntry, null);
    }
    return itemCache.get(valueEntry);
  };