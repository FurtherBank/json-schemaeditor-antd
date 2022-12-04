import _ from 'lodash'
import CpuEditorContext, { arrayRefInfo } from '.'
import { JSONSchema } from '../type/Schema'
import { addRef } from '../utils'
import { virtualSchemaProps, isShort, schemaIsShort } from './virtual'

type processedSchemaProps = {
  type?: string[]
  properties?: { [k: string]: string }
  patternProperties?: { [k: string]: string }
  dependencies?: { [k: string]: string | string[] }
  /**
   * `schema`处理为 ref，`schema[]`处理为`arrayRefInfo`
   *
   * 不允许处理为`false`，不存在为`undefined`
   */
  items?: string | arrayRefInfo | false
  additionalItems?: string | false
  additionalProperties?: string | false
  oneOf?: arrayRefInfo
  anyOf?: arrayRefInfo
}

export type MergedSchemaWithoutVirtual = Omit<JSONSchema, keyof processedSchemaProps> & processedSchemaProps

/**
 * 合并后的 schema 只涉及到了用到的这一层的信息，不对子层的信息进行进一步归纳。
 */
export type MergedSchema = MergedSchemaWithoutVirtual & virtualSchemaProps

/**
 * 将 schemaMap 以合并的方式得到其中的参数
 * 1. first 还需要知道使用的 ref 在哪
 * 2. 对于对象或者数组的，值为 schema 的属性，需要一个子info来处理，也合到里面
 * @param ctx
 * @param map
 * @returns
 */
export const mergeSchemaMap = (ctx: CpuEditorContext, map: Map<string, JSONSchema | boolean>) => {
  const result = {} as MergedSchema
  for (const [ref, schema] of map) {
    if (typeof schema === 'object') {
      for (const key in schema) {
        if (Object.prototype.hasOwnProperty.call(schema, key)) {
          // acts different by key
          const value = schema[key as keyof JSONSchema] as any
          switch (key) {
            case 'type':
              // intersection
              const typeValue: string[] = value instanceof Array ? value : [value]
              result[key] = result[key] ? _.intersection(result[key], typeValue) : typeValue
              if (result[key]!.length === 0) return false
              break
            case 'properties':
            case 'patternProperties':
              // mergeRef
              if (!result[key]) result[key] = {}
              for (const propKey in value) {
                if (Object.prototype.hasOwnProperty.call(value, propKey) && !result[key]![propKey]) {
                  const propRef = addRef(ref, key, propKey)!
                  result[key]![propKey] = propRef
                }
              }
              break
            case 'required':
              // union
              result[key] = result[key] ? _.union(result[key], value) : value
              break
            case 'dependencies':
              // merge ref/array
              if (!result[key]) result[key] = {}
              for (const propKey in value) {
                if (Object.prototype.hasOwnProperty.call(value, propKey) && !result[key]![propKey]) {
                  const depValue = value[propKey]
                  if (depValue instanceof Array) {
                    result[key]![propKey] = depValue
                  } else {
                    const propRef = addRef(ref, key, propKey)!
                    result[key]![propKey] = propRef
                  }
                }
              }
              break
            case 'items':
            case 'additionalItems':
            case 'additionalProperties':
              // toRef/array to Refs
              if (!result[key]) {
                if (value instanceof Array) {
                  result[key as 'items'] = {
                    length: value.length,
                    ref: addRef(ref, key)!
                  }
                } else {
                  result[key] = value ? addRef(ref, key)! : false
                }
              }
              break
            case 'oneOf':
            case 'anyOf':
              // arrayRefInfo
              if (!result[key]) {
                result[key] = {
                  length: value.length,
                  ref: addRef(ref, key)!
                }
              }
              break
            default:
              // first: no ref involved
              if (!result[key as keyof MergedSchemaWithoutVirtual]) {
                result[key as keyof MergedSchemaWithoutVirtual] = value
              }
              break
          }
        }
      }
    } else if (schema === false) return false
  }
  // post-process: update virtual attributes
  result[isShort] = schemaIsShort(ctx, result)
  return result as MergedSchema
}
