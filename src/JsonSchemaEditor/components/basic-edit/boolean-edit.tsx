import { Switch } from 'antd'
import React from 'react'
import { IFieldEditProps } from '../types'

export const BooleanEdit = (props: IFieldEditProps<boolean>) => {
  const { data, onValueChange } = props

  return (
    <Switch checkedChildren="true" unCheckedChildren="false" checked={data} onChange={onValueChange} size="small" />
  )
}
