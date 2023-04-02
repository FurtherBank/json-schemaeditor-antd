import range from 'lodash/range'
import { useMemo } from 'react'
import { isShort } from '../../../context/virtual'
import { canFieldCreate } from '../../../definition/schema'
import { IField } from '../../../Field'
import { addRef } from '../../../utils'
import { ChildData, EmptyChildData, FieldDisplayList } from '../type/list'

/**
 * [业务] 给出数组数据的两表渲染参数。
 *
 * 注：
 *
 * - 该函数输出短等级不一致的，最多两个列表。
 * - 如果可以创建新的列表项，最后一个列表的最后一项为`null`
 * @param data
 * @param schemaEntry
 * @param fieldInfo
 * @returns
 */
export const useArrayListContent = (
  data: any[],
  schemaEntry: string | undefined,
  fieldInfo: IField
): FieldDisplayList[] => {
  const { valueEntry, mergedValueSchema, ctx } = fieldInfo
  const { prefixItems: { length: prefixLength = undefined, ref: prefixRef = '' } = {}, items } = mergedValueSchema || {}

  return useMemo(() => {
    const prefixList: ChildData[] = []
    const itemsList: (ChildData | EmptyChildData)[] = []

    // 分别确定两个表的短字段等级
    const prefixIsShort = prefixLength
      ? Math.min(
          ...range(prefixLength).map((i) => {
            const { [isShort]: shortable, title } = ctx.getMergedSchema(addRef(prefixRef, i.toString())) || {}
            return shortable ? (title ? 1 : 2) : 0
          })
        )
      : 0

    const { [isShort]: itemsShortable = false, title = undefined } = items ? ctx.getMergedSchema(items) || {} : {}

    const listShortLevel = [prefixIsShort, itemsShortable ? (title ? 1 : 2) : 0]

    // 如果前缀和余项的短字段等级不同，按照项是否为前缀项，分到两个表中
    if (listShortLevel[0] !== listShortLevel[1] && prefixLength !== undefined) {
      const prefixListLength = Math.min(prefixLength, data.length)
      for (let i = 0; i < prefixListLength; i++) {
        prefixList.push({
          key: i.toString(),
          value: data[i]
        })
      }
    }
    for (let i = prefixLength ?? 0; i < data.length; i++) {
      itemsList.push({
        key: i.toString(),
        value: data[i]
      })
    }

    // 如果可以创建新项，在第二个表后面加入 { key: '' }，代表该项为 create 组件
    const canCreate = canFieldCreate(data, fieldInfo)
    if (canCreate) itemsList.push({ key: '' })

    return [prefixList, itemsList]
      .map((propList, i) => ({
        short: listShortLevel[i],
        items: propList
      }))
      .filter((list) => list.items.length > 0)
  }, [schemaEntry, valueEntry, data, ctx])
}
