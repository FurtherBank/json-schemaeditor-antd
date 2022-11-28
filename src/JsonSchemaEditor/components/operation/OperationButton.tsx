import { ArrowUpOutlined, ArrowDownOutlined, DeleteOutlined, UndoOutlined, RedoOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import React from 'react'
import { MenuActionProps } from '../types'

const actionIcon = {
  moveup: <ArrowUpOutlined />,
  movedown: <ArrowDownOutlined />,
  delete: <DeleteOutlined />,
  undo: <UndoOutlined />,
  redo: <RedoOutlined />,
  detail: null
}

export const OperationButton = (props: MenuActionProps) => {
  const { opType, opHandler } = props
  return (
    <Button key={opType} icon={actionIcon[opType]} size="small" shape="circle" onClick={opHandler} title={opType} />
  )
}
