import { useCallback } from 'react'
import CpuEditorContext from '../../../context'
import { MergedSchema } from '../../../context/mergeSchema'
import { getDefaultValue } from '../../../definition/defaultValue'
import { getValueByPattern } from '../../../utils'

/**
 * [业务]返回 object 创建新项的函数，传入新属性名称调用，会直接创建正确的新属性内容。
 * @param ctx
 * @param data
 * @param access
 * @param objectSchema
 * @returns `string`: 不能创建的原因; `CpuEditorAction`：代表正确创建，返回创建的`action`
 */
export const useObjectCreator = (
  ctx: CpuEditorContext,
  data: Record<string, any>,
  access: string[],
  objectSchema: MergedSchema | false | undefined
) => {
  return useCallback(
    (newPropName: string) => {
      const { properties, patternProperties, additionalProperties } = objectSchema || {}
      let newValueEntry = undefined
      if (data[newPropName] !== undefined) {
        return `字段 ${newPropName} 已经存在！`
      } else {
        const newPropRef =
          (properties && properties[newPropName]) ??
          (patternProperties && getValueByPattern(patternProperties, newPropName))
        if (!newPropRef) {
          if (additionalProperties !== false) {
            newValueEntry = additionalProperties
          } else {
            return `${newPropName} 不匹配 properties 中的名称或 patternProperties 中的正则式`
          }
        } else {
          newValueEntry = newPropRef
        }
      }
      return ctx.executeAction('create', access, newPropName, getDefaultValue(ctx, newValueEntry))
    },
    [data, objectSchema, access, ctx]
  )
}
