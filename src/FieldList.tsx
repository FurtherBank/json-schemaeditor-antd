import { PlusOutlined } from '@ant-design/icons';
import Button from 'antd/lib/button';
import List from 'antd/lib/list';
import React from 'react';
import CreateName from './CreateName';
import Field, { FatherInfo, FieldProps } from './Field';
import { gridOption } from './FieldOptions';
import { ShortOpt } from './reducer';
import { concatAccess, getFieldSchema, jsonDataType } from './utils';

interface FieldListProps {
  fieldProps: FieldProps,
  short: ShortOpt
  content: any[]
  fatherInfo: FatherInfo
}

const FieldList = (props: FieldListProps) => {
  const {content, fieldProps, fatherInfo, short } = props
  const doAction = fieldProps.doAction!
  const {data, route, field, setDrawer, cache, valueEntry} = fieldProps
  const dataType = jsonDataType(data)
  const access = concatAccess(route, field)
  return (
    <List
      size='small'
      split={false}
      dataSource={content}
      grid={gridOption[short]}
      pagination={content.length > 16 ? {
        simple: true,
        pageSize: 16,
      } : undefined}
      renderItem={(item) => {
        const { key, end, data: itemData } = item;
        if (itemData) {
          return (<FieldList
            key="start"
            content={itemData}
            fieldProps={fieldProps}
            fatherInfo={fatherInfo}
            short={ShortOpt.short}
          />)
        } else if (!end)
          return (<List.Item key={'property-' + key}
          >
          <Field
            route={access}
            field={key}
            fatherInfo={fatherInfo.type ? fatherInfo : undefined}
            schemaEntry={getFieldSchema(fieldProps, key)}
            short={short}
            setDrawer={setDrawer}
          />
        </List.Item>)
        else
          return (
            <List.Item key="end" 
            >
              <CreateName 
              fatherInfo={fatherInfo}
              fieldProps={fieldProps}
              />

            </List.Item>
          );
      }}
    />
  );
}

export default FieldList