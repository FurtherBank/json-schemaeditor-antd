import clone from 'lodash/clone'
import { addRef, deepGet, deepCollect, jsonDataType, getValueByPattern } from '.'
import { MergedSchema } from '../context/mergeSchema'
import { JSONSchema } from '../type/Schema'
import { uri2strArray } from './path/uri'

/**
 * 找到 $ref 引用的 schemaMap。如果找不到返回一个空 Map
 * @param $ref json-pointer with #
 * @param rootSchema
 * @param deepSearch 深入搜索：深递归加入所有schema引用，否则只递归到浅一层
 * @returns
 */
export const getRefSchemaMap = (
  $ref: string | undefined | string[],
  rootSchema = {},
  deepSearch = false
): Map<string, JSONSchema | boolean> => {
  const schemaMap = new Map()
  const refQueue = $ref instanceof Array ? clone($ref) : $ref ? [$ref] : []
  while (refQueue.length > 0) {
    const nowRef = addRef(refQueue.shift()!)!
    const current = deepGet(rootSchema, uri2strArray(nowRef))
    if (current !== undefined) {
      schemaMap.set(nowRef, current)
      if (deepSearch) {
        const refs = deepCollect(current, '$ref')
        if (refs instanceof Array) {
          for (const ref of refs) {
            if (typeof ref === 'string' && !schemaMap.has(addRef(ref))) refQueue.push(ref)
          }
        }
      } else {
        if (current.hasOwnProperty('$ref') && !schemaMap.has(addRef(current.$ref))) {
          refQueue.push(current.$ref)
        }
      }
    }
  }
  return schemaMap
}

/**
 * 找到 schemaMap 中所有含有某键的 uri 引用
 * @param schemaMap
 * @param k
 * @param all 是否拿到所有 ref ，默认只拿第一个
 * @param add 返回的ref是否加入属性名称，默认加入
 * @returns
 */
// export const findKeyRefs = (schemaMap: Map<string, any>, k: string, all = false, add = true) => {
//   const allRefs = []
//   for (const [ref, schema] of schemaMap) {
//     if (schema instanceof Object && schema[k] !== undefined) {
//       if (all) {
//         allRefs.push(add ? addRef(ref, k)! : ref)
//       } else {
//         return add ? addRef(ref, k)! : ref
//       }
//     }
//   }
//   return all ? allRefs : undefined
// }

/**
 * 对 Array/Object 获取特定字段 schemaEntry。
 * 注意：
 * 1. 无论这其中有多少条 ref，一定保证给出的 schemaEntry 是从 `properties, patternProperties, additionalProperties, prefixItems, items` 这五个字段之一进入的。
 * 2. 只要给出的 ref 不是 undefined，一定能够找到对应的 schema
 * @param data 当前的 data
 * @param valueEntry
 * @param mergedValueSchema
 * @param field
 * @returns 对应子字段的 schemaEntry，结果为 false 代表对应 schema 为 false，在模式支持上当作 undefined 处理即可
 */
export const getFieldSchema = (
  data: any,
  valueEntry: string | undefined,
  mergedValueSchema: MergedSchema | false,
  field: string
): string | false | undefined => {
  if (!mergedValueSchema) return undefined

  const { properties, patternProperties, additionalProperties, items, prefixItems } = mergedValueSchema
  const dataType = jsonDataType(data)
  switch (dataType) {
    case 'object':
      if (properties && properties[field]) return properties[field]

      if (patternProperties) {
        const ref = getValueByPattern(patternProperties, field)
        if (ref) return ref
      }

      if (additionalProperties !== undefined) return additionalProperties
      // 如果上面这些属性都没有但是 type = object，会使得这里到了下面的 case 而出错
      return undefined
    case 'array':
      /**
       * 注意：draft 2020-12 调整了items，删除了additionalItems属性。
       * 个人认为这么做是正确的，但是旧的没改，还需要兼容
       * 详情见：https://json-schema.org/draft/2020-12/release-notes.html
       */
      const index = parseInt(field, 10)
      if (isNaN(index) || index < 0) {
        throw new Error(
          `获取字段模式错误：在数组中获取非法索引 ${field}\n辅助信息：${valueEntry} \n ${JSON.stringify(
            mergedValueSchema,
            null,
            2
          )}`
        )
      }
      if (prefixItems) {
        const { length, ref } = prefixItems
        if (index < length) {
          return addRef(ref, field)
        } else {
          return items
        }
      } else if (items) {
        return items
      } else {
        return undefined
      }
    default:
      throw new Error(
        `获取字段模式错误：在非对象中获取字段模式 ${field}\n辅助信息：${valueEntry} \n ${JSON.stringify(
          mergedValueSchema,
          null,
          2
        )}`
      )
  }
}
