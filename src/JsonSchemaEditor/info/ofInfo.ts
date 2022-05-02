import _ from 'lodash';
import { InfoContent } from '..';
import { shallowValidate, toOfName } from '../FieldOptions';
import { ofSchemaCache } from '../reducer';
import { addRef, deepReplace, findKeyRefs, getPathVal, getRefSchemaMap } from '../utils';
import { JSONSchema6 } from 'json-schema';

/**
 * 验证数据符合 oneOf/anyOf 的哪一个选项
 * @param data
 * @param schemaEntry
 * @param context
 * @returns `null`为无 oneOf/anyOf，`false`为不符合任何选项，`string`为选项链
 */
export const getOfOption = (
  data: any,
  schemaEntry: string,
  context: InfoContent,
): string | null | false => {
  const { ofCache } = context;
  const ofCacheValue = schemaEntry ? ofCache.get(schemaEntry) : null;
  if (ofCacheValue) {
    const { extracted, ofLength, ofRef } = ofCacheValue;
    for (let i = 0; i < ofLength; i++) {
      const validate = extracted[i];
      if (typeof validate === 'string') {
        // 展开的 validate 为 string，就是子 oneOf 的 ref
        const optOfCacheValue = ofCache.get(validate);
        console.assert(optOfCacheValue as any); // assert 就是用来在没法推出类型等一定能对的情况先打保证的，这个设置类型需求就有点🐕了
        const subOption = getOfOption(data, validate, context);
        console.assert(subOption !== null);
        if (subOption) return `${i}-${subOption}`;
      } else {
        const valid = shallowValidate(data, addRef(ofRef, i.toString())!, context);
        if (valid) return i.toString();
      }
    }
    return false;
  }
  return null;
};

/**
 * 通过 of 链找到 schema 经层层选择之后引用的 valueEntry
 * @param ofCache
 * @param schemaEntry
 * @param ofChain
 */
export const getRefByOfChain = (
  ofCache: Map<string, ofSchemaCache | null>,
  schemaEntry: string,
  ofChain: string,
) => {
  const ofSelection = ofChain.split('-');
  for (const opt of ofSelection) {
    const { ofRef } = ofCache.get(schemaEntry)!;
    schemaEntry = addRef(ofRef, opt)!;
  }
  return schemaEntry;
};

/**
 * 对 `schemaEntry` 设置 ofInfo
 * @param ofCache
 * @param schemaEntry
 * @param entrySchemaMap
 * @param rootSchema
 * @param nowOfRefs
 * @returns
 */
export const setOfCache = (
  ofCache: Map<string, ofSchemaCache | null>,
  schemaEntry: string,
  entrySchemaMap: Map<string, JSONSchema6 | boolean>,
  rootSchema: JSONSchema6,
  nowOfRefs: string[] = [],
) => {
  const findOfRef = (schemaMap: Map<string, JSONSchema6 | boolean>, add = true) => {
    return (findKeyRefs(schemaMap, 'oneOf', false, add) ||
      findKeyRefs(schemaMap, 'anyOf', false, add)) as string | undefined;
  };
  // 设置 ofCache (use Entry map ,root)
  const ofRef = findOfRef(entrySchemaMap);
  if (ofRef && nowOfRefs.includes(ofRef)) {
    console.error('你进行了oneOf/anyOf的循环引用，这会造成无限递归，危', nowOfRefs, ofRef);
    ofCache.set(schemaEntry, null);
  } else if (ofRef) {
    nowOfRefs.push(ofRef);
    const oneOfOptRefs = getPathVal(rootSchema, ofRef).map((v: any, i: string) =>
      addRef(ofRef, i.toString()),
    ) as string[];

    // 得到展开的 schema
    const extractedSchemas = [] as (undefined | string)[];

    const oneOfOptions = oneOfOptRefs.map((ref, i) => {
      const optMap = getRefSchemaMap(ref, rootSchema);
      const name = toOfName(optMap);
      const result = {
        value: i.toString(),
        title: name ? name : `Option ${i + 1}`,
      } as any;
      const optCache = ofCache.has(ref)
        ? ofCache.get(ref)
        : setOfCache(ofCache, ref, optMap, rootSchema, nowOfRefs);
      if (optCache) {
        const { options } = optCache;
        // todo: 这里需要变成多层的
        result.children = options.map((option) => {
          return deepReplace(_.cloneDeep(option), 'value', (prev, key) => {
            return `${i}-${prev}`;
          });
        });
        result.disabled = true;
        // 选项有子选项，将子选项ref给他
        extractedSchemas.push(ref);
      } else {
        extractedSchemas.push(undefined);
      }
      return result;
    });

    ofCache.set(schemaEntry, {
      extracted: extractedSchemas,
      ofRef: ofRef,
      ofLength: oneOfOptRefs.length,
      options: oneOfOptions,
    });
  } else {
    ofCache.set(schemaEntry, null);
  }
  return ofCache.get(schemaEntry);
};
