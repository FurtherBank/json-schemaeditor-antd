import { useMemo } from 'react'
import { isShort } from '../../../context/virtual'
import { ShortLevel } from '../../../definition'
import { canFieldCreate } from '../../../definition/schema'
import { IField } from '../../../Field'
import { getValueByPattern } from '../../../utils'
import { ChildData, EmptyChildData, FieldDisplayList } from '../type/list'

/**
 * [业务] 给出对象数据的两表渲染参数。
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
export const useObjectListContent = (
  data: Record<string, any>,
  schemaEntry: string | undefined,
  fieldInfo: IField
): FieldDisplayList[] => {
  const { valueEntry, mergedValueSchema, ctx } = fieldInfo
  const { properties, additionalProperties, patternProperties } = mergedValueSchema || {}

  return useMemo(() => {
    const shortenProps: ChildData[] = []
    const normalProps: (ChildData | EmptyChildData)[] = []

    // 短表在前，长表在后
    const listShortLevel = [ShortLevel.short, ShortLevel.no]

    // 按照属性是否是短字段分到两个表中
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = data[key]
        const patternRef = patternProperties ? getValueByPattern(patternProperties, key) : undefined
        const propRealRef =
          properties && properties[key] ? properties[key] : patternRef ? patternRef : additionalProperties
        if (propRealRef) {
          const { [isShort]: shortable } = ctx.getMergedSchema(propRealRef) || {}
          if (shortable) {
            shortenProps.push({
              key,
              value: data[key]
            })
            continue
          }
        }
        normalProps.push({ key, value })
      }
    }

    // 如果可以创建新项，在第二个表后面加入 null，代表该项为 create 组件
    const canCreate = canFieldCreate(data, fieldInfo)
    if (canCreate) normalProps.push({ key: '' })

    return [shortenProps, normalProps]
      .map((propList, i) => ({
        short: listShortLevel[i],
        items: propList
      }))
      .filter((list) => list.items.length > 0)
  }, [schemaEntry, valueEntry, data])
}
