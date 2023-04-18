import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  DeleteOutlined,
  UndoOutlined,
  RedoOutlined,
  RetweetOutlined
} from '@ant-design/icons'
import { Button } from 'antd'
import React from 'react'
import { MenuActionProps } from '@cpu-studio/json-editor/src/components/type/props'

const actionIcon = {
  reset: <RetweetOutlined />,
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
