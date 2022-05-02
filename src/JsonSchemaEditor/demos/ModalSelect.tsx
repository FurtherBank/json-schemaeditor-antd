import { Modal, Select } from 'antd';
import { cloneDeep } from 'lodash';
import React, { useState } from 'react';
import examples from './examples';
import { metaSchema } from 'json-schemaeditor-antd';

// 接下来是示例选择功能的定义
const exampleJson = examples(metaSchema)
const options = exampleJson.map((example, i) => {
  return { label: example[0], value: i.toString() };
}) as unknown as { label: string; value: string }[];

const ModalSelect = (props: {
  cb: (data: any, schema: any) => void;
  cancelCb: () => void;
  visible: boolean;
}) => {
  const { cb, cancelCb, visible } = props;
  const [item, setItem] = useState(0);

  return (
    <Modal
      title="选择示例"
      okText="选择"
      cancelText="取消"
      onOk={() => {
        const data = cloneDeep(exampleJson[item][1]),
          schema = cloneDeep(exampleJson[item][2]);
        cb(data, schema);
      }}
      onCancel={() => {
        cancelCb();
      }}
      visible={visible}
    >
      <Select
        showSearch
        placeholder="选择示例"
        optionFilterProp="label"
        onChange={(value) => {
          setItem(parseInt(value));
        }}
        filterOption={(input, option) => {
          return !!option && option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0;
        }}
        defaultValue={'0'}
        options={options}
        style={{ width: '100%' }}
      />
    </Modal>
  );
};

export default ModalSelect;
