import { Select } from 'antd'
import React from 'react'

interface TypeOperationProps {
  opHandler: (value: string) => void
  opValue: string
  opParam: string[]
}

export const TypeOperation = (props: TypeOperationProps) => {
  const { opHandler, opValue, opParam } = props
  return (
    <Select
      key="type"
      size="small"
      options={opParam.map((value: string) => {
        return { value: value, label: value }
      })}
      onChange={opHandler}
      value={opValue}
      allowClear={false}
      style={{ width: '80px' }}
    />
  )
}
