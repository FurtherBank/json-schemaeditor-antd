import { CheckOutlined, CloseOutlined, PlusOutlined } from '@ant-design/icons'
import { AutoComplete, Button, Input, message } from 'antd'
import _ from 'lodash'
import React, { useState } from 'react'
import { FieldProps, IField } from '../Field'
import { FatherInfo } from '../FieldList'
import { getDefaultValue } from '../definition'
import { arrayRefInfo } from '../info'
import { addRef, concatAccess, getValueByPattern } from '../utils'

interface CreateNameProps {
  fatherInfo: FatherInfo
  fieldProps: FieldProps
  fieldInfo: IField
  style?: React.CSSProperties
}

const CreateName = (props: CreateNameProps) => {
  const { fatherInfo, fieldProps, style, fieldInfo } = props
  const { data, doAction, route, field } = fieldProps
  const { ctx, mergedValueSchema } = fieldInfo
  const access = concatAccess(route, field)

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')

  const { properties, items, additionalItems, maxItems, additionalProperties, patternProperties } =
    mergedValueSchema || {}

  let autoCompleteOptions: any[] = []
  if (fatherInfo.type === 'object') {
    // todo: 考察 notInAutoFill 以及 create 是否允许
    const optionStrings = properties
      ? Object.keys(properties).filter((key) => {
          return data[key] === undefined
        })
      : []
    autoCompleteOptions = optionStrings.map((key) => {
      return { value: key }
    })
  }
  const handleClick = () => {
    if (fatherInfo.type === 'object') {
      setEditing(!editing)
    } else if (fatherInfo.type === 'array') {
      // 数组新变量创建。注意如果使用已有变量直接创建时不要忘记深拷贝！
      const nowLength = data.length
      if (!maxItems || nowLength < maxItems) {
        const { length: itemLength, ref } = typeof items === 'object' ? items : ({} as Partial<arrayRefInfo>)
        if (itemLength !== undefined && nowLength < itemLength) {
          // 新项处于 items 约束的位置时，通过对应 items 约束得到 defaultValue
          const defaultValue = getDefaultValue(ctx, addRef(ref, nowLength.toString()))
          doAction!('create', access, nowLength.toString(), defaultValue)
        } else if (nowLength === itemLength && additionalItems) {
          // 如果新建项恰好不属于 items，而且 additional 允许建且有约束，使用这个约束
          const defaultValue = getDefaultValue(ctx, additionalItems)
          doAction!('create', access, nowLength.toString(), defaultValue)
        } else {
          // 其它情况，copy 上一项
          doAction!('create', access, nowLength.toString(), _.cloneDeep(data[data.length - 1] ?? null))
        }
      } else {
        throw new Error(`错误：在数组项将超过 maxItems=${maxItems} 时显示了创建按钮。`)
      }
    }
  }
  const handleNameChange = (value: string) => {
    setName(value)
  }
  const handleCreate = () => {
    let newValueEntry = undefined
    if (data[name] !== undefined) {
      message.error(`字段 ${name} 已经存在！`)
      return
    } else {
      const info =
        (properties && properties[name]) ??
        (patternProperties && getValueByPattern(patternProperties, name)) ??
        additionalProperties
      if (!info) {
        message.error(`${name} 不匹配 properties 中的名称或 patternProperties 中的正则式`)
        return
      } else {
        newValueEntry = info
      }
    }
    doAction!('create', access, name, getDefaultValue(ctx, newValueEntry))
    setEditing(false)
  }
  return editing ? (
    <div style={{ display: 'flex' }}>
      <AutoComplete
        options={autoCompleteOptions}
        filterOption={(inputValue, option) => option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1}
        value={name}
        onChange={handleNameChange}
        style={{ flex: '1' }}
      >
        <Input size="small" addonBefore={'新属性名称'} onPressEnter={handleCreate} />
      </AutoComplete>

      <Button size="small" shape="circle" onClick={handleCreate} style={{ margin: '0 6px' }}>
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

export default CreateName
