import { Input, Space } from 'antd'
import React from 'react'
import { toConstName } from '../../definition'
import { IFieldEditProps } from '../types'

export const ConstEdit = (props: IFieldEditProps) => {
  const { data } = props

  return (
    <Space style={{ flex: 1 }}>
      <Input key="const" size="small" value={toConstName(data)} disabled allowClear={false} />
    </Space>
  )
}
