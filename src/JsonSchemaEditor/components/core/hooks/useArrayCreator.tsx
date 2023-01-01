import _ from 'lodash'
import { useCallback } from 'react'
import CpuEditorContext from '../../../context'
import { MergedSchema } from '../../../context/mergeSchema'
import { getDefaultValue } from '../../../definition/defaultValue'
import { addRef } from '../../../utils'

/**
 * [业务]返回 array 创建新项的函数，调用后会直接在 array 后面创建正确的新数组项内容。
 * @param ctx
 * @param data
 * @param access
 * @param arraySchema
 * @returns
 */
export const useArrayCreator = (
  ctx: CpuEditorContext,
  data: any[],
  access: string[],
  arraySchema: MergedSchema | false | undefined
) => {
  return useCallback(() => {
    const { maxItems, items, prefixItems } = arraySchema || {}
    // 数组新变量创建。注意如果使用已有变量直接创建时不要忘记深拷贝！
    const nowLength = data.length
    if (!maxItems || nowLength < maxItems) {
      if (prefixItems) {
        // 存在前缀约束的情况
        const { length: prefixLength, ref } = prefixItems
        if (nowLength < prefixLength) {
          // 新项处于 prefixItems 约束的位置时，通过对应 items 约束得到 defaultValue
          const defaultValue = getDefaultValue(ctx, addRef(ref, nowLength.toString()))
          ctx.executeAction('create', access, nowLength.toString(), defaultValue)
        } else if (nowLength === prefixLength && items) {
          // 如果新建项恰好不属于 prefixItems，而且 additional 允许建且有约束，使用这个约束
          const defaultValue = getDefaultValue(ctx, items)
          ctx.executeAction('create', access, nowLength.toString(), defaultValue)
        }
      } else if (data.length > 0) {
        // 此外如果有上一项(默认符合 schema)，copy 上一项
        ctx.executeAction('create', access, nowLength.toString(), _.cloneDeep(data[data.length - 1]))
      } else {
        // 有 items 约束，使用 items 默认值，否则 null
        ctx.executeAction('create', access, nowLength.toString(), items ? getDefaultValue(ctx, items) : null)
      }
    }
  }, [data, arraySchema, access, ctx])
}
