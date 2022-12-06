import { useMemo } from 'react'
import { MergedSchema } from '../../../context/mergeSchema'
import { jsonDataType } from '../../../utils'
import { FatherInfo } from '../type/list'

export const useFatherInfo = (
  data: Record<string, any> | any[],
  schemaEntry: string | undefined,
  valueEntry: string | undefined,
  mergedValueSchema: MergedSchema | false | undefined
) => {
  const dataType = jsonDataType(data)

  return useMemo((): FatherInfo => {
    const { required } = mergedValueSchema || {}
    const childFatherInfo: FatherInfo = {
      schemaEntry,
      valueEntry,
      type: dataType
    }
    switch (dataType) {
      case 'array':
        childFatherInfo.type = 'array'
        childFatherInfo.length = data.length
        break
      default:
        childFatherInfo.type = 'object'
        if (required) childFatherInfo.required = required
        break
    }
    return childFatherInfo
  }, [valueEntry, schemaEntry, dataType])
}
