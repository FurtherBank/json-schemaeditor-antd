import { Input, Space } from 'antd'
import React from 'react'
import { toConstName } from '../../../definition'
import { EditionProps } from '../@cpu-studio/json-editor/type/props'

export const ConstEdition = (props: EditionProps) => {
  const { data } = props

  return (
    <Space style={{ flex: 1 }}>
      <Input key="const" size="small" value={toConstName(data)} disabled allowClear={false} />
    </Space>
  )
}
