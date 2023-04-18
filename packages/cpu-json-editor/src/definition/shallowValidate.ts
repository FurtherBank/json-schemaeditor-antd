import isEqual from 'lodash/isEqual'
import CpuEditorContext from '../context'
import { jsonDataType, addRef } from '../utils'
import ajvInstance from './ajvInstance'

const formatSchemaSheet = (function () {
  const sheet: any = {}
  return (format: string) => {
    if (!sheet[format])
      sheet[format] = {
        type: 'string',
        format
      }
    return sheet[format]
  }
})()

/**
 * 通过对应entry对数据进行浅验证。注意会无视entry的oneOf/anyOf信息。
 * 详情说明见 [浅验证](https://gitee.com/furtherbank/json-schemaeditor-antd#浅验证)
 * @param data json 数据
 * @param valueEntry
 * @param ctx
 * @param deep 是否深入对对象属性进行验证。递归验证子属性时为 false
 * @returns
 */
export const shallowValidate = (
  data: any,
  valueEntry: string | undefined,
  ctx: CpuEditorContext,
  deep = true
): boolean => {
  const mergedSchema = ctx.getMergedSchema(valueEntry)
  if (!mergedSchema) return false
  const {
    const: constValue,
    enum: enumValue,
    type: allowedTypes,
    format,
    properties,
    items,
    prefixItems,
    required
  } = mergedSchema
  const dataType = jsonDataType(data)
  if (constValue !== undefined) {
    return isEqual(data, constValue)
  } else if (enumValue !== undefined) {
    return enumValue.findIndex((v) => isEqual(v, data)) > -1
  } else if (
    allowedTypes &&
    allowedTypes.length === 1 &&
    (dataType === allowedTypes[0] || (allowedTypes[0] === 'integer' && Number.isInteger(data)))
  ) {
    // 类型相同，进行详细验证
    switch (allowedTypes[0]) {
      case 'object':
        if (deep) {
          if (required) {
            return required.every((key) => {
              if (data[key] === undefined) return false
              const propRef = properties ? properties[key] : undefined
              if (propRef) {
                return shallowValidate(data[key], propRef, ctx, false)
              }
              return true
            })
          } else {
            return true
          }
        }
        return true
      case 'array':
        if (deep) {
          if (prefixItems) {
            const { length, ref } = prefixItems
            return data.every((value: any, i: number) => {
              return i >= length
                ? shallowValidate(value, ref || undefined, ctx, false)
                : shallowValidate(value, addRef(ref, i.toString())!, ctx, false)
            })
          } else if (items) {
            return data.every((value: any) => {
              return shallowValidate(value, items, ctx, false)
            })
          } else {
            return true
          }
        }
        return true
      case 'string':
        if (format) {
          return ajvInstance.validate(formatSchemaSheet(format), data)
        }
        return true
      default:
        return true
    }
  } else if (allowedTypes) {
    return false
  }
  return true
}
