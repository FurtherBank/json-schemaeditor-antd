import { TreeSelect } from 'antd'
import React from 'react'
import { ofSchemaCache } from '../../context/ofInfo'

interface OneOfOperationProps {
  opHandler: (value: string) => void
  opValue: string
  opParam: ofSchemaCache
}

export const OneOfOperation = (props: OneOfOperationProps) => {
  const { opHandler, opValue, opParam } = props
  return (
    <TreeSelect
      key="oneOf"
      size="small"
      treeData={opParam.options}
      onChange={opHandler}
      style={{ minWidth: '90px' }}
      dropdownMatchSelectWidth={180}
      value={opValue}
      allowClear={false}
    />
  )
}
