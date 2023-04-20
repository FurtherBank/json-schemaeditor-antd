import { Modal, TreeSelect } from 'antd'
import { cloneDeep } from 'lodash'
import React, { useState } from 'react'
import examples from './examples'

// 接下来是示例选择功能的定义
const ModalSelect = (props: { cb: (data: any, schema: any) => void; cancelCb: () => void; visible: boolean }) => {
  const { cb, cancelCb, visible } = props
  const [item, setItem] = useState('string')

  return (
    <Modal
      title="选择示例"
      okText="选择"
      cancelText="取消"
      onOk={() => {
        const data = cloneDeep(examples.plainData[item][0]),
          schema = cloneDeep(examples.plainData[item][1])
        cb(data, schema)
      }}
      onCancel={() => {
        cancelCb()
      }}
      open={visible}
    >
      <TreeSelect
        showSearch
        placeholder="选择示例"
        onChange={(value) => {
          setItem(value)
        }}
        dropdownStyle={{ maxHeight: 600, overflow: 'auto' }}
        treeDefaultExpandAll
        defaultValue={'string'}
        treeData={examples.data}
        style={{ width: '100%' }}
      />
    </Modal>
  )
}

export default ModalSelect
