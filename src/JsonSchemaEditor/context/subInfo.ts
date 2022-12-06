import { ShortLevel } from '../definition'
import { addRef } from '../utils'
import CpuEditorContext from '.'
import { isShort } from './virtual'
import { MergedSchema } from './mergeSchema'

export interface itemSubInfo {
  shortLv: ShortLevel
}

/**
 * 配置 itemInfo
 * @param ctx
 * @param mergedSchema
 * @returns
 */
export const makeItemInfo = (ctx: CpuEditorContext, mergedSchema: MergedSchema): itemSubInfo | null => {
  const { items, prefixItems } = mergedSchema
  if (typeof prefixItems === 'object') {
    const { ref: entry, length } = prefixItems
    let shortLv = 2
    // 先对 additional 进行判定，决定 shortLv 底线。
    if (items) {
      const additionalMergedSchema = ctx.getMergedSchema(items)
      const { title, [isShort]: shortable } = additionalMergedSchema || {}
      if (!additionalMergedSchema || !shortLv)
        return {
          shortLv: 0
        }
      shortLv = shortable ? (title ? 1 : 2) : 0
    } else {
      return {
        shortLv: 0
      }
    }
    // 如果没确定不能短优化，再看前缀
    for (let i = 0; i < length; i++) {
      const ref = addRef(entry, i.toString())!
      const itemMergedSchema = ctx.getMergedSchema(ref)
      const { title, [isShort]: shortable } = mergedSchema || {}
      if (!itemMergedSchema || !shortable) {
        return {
          shortLv: 0
        }
      }
      if (title) shortLv = Math.min(shortLv, 1)
    }
    return {
      shortLv
    }
  } else if (items) {
    // single-schema array
    const itemsMergedSchema = ctx.getMergedSchema(items)
    if (!itemsMergedSchema)
      return {
        shortLv: 0
      }
    const { title, [isShort]: shortable } = itemsMergedSchema
    return {
      shortLv: shortable ? (title ? 1 : 2) : 0
    }
  }

  return null
}
