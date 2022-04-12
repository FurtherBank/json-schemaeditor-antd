import { CheckOutlined, CloseOutlined, PlusOutlined } from "@ant-design/icons"
import AutoComplete from "antd/lib/auto-complete"
import Button from "antd/lib/button"
import Input from "antd/lib/input"
import message from "antd/lib/message"
import _ from "lodash"
import React, { useState } from "react"
import { SchemaCache } from "."
import { FieldProps } from "./Field"
import { FatherInfo } from "./FieldList"
import { getDefaultValue } from "./FieldOptions"
import { PropertyInfo } from "./reducer"
import { addRef, concatAccess, findKeyRefs, getValueByPattern, iterToArray, matchKeys } from "./utils"

interface CreateNameProps {
  fatherInfo: FatherInfo
  fieldProps: FieldProps
  fieldCache: SchemaCache
  style?: React.CSSProperties
}

const CreateName = (props: CreateNameProps) => {
  const { fatherInfo, fieldProps, style, fieldCache } = props
  const { data, doAction, route, field} = fieldProps
  const { valueEntry, propertyCache, itemCache, valueSchemaMap } = fieldCache
  const access = concatAccess(route, field)

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState("")

  const propertyCacheValue =
    fatherInfo.type === "object" && valueEntry
      ? propertyCache.get(valueEntry)
      : undefined

  let autoCompleteOptions: any[] = []
  if (propertyCacheValue) {
    const { props, patternProps } = propertyCacheValue
    const optionStrings = props ? Object.keys(props).filter((key) => {
      return data[key] === undefined
    }) : []
    autoCompleteOptions = optionStrings.map((key) => {
      return { value: key }
    })
  }
  const handleClick = (e: React.SyntheticEvent) => {
    if (fatherInfo.type === "object") {
      setEditing(!editing)
    } else {
      // 数组新变量创建。注意如果使用已有变量直接创建时不要忘记深拷贝！
      const itemCacheValue = valueEntry ? itemCache.get(valueEntry) : undefined
      const nowLength = data.length
      if (itemCacheValue) {
        const { itemLength } = itemCacheValue
        const schemaRef = itemLength !== undefined ? nowLength < itemLength ? addRef(valueEntry, 'items', nowLength.toString()) : addRef(valueEntry, 'additionalItems') : addRef(valueEntry, 'items')
        const defaultValue = getDefaultValue(fieldCache, schemaRef)
        doAction!('create', access, nowLength.toString(), defaultValue)
      } else {
        doAction!('create', access, nowLength.toString(), _.cloneDeep(data[data.length-1] ?? null))
      }
    }
  }
  const handleNameChange = (value: string) => {
    setName(value)
  }
  const handleCreate = (e: React.SyntheticEvent) => {
    let newValueEntry = undefined
    if (data[name] !== undefined) {
      message.error(`字段 ${name} 已经存在！`)
      return
    } else {
      if (propertyCacheValue) {
        const { props, patternProps, additional } = propertyCacheValue
        const info = props[name] ?? getValueByPattern(patternProps, name) ?? additional
        if (!info) {
          message.error(
            `${name} 不匹配 properties 中的名称或 patternProperties 中的正则式`
          )
          return
        }
        const {ref, shortable} = info
        if (ref) {
          newValueEntry = ref
        } else {
          newValueEntry = findKeyRefs(valueSchemaMap!, 'additionalProperties') as string
        }
      }
    }
    doAction!('create', access, name, getDefaultValue(fieldCache, newValueEntry))
    setEditing(false)
  }
  return editing ? (
    <div style={{display: 'flex'}}>
      <AutoComplete
        options={autoCompleteOptions}
        filterOption={(inputValue, option) =>
          option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
        }
        
        value={name}
        onChange={handleNameChange}
        style={{flex: '1'}}
      >
        <Input size="small" addonBefore={"新属性名称"} onPressEnter={handleCreate}/>
      </AutoComplete>

      <Button size="small" shape="circle" onClick={handleCreate} style={{margin: '0 6px'}}>
        <CheckOutlined />
      </Button>
      <Button size="small" shape="circle" onClick={handleClick}>
        <CloseOutlined />
      </Button>
    </div>
  ) : (
    <Button
      type="dashed"
      icon={<PlusOutlined />}
      size="small"
      block
      onClick={handleClick}
      style={style}
    >
      {fatherInfo.type === "object" ? "Property" : "Item"}
    </Button>
  )
}

export default CreateName
