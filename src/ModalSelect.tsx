import React, { useMemo, useRef, useState } from "react"

import Examples from "./Examples"

import _, { cloneDeep } from "lodash"

import Modal from "antd/lib/modal"
import Select from "antd/lib/select"

const options = Examples.map((example, i) => {
  return { label: example[0], value: i.toString() }
}) as unknown as { label: string; value: string }[]

const ModalSelect = (props: { cb: (data: any, schema: any) => void, cancelCb: () => void, visible: boolean}) => {
  const {cb, cancelCb, visible} = props
  const [item, setItem] = useState(0)

  return (
    <Modal
      title="选择示例"
      okText="选择"
      cancelText="取消"
      onOk={() => {
        const data = cloneDeep(Examples[item][1]), schema = cloneDeep(Examples[item][2])
        cb(data, schema)
      }}
      onCancel={() => {
        cancelCb()
      }}
      visible={visible}
    >
      <Select
        showSearch
        placeholder="Select a person"
        optionFilterProp="label"
        onChange={(value) => {
          setItem(parseInt(value))
        }}
        filterOption={(input, option) => {
          return !!option && option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
        }}
        defaultValue={'0'}
        options={options}
        style={{width: "100%"}}
      />
    </Modal>
  )
}

export default ModalSelect