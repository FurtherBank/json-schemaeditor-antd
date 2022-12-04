import React from 'react'
import { Drawer } from 'antd'
import { EditorDrawerProps } from '../types'

export const FieldDrawer = (props: EditorDrawerProps) => {
  const { onClose, visible, children } = props

  return (
    <Drawer title="详细" width={500} onClose={onClose} visible={visible} extra="在此做出的修改均会自动保存">
      {children}
    </Drawer>
  )
}
