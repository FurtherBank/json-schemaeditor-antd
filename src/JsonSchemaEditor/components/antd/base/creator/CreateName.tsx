import { CheckOutlined, CloseOutlined, PlusOutlined } from '@ant-design/icons'
import { AutoComplete, Button, Input, message } from 'antd'
import React, { useCallback, useState } from 'react'
import { FieldProps, IField } from '../../../../Field'
import { concatAccess } from '../../../../utils'
import { useArrayCreator } from '../../../core/hooks/useArrayCreator'
import { useObjectCreator } from '../../../core/hooks/useObjectCreator'
import { FatherInfo } from '../../../core/type/list'

export interface CreateNameProps {
  fatherInfo: FatherInfo
  fieldProps: FieldProps
  fieldInfo: IField
  style?: React.CSSProperties
}

export const ObjectPropCreator = (props: CreateNameProps) => {
  const { fatherInfo, fieldProps, style, fieldInfo } = props
  const { data, route, field } = fieldProps
  const { ctx, mergedValueSchema } = fieldInfo
  const access = concatAccess(route, field)

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')

  const { properties } = mergedValueSchema || {}

  // todo: 考察 notInAutoFill 以及 create 是否允许
  const optionStrings = properties
    ? Object.keys(properties).filter((key) => {
        return data[key] === undefined
      })
    : []
  const autoCompleteOptions = optionStrings.map((key) => {
    return { value: key }
  })

  // name 编辑交互
  const handleClick = useCallback(() => {
    setEditing(!editing)
  }, [editing, setEditing])

  const handleNameChange = (value: string) => {
    setName(value)
  }

  // 从 object 创建 prop 事件
  const createObjectProp = useObjectCreator(ctx, data, access, mergedValueSchema)

  const handleObjectCreate = useCallback(() => {
    const actionOrError = createObjectProp(name)
    if (typeof actionOrError === 'string') {
      message.error(actionOrError)
    } else {
      setEditing(false)
    }
  }, [createObjectProp, setEditing])

  return editing ? (
    <div style={{ display: 'flex' }}>
      <AutoComplete
        options={autoCompleteOptions}
        filterOption={(inputValue, option) => option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1}
        value={name}
        onChange={handleNameChange}
        style={{ flex: '1' }}
      >
        <Input size="small" addonBefore={'新属性名称'} onPressEnter={handleObjectCreate} />
      </AutoComplete>

      <Button size="small" shape="circle" onClick={handleObjectCreate} style={{ margin: '0 6px' }}>
        <CheckOutlined />
      </Button>
      <Button size="small" shape="circle" onClick={handleClick}>
        <CloseOutlined />
      </Button>
    </div>
  ) : (
    <Button type="dashed" icon={<PlusOutlined />} size="small" block onClick={handleClick} style={style}>
      {fatherInfo.type === 'object' ? 'Property' : 'Item'}
    </Button>
  )
}

export const ArrayItemCreator = (props: CreateNameProps) => {
  const { fatherInfo, fieldProps, style, fieldInfo } = props
  const { data, route, field } = fieldProps
  const { ctx, mergedValueSchema } = fieldInfo
  const access = concatAccess(route, field)

  const createArrayItem = useArrayCreator(ctx, data, access, mergedValueSchema)

  return (
    <Button type="dashed" icon={<PlusOutlined />} size="small" block onClick={createArrayItem} style={style}>
      {fatherInfo.type === 'object' ? 'Property' : 'Item'}
    </Button>
  )
}
