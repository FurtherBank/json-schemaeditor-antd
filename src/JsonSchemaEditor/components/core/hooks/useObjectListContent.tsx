import { useMemo } from 'react'
import { isShort } from '../../../context/virtual'
import { ShortLevel } from '../../../definition'
import { IField } from '../../../Field'
import { getValueByPattern } from '../../../utils'
import { ChildData, FieldDisplayList } from '../type/list'

/**
 * [业务] 给出对象数据的两表渲染参数。
 *
 * 注：此处不过滤空表，也不加入 create 表项。
 * @param data
 * @param schemaEntry
 * @param fieldInfo
 * @returns
 */
export const useObjectListContent = (data: Record<string, any>, schemaEntry: string | undefined, fieldInfo: IField) => {
  const { valueEntry, mergedValueSchema, ctx } = fieldInfo
  const { properties, additionalProperties, patternProperties } = mergedValueSchema || {}

  return useMemo(() => {
    const normalProps: ChildData[] = []
    const shortenProps: ChildData[] = []

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

    // 短表在前，长表在后
    const listShortLevel = [ShortLevel.short, ShortLevel.no]

    return [shortenProps, normalProps].map((propList, i) => ({
      short: listShortLevel[i],
      items: propList
    })) as [FieldDisplayList, FieldDisplayList]
  }, [schemaEntry, valueEntry, data])
}
