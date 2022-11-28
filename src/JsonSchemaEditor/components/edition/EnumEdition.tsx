import { Input, Select } from 'antd'
import React, { useCallback } from 'react'
import { toConstName } from '../../definition'
import { exactIndexOf } from '../../utils'
import { EditionProps } from '../types'

export const EnumEdition = (props: EditionProps) => {
  const { data, route, field, fieldInfo } = props

  // 这里单独拿出来是为防止 ts 认为是 undefined
  const doAction = props.doAction!

  const { enum: enumValue = [] } = fieldInfo.mergedValueSchema || {}

  const handleValueChange = useCallback(
    (key: string) => {
      const i = parseInt(key)
      const value = enumValue[i]

      if (value !== undefined) doAction('change', route, field, value)
    },
    [doAction]
  )

  const enumIndex = exactIndexOf(enumValue, data)

  return (
    <Input.Group compact style={{ display: 'flex', flex: 1 }}>
      <Select
        key="enum"
        size="small"
        options={enumValue.map((value: any, i: number) => {
          return {
            value: i,
            label: toConstName(value)
          }
        })}
        className="resolve-flex"
        style={{ flex: 1 }}
        onChange={handleValueChange}
        value={enumIndex === -1 ? '' : toConstName(enumValue[enumIndex])}
        allowClear={false}
      />
    </Input.Group>
  )
}
