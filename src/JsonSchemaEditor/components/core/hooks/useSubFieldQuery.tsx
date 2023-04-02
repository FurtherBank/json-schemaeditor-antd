import React, { useCallback } from 'react'
import { ShortLevel } from '../../../definition'
import { IField } from '../../../Field'
import { getFieldSchema } from '../../../utils/schemaWithRef'
import { FatherInfo } from '../type/list'

/**
 * 返回一个函数，传入 key 和 shortLevel 可以取得 subField 的 Field 组件
 * @param data
 * @param access
 * @param fieldInfo
 * @param fatherInfo
 * @returns
 */
export const useSubFieldQuery = (
  data: Record<string, any> | any[],
  access: string[],
  fieldInfo: IField,
  fatherInfo: FatherInfo
) => {
  const { ctx, mergedValueSchema, valueEntry } = fieldInfo
  return useCallback(
    (key: string, short: ShortLevel) => {
      const subEntry = getFieldSchema(data, valueEntry, mergedValueSchema, key) || undefined
      const Field = ctx.Field
      return <Field route={access} field={key} fatherInfo={fatherInfo} schemaEntry={subEntry} short={short} />
    },
    [data, access, valueEntry, fieldInfo, fatherInfo, ctx]
  )
}
