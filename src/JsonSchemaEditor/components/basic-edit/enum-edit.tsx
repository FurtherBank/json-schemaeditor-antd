import { Input, Select } from 'antd'
import React, { useCallback } from 'react'
import { toConstName } from '../../definition'
import { exactIndexOf } from '../../utils'
import { IFieldEditProps } from '../types'

export const EnumEdit = (props: IFieldEditProps) => {
  const { data, onValueChange, fieldInfo } = props
  const { enum: enumValue = [] } = fieldInfo.mergedValueSchema || {}
  const handleValueChange = useCallback(
    (value) => {
      onValueChange(enumValue[value])
    },
    [enumValue]
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
        value={enumIndex === -1 ? '' : enumIndex}
        allowClear={false}
      />
    </Input.Group>
  )
}
