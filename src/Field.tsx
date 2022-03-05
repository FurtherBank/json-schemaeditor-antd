/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-case-declarations */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react"
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EllipsisOutlined,
  PlusOutlined,
} from "@ant-design/icons"

import "antd/dist/antd.compact.css"
import Button from "antd/lib/button"
import Card from "antd/lib/card"
import Collapse from "antd/lib/collapse"
import Input from "antd/lib/input"
import InputNumber from "antd/lib/input-number"
import TreeSelect from "antd/lib/tree-select"
import Select from "antd/lib/select"
import Space from "antd/lib/space"
import Tooltip from "antd/lib/tooltip"
import Tabs from "antd/lib/tabs"
import _ from "lodash"
import { connect } from "react-redux"
import cacheInput from "./utils/cacheInput"
import {
  canDelete,
  canSchemaCreate,
  canSchemaRename,
  defaultTypeValue,
  getDefaultValue,
  getFormatType,
  maxCollapseLayer,
  schemaShortable,
  toEnumName,
  toOfName,
} from "./FieldOptions"
import { ajvInstance, Caches, doAction, JsonTypes, ofSchemaCache, ShortOpt } from "./reducer"
import {
  absorbProperties,
  filterObjSchema,
  concatAccess,
  exactIndexOf,
  getFieldSchema,
  getRefSchemaMap,
  jsonDataType,
  findKeyRefs,
  getPathVal,
  addRef,
  extractSchema,
  matchKeys,
  iterToArray,
  filterIter,
  getError,
  deepReplace,
} from "./utils"
import Switch from "antd/lib/switch"
import FieldList from "./FieldList"
import Dropdown from "antd/lib/dropdown"
import { Menu } from "antd"
import TextArea from "antd/lib/input/TextArea"
import Layout, { Content } from "antd/lib/layout/layout"
import Sider from "antd/lib/layout/Sider"
import CreateName from "./CreateName"
import { SelectableGroup } from "react-selectable-fast"
import ItemList from "./ItemList"
import { useState } from "react"
import { DataItemProps } from "./DataItem"
const { Panel } = Collapse

export interface FieldProps {
  route: string[] // 只有这个属性是节点传的
  field: string | null // route的最后
  fatherInfo?: FatherInfo
  schemaEntry?: string | undefined
  valueEntry?: string | undefined
  short?: ShortOpt
  setDrawer?: Function
  canNotRename?: boolean | undefined
  // redux props
  rootSchema?: boolean | Schema | undefined
  entrySchemaMap?: Map<string, boolean | Schema>
  valueSchemaMap?: Map<string, boolean | Schema>
  cache?: Caches
  doAction?: Function
  editionName?: string
  data?: any
  reRender?: any
  dataErrors?: any[]
}

/**
 * 原则上来自于父字段的信息，不具有子字段特异性
 */
export interface FatherInfo {
  type?: string // 是父亲的实际类型，非要求类型
  length?: number // 如果是数组，给出长度
  schemaEntry: string | undefined // 父亲的 schemaEntry
  valueEntry: string | undefined // 父亲的 schemaEntry
}

export interface ChildData {
  key: string
  value: any
  end?: boolean
  data?: ChildData[]
}

const CInput = cacheInput(Input),
  CInputNumber = cacheInput(InputNumber),
  CTextArea = cacheInput(TextArea)

const sideActions = ["detail", "moveup", "movedown", "oneOf", "type", "delete"]
/**
 * 动作空间函数，理应有。
 * 注意：该函数输出的顺序影响侧栏动作按钮的顺序！
 */
const actionSpace = (props: FieldProps, error: any | undefined) => {
  const { fatherInfo, field, data, schemaEntry, entrySchemaMap, valueSchemaMap, short, cache } = props
  const { ofCache, propertyCache, itemCache } = cache!
  const dataType = jsonDataType(data)
  const schemas = []
  for (const iterator of entrySchemaMap!.values()) {
    schemas.push(iterator)
  }
  const filteredSchemas = filterObjSchema(schemas)
  const hasFalse = schemas.includes(false)
  const result = new Map()
  // 对象和数组 在schema允许的情况下可以 create
  if (data instanceof Array || data instanceof Object) {
    const autoCompleteFields = canSchemaCreate(props)
    if (autoCompleteFields) result.set("create", autoCompleteFields)
  }

  // 父亲是数组，且自己的索引不超限的情况下，加入 move
  if (fatherInfo && fatherInfo.type === "array") {
    const index = parseInt(field!)
    if (index - 1 >= 0) result.set("moveup", true)
    if (index + 1 < fatherInfo.length!) result.set("movedown", true)
  }

  // 按照 enums/oneOf/types 分类
  const constSchema = absorbProperties(filteredSchemas, "const", "first") as any | undefined
  const enums = absorbProperties(filteredSchemas, "enum", "first") as any[] | undefined
  const ofCacheValue = schemaEntry ? ofCache.get(schemaEntry) : undefined
  if (constSchema !== undefined) {
    result.set("const", constSchema)
  } else if (enums !== undefined) {
    result.set("enum", enums)
  } else if (ofCacheValue) {
    result.set("oneOf", ofCacheValue)
  } else {
    // 如果类型可能性有多种，使用 'type' 切换属性
    const types = absorbProperties(filteredSchemas, "type", "intersection")
    if (hasFalse || types.length !== 1) result.set("type", types.length > 0 ? types : JsonTypes)
  }

  // 短优化时，如果有 const/enum 或者类型错误，加入detail
  if (short && (result.has("const") || result.has("enum") || error)) result.set("detail", true)

  // 如果父亲是对象/数组，且属性可删除，加入删除功能
  if (fatherInfo && fatherInfo.type) {
    if (canDelete(props)) result.set("delete", true)
  }

  return result
}

/**
 * 验证数据符合 oneOf/anyOf 的哪一个选项
 * @param props
 * @param of 指明是 oneOf/anyOf
 * @returns
 */
const getOfOption = (
  data: any,
  schemaEntry: string,
  ofCache: Map<string, ofSchemaCache | null>,
  optValue = ""
): string | null | false => {
  const ofCacheValue = schemaEntry ? ofCache.get(schemaEntry) : null
  if (ofCacheValue) {
    const { extracted, ofLength, ofRef } = ofCacheValue
    for (let i = 0; i < ofLength; i++) {
      extracted.$ref = "#/definitions/subSchema" + i
      const valid = ajvInstance.validate(_.clone(extracted), data)
      if (valid) {
        optValue += optValue ? `-${i}` : i.toString()
        const optRef = addRef(ofRef, i.toString())!
        const optOfCacheValue = ofCache.get(optRef)
        if (optOfCacheValue) {
          return getOfOption(data, optRef, ofCache, optValue)
        }
        return optValue
      }
    }
    return false
  }
  return null
}

/**
 * 通过 of 链找到schema经层层选择之后引用的
 * @param ofCache
 * @param schemaEntry
 * @param ofChain
 */
const getRefByOfChain = (ofCache: Map<string, ofSchemaCache | null>, schemaEntry: string, ofChain: string) => {
  const ofSelection = ofChain.split("-")
  for (const opt of ofSelection) {
    const { ofRef } = ofCache.get(schemaEntry)!
    schemaEntry = addRef(ofRef, opt)!
  }
  return schemaEntry
}

const stopBubble = (e: React.SyntheticEvent) => {
  e.stopPropagation()
}

const FieldBase = (props: FieldProps) => {
  const {
    data,
    route,
    field,
    valueSchemaMap,
    dataErrors,
    schemaEntry,
    cache,
    short,
    valueEntry,
    entrySchemaMap,
    canNotRename,
    setDrawer,
  } = props
  // 这里单独拿出来是为防止被undefined
  const { ofCache, propertyCache, itemCache } = cache!
  const doAction = props.doAction!

  const dataType = jsonDataType(data)
  const access = concatAccess(route, field)
  const error = getError(dataErrors!, access)

  const space = actionSpace(props, error)
  const valueType = space.has("const") ? "const" : space.has("enum") ? "enum" : dataType

  const title = absorbProperties(entrySchemaMap!, "title", "first") as string | undefined
  const description = absorbProperties(entrySchemaMap!, "description", "first")
  const fieldNameRange = canSchemaRename(props)
  const itemCacheValue = itemCache.get(valueEntry!)

  const format = absorbProperties(valueSchemaMap!, "format", "first")
  const formatType = getFormatType(format)
  const types = absorbProperties(entrySchemaMap!, "type", "intersection")

  // 对数组json专用的 列表选择特性
  const [currentItem, setCurrentItem] = useState(0)

  const handleSelectable = (selectedItems: React.Component<DataItemProps>[]) => {
    const ids: number[] = selectedItems.map((v) => {
      return v.props.id
    })
    if (ids.length > 0) {
      setCurrentItem(ids[0])
    }
  }

  // 渲染排错
  if (dataType === "undefined") {
    console.log("错误的渲染:", props)
    return null
  }
  console.log("渲染", route.join("/"), field, data)

  // 1. 设置标题组件
  const spaceStyle =
    short === ShortOpt.extra
      ? {
          marginRight: "6px",
        }
      : short === ShortOpt.short
      ? {
          width: "115px",
        }
      : {}
  const titleName = fieldNameRange === "" || fieldNameRange instanceof RegExp ? field : fieldNameRange
  const titleCom = (
    <Space onClick={stopBubble} style={spaceStyle}>
      {
        error ? (
          <Tooltip title={error.message} placement="topLeft" key="valid">
            <CloseCircleOutlined style={{ color: "red" }} />
          </Tooltip>
        ) : null
        // <CheckCircleOutlined
        //   className="site-result-demo-right-icon"
        //   style={{ color: "green" }}
        // />
      }

      {short !== ShortOpt.extra ? (
        <Tooltip title={description} placement="topLeft" key="name">
          {!canNotRename && (fieldNameRange === "" || fieldNameRange instanceof RegExp) ? (
            <CInput
              size="small"
              bordered={false}
              style={{
                textDecoration: "underline",
                width: "130px",
                padding: "0",
              }}
              value={field} // todo: validate the propertyName
              validate={(v) => {
                return fieldNameRange instanceof RegExp ? fieldNameRange.test(v) : true
              }}
              onPressEnter={(e: any) => {
                e.currentTarget.blur()
              }}
              onValueChange={(value) => {
                doAction("rename", route, field, value)
              }}
            />
          ) : (
            <span style={{ width: "100px" }}>{titleName}</span>
          )}
        </Tooltip>
      ) : null}
    </Space>
  )

  const valueChangeAction = (value: any) => {
    doAction("change", route, field, value)
  }

  // 2. 设置值组件

  const getStringFormatCom = (format: string) => {
    const allUsedProps = {
      size: "small",
      key: "value",
      value: data,
      onValueChange: valueChangeAction,
      validate: true,
      onPressEnter: (e: any) => {
        e.currentTarget.blur()
      },
    }
    switch (format) {
      case "multiline":
        // 所有需要使用 textarea 输入的格式用这个
        return <CTextArea {...allUsedProps} style={{ flex: 1 }} autoSize={{ minRows: 3, maxRows: 5 }} />
      case "row":
      case "uri-reference":
        // 所有使用 row 输入的格式，用这个
        return <CInput {...allUsedProps} style={{ flex: 1, minWidth: "400px", flexBasis: "400px" }} />
      default:
        return <CInput {...allUsedProps} style={{ flex: 1 }} />
    }
  }
  const getValueCom = (valueType: string) => {
    switch (valueType) {
      case "const":
        const equalConst = _.isEqual(data, space.get("const"))
        return (
          <Space style={{ flex: 1 }}>
            <Input key="const" size="small" value={toEnumName(data)} disabled allowClear={false} />
          </Space>
        )
      case "enum":
        const enumIndex = exactIndexOf(space.get("enum"), data)
        return (
          <Input.Group compact style={{ display: "flex", flex: 1 }}>
            <Select
              key="enum"
              size="small"
              options={space.get("enum").map((value: any, i: number) => {
                return {
                  value: i,
                  label: toEnumName(value),
                }
              })}
              style={{ flex: 1 }}
              onChange={(value, options) => {
                doAction("change", route, field, space.get("enum")[value])
              }}
              value={enumIndex === -1 ? "" : enumIndex}
              allowClear={false}
            />
          </Input.Group>
        )
      case "string":
        return getStringFormatCom(format)
      case "number":
        return (
          <CInputNumber
            size="small"
            key="value"
            value={data}
            validate
            onValueChange={valueChangeAction}
            onPressEnter={(e: any) => {
              e.target.blur()
            }}
            style={{ flex: 1 }}
          />
        )
      case "boolean":
        return (
          <Switch
            checkedChildren="true"
            unCheckedChildren="false"
            defaultChecked={data}
            onChange={valueChangeAction}
            size="small"
          />
        )
      case "null":
        return <span>null</span>
      default:
        return null
    }
  }
  const valueCom = getValueCom(valueType)

  const actionEvents = {
    detail: () => {
      if (setDrawer) setDrawer(route, field)
    },
    moveup: () => {
      doAction("moveup", route, field)
    },
    movedown: () => {
      doAction("movedown", route, field)
    },
    delete: () => {
      doAction("delete", route, field)
    },
    type: (value: string) => {
      doAction("change", route, field, defaultTypeValue[value])
    },
  } as any

  if (!short) {
    // 3. 设置右上动作栏组件(短优化后改为动作菜单)
    const sideActionComSpace = (action: string) => {
      switch (action) {
        case "oneOf":
          const { options, ofRef } = space.get("oneOf") as ofSchemaCache
          const ofIndex = getOfOption(data, schemaEntry!, ofCache) || " "
          return (
            <TreeSelect
              key="oneOf"
              size="small"
              treeData={options}
              onChange={(value, labellist, extra) => {
                const schemaRef = getRefByOfChain(ofCache, schemaEntry!, value)
                const defaultValue = getDefaultValue(props, schemaRef)
                doAction("change", route, field, defaultValue)
              }}
              style={{ minWidth: "90px" }}
              dropdownMatchSelectWidth={180}
              value={ofIndex}
              allowClear={false}
            />
          )
        case "moveup":
          return (
            <Button key="up" icon={<ArrowUpOutlined />} size="small" shape="circle" onClick={actionEvents.moveup} />
          )
        case "movedown":
          return (
            <Button
              key="down"
              icon={<ArrowDownOutlined />}
              size="small"
              shape="circle"
              onClick={actionEvents.movedown}
            />
          )
        case "delete":
          return (
            <Button key="delete" icon={<DeleteOutlined />} size="small" shape="circle" onClick={actionEvents.delete} />
          )
        case "type":
          return (
            <Select
              key="type"
              size="small"
              options={space.get("type").map((value: string) => {
                return { value: value, label: value }
              })}
              onChange={actionEvents.type}
              value={dataType}
              allowClear={false}
              style={{ width: "80px" }}
            />
          )
        default:
          break
      }
    }
    const actionComKeys = sideActions.filter((value) => {
      return space.has(value)
    })
    const actionComs = actionComKeys.map((value) => sideActionComSpace(value))

    // 4. 为 object/array 设置子组件
    let children: ChildData[] = []
    const childFatherInfo: FatherInfo = {
      schemaEntry,
      valueEntry,
    }

    if (dataType === "array") {
      // todo: 短优化筛查并给出子组件
      childFatherInfo.type = "array"
      childFatherInfo.length = data.length

      children = data.map((value: any, i: number) => {
        return { key: i.toString(), value }
      })
    } else if (dataType === "object") {
      childFatherInfo.type = "object"

      const propertyCacheValue = valueEntry ? propertyCache.get(valueEntry) : null
      const shortenProps: string[] = []
      // todo: 分开查找可优化的项，然后按顺序排列
      for (const key in data) {
        const value = data[key]
        if (propertyCacheValue) {
          const { shortProps, otherProps, additionalShortAble } = propertyCacheValue
          if (matchKeys(shortProps, key) || (!matchKeys(otherProps, key) && additionalShortAble)) {
            shortenProps.push(key)
            continue
          }
        }
        children.push({ key, value })
      }
      if (shortenProps.length > 0) {
        const shortenChildren = shortenProps.map((key) => {
          const value = data[key]
          return {
            key,
            value,
          }
        })
        children.unshift({ data: shortenChildren, key: "", value: "" })
      }
    }

    return access.length === 0 && dataType === "array" && _.isEqual(types, ["array"]) ? (
      <Layout>
        <Sider theme={"light"} style={{ display: "flex", flexDirection: "column" }}>
          <SelectableGroup
            clickClassName="tick"
            enableDeselect={true}
            tolerance={0}
            deselectOnEsc={false}
            allowClickWithoutSelected={true}
            resetOnStart={true}
            onSelectionFinish={handleSelectable}
            ignoreList={[".not-selectable"]}
          >
            <ItemList items={children} />
          </SelectableGroup>
          {space.has("create") ? <CreateName fatherInfo={childFatherInfo} fieldProps={props} /> : null}
        </Sider>
        <Content>
          <Field
            route={access}
            field={currentItem.toString()}
            fatherInfo={childFatherInfo.type ? childFatherInfo : undefined}
            schemaEntry={getFieldSchema(props, currentItem.toString())}
            short={short}
            setDrawer={setDrawer}
          />
        </Content>
      </Layout>
    ) : dataType === "object" || dataType === "array" ? (
      <Collapse defaultActiveKey={access.length < maxCollapseLayer ? ["theoneandtheonly"] : undefined}>
        <Panel key="theoneandtheonly" header={titleCom} extra={<Space onClick={stopBubble}>{actionComs}</Space>}>
          <FieldList
            fieldProps={props}
            content={children}
            fatherInfo={childFatherInfo}
            short={dataType === "array" && itemCacheValue ? itemCacheValue.shortOpt : ShortOpt.no}
            canCreate={space.has("create")}
          />
        </Panel>
      </Collapse>
    ) : (
      <Card
        title={titleCom}
        size="small"
        extra={
          <Space>
            {formatType !== 2 ? valueCom : null}
            {actionComs}
          </Space>
        }
        bodyStyle={formatType !== 2 ? { display: "none" } : {}}
      >
        {formatType === 2 ? valueCom : null}
      </Card>
    )
  } else {
    // 3. 设置动作菜单
    const menuAction = (e: { key: string }) => {
      const { key } = e
      if (typeof actionEvents[key] === "function") actionEvents[key](e)
    }

    const items = sideActions
      .filter((v) => {
        return space.has(v)
      })
      .map((a) => {
        return <Menu.Item key={a}>{a}</Menu.Item>
      })
    const menu = <Menu onClick={menuAction}>{items}</Menu>

    const compact = valueType !== "boolean"
    return (
      <div style={{ display: "flex" }}>
        {titleCom}
        <Input.Group
          compact={compact}
          size="small"
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {valueCom ? valueCom : <span>类型错误</span>}
          {items.length !== 0 ? (
            <Dropdown overlay={menu} placement="bottomRight" key="actions">
              <Button icon={<EllipsisOutlined />} size="small" shape="circle" />
            </Dropdown>
          ) : null}
        </Input.Group>
      </div>
    )
  }
}

/**
 * 字段组件是否需要重新渲染，条件：
 * 1. access 完全匹配了 lastChangedRoute
 * 2. lastChangedRoute + lastChangedField 一个元素 是 access 的子串
 * @param access
 * @param lastChangedRoute
 * @param lastChangedField
 * @returns
 */
const needReRender = (access: string[], lastChangedRoute: null | string[], lastChangedField: string[]) => {
  if (lastChangedRoute === null) return false
  let i = 0
  for (const p of lastChangedRoute) {
    if (access[i] === p) {
      i++
    } else if (i === access.length - 1) {
      return false
    } else {
      return false
    }
  }

  // 完全匹配 route
  if (i === access.length) {
    return true
  } else if (lastChangedField.length === 0 || lastChangedField.includes(access[i])) {
    // 下个字符
    return true
  }
  return false
}

const setOfCache = (
  ofCache: Map<string, ofSchemaCache | null>,
  schemaEntry: string,
  entrySchemaMap: Map<string, Schema | boolean>,
  rootSchema: RootSchema,
  nowOfRefs: string[] = []
) => {
  const findOfRef = (schemaMap: Map<string, Schema | boolean>, add = true) => {
    return (findKeyRefs(schemaMap, "oneOf", false, add) || findKeyRefs(schemaMap, "anyOf", false, add)) as
      | string
      | undefined
  }
  // 设置 ofCache (use Entry map ,root)
  const ofRef = findOfRef(entrySchemaMap)
  if (ofRef && nowOfRefs.includes(ofRef)) {
    console.error("你进行了oneOf/anyOf的循环引用，这会造成无限递归，危", nowOfRefs, ofRef)
    ofCache.set(schemaEntry, null)
  } else if (ofRef) {
    nowOfRefs.push(ofRef)
    const oneOfKeys = getPathVal(rootSchema, ofRef).map((v: any, i: string) => addRef(ofRef, i.toString())) as string[]
    const oneOfOptions = oneOfKeys.map((ref, i) => {
      const optMap = getRefSchemaMap(ref, rootSchema)
      const optOfRef = findOfRef(optMap, false)
      const name = toOfName(optMap)
      const result = {
        value: i.toString(),
        title: name ? name : `Option ${i + 1}`,
      } as any
      if (optOfRef) {
        const optCache = ofCache.has(ref) ? ofCache.get(ref) : setOfCache(ofCache, ref, optMap, rootSchema, nowOfRefs)
        if (optCache) {
          const { options } = optCache
          // todo: 这里需要变成多层的
          result.children = options.map((option) => {
            return deepReplace(_.cloneDeep(option), "value", (prev, key) => {
              return `${i}-${prev}`
            })
          })
          result.disabled = true
        }
      }
      return result
    })

    const oneOfSchemas = getRefSchemaMap(oneOfKeys, rootSchema, true)
    const extracted = extractSchema(oneOfSchemas, rootSchema)
    ofCache.set(schemaEntry, {
      extracted,
      ofRef: ofRef,
      ofLength: oneOfKeys.length,
      options: oneOfOptions,
    })
  } else {
    ofCache.set(schemaEntry, null)
  }
  return ofCache.get(schemaEntry)
}

/**
 * 注意，如果一个组件使用自己且使用 react-redux 链接，请注意使用connect后的名字！
 */
const Field = connect(
  (state: State, props: FieldProps) => {
    const { route, field, schemaEntry } = props
    const { data, editionName, lastChangedRoute, lastChangedField, rootSchema, cache, dataErrors } = state
    const { ofCache, itemCache, propertyCache } = cache!

    // 得到确切访问路径，取得数据
    const access = field != null ? route.concat(field) : route
    let targetData = data
    access.forEach((key) => {
      targetData = targetData[key]
    })

    // 根据上次动作给出的渲染路径 判断
    const reRender = needReRender(access, lastChangedRoute, lastChangedField)

    // 读取路径上的 schemaMap
    const entrySchemaMap = getRefSchemaMap(schemaEntry, rootSchema)

    let valueEntry = undefined
    if (schemaEntry) {
      // 设置 ofCache (use Entry map ,root)
      if (!ofCache.has(schemaEntry)) {
        setOfCache(ofCache, schemaEntry, entrySchemaMap, rootSchema)
      }
      // 确定 valueEntry
      const ofOption = getOfOption(targetData, schemaEntry, ofCache)
      valueEntry =
        ofOption === null
          ? schemaEntry
          : ofOption === false
          ? undefined
          : getRefByOfChain(ofCache, schemaEntry, ofOption)
    }

    const valueSchemaMap = getRefSchemaMap(valueEntry, rootSchema)
    if (valueEntry) {
      // 设置 propertyCache
      if (!propertyCache.has(valueEntry)) {
        // 得到以下属性的 ref
        const propertyRefs = findKeyRefs(valueSchemaMap, "properties", true) as string[]
        const patternRefs = findKeyRefs(valueSchemaMap, "patternProperties", true) as string[]
        const additionalRef = findKeyRefs(valueSchemaMap, "additionalProperties", false) as string | undefined
        const requiredRefs = findKeyRefs(valueSchemaMap, "required", true) as string[]

        if (propertyRefs.length + patternRefs.length > 0 || additionalRef) {
          // 对字段是否是短字段进行分类
          const shortProps: (string | RegExp)[] = []
          const otherProps: (string | RegExp)[] = []
          propertyRefs.forEach((ref) => {
            const schemas = getPathVal(rootSchema, ref)
            if (!schemas || schemas === true) return []
            for (const key in schemas) {
              if (schemaShortable(addRef(ref, key)!, rootSchema)) {
                shortProps.push(key)
              } else {
                otherProps.push(key)
              }
            }
          })
          patternRefs.forEach((ref) => {
            const schemas = getPathVal(rootSchema, ref)
            if (!schemas || schemas === true) return []
            for (const key in schemas) {
              if (schemaShortable(addRef(ref, key)!, rootSchema)) {
                shortProps.push(new RegExp(key))
              } else {
                otherProps.push(new RegExp(key))
              }
            }
          })
          const additionalValid = additionalRef ? getPathVal(rootSchema, additionalRef) !== false : false
          const additionalShortAble = additionalRef ? schemaShortable(additionalRef, rootSchema) : false
          // 得到 required 字段
          const required = requiredRefs.flatMap((ref) => {
            const schemas = getPathVal(rootSchema, ref)
            if (!schemas || schemas === true) return []
            return schemas
          })
          propertyCache.set(valueEntry, {
            shortProps: _.uniq(shortProps),
            otherProps: _.uniq(otherProps),
            required,
            additionalShortAble,
            additionalValid,
          })
        } else {
          propertyCache.set(valueEntry, null)
        }
      }

      // 设置 itemCache
      if (!itemCache.has(valueEntry)) {
        // 先进行对象的 itemCache 设置
        const itemRef = findKeyRefs(valueSchemaMap, "items") as string
        const additionalItemRef = findKeyRefs(valueSchemaMap, "additionalItems") as string
        if (itemRef) {
          const itemSchema = getPathVal(rootSchema, itemRef)
          // 如果所有 schema 没有 title，认为是extra 短优化，此外是普通短优化
          if (itemSchema instanceof Array) {
            const additionalItemSchemaMap = getRefSchemaMap(additionalItemRef, rootSchema)
            const itemListShort = itemSchema.every((schema, i) => {
              return schemaShortable(addRef(itemRef, i.toString())!, rootSchema)
            })
            const additionalItemShort = schemaShortable(additionalItemRef, rootSchema)
            if (itemListShort && additionalItemShort) {
              // 判断是否是extra短优化(true/false 不能shortable，故不需要先过滤)
              const itemListNoTitle = itemSchema.every((schema, i) => {
                const fieldRef = addRef(itemRef, i.toString())!
                const fieldMap = getRefSchemaMap(fieldRef, rootSchema)
                return absorbProperties(fieldMap, "title", "first") === undefined
              })
              const additionalItemHasTitle = absorbProperties(additionalItemSchemaMap, "title", "first") !== undefined
              if (!itemListNoTitle || additionalItemHasTitle) {
                itemCache.set(valueEntry, {
                  shortOpt: ShortOpt.short,
                  itemLength: itemSchema.length,
                })
              } else {
                itemCache.set(valueEntry, {
                  shortOpt: ShortOpt.extra,
                  itemLength: itemSchema.length,
                })
              }
            } else {
              itemCache.set(valueEntry, null)
            }
          } else {
            const oneTypeArrayShortAble = schemaShortable(itemRef, rootSchema)
            const itemHasTitle = itemSchema.title !== undefined
            if (oneTypeArrayShortAble) {
              if (itemHasTitle) {
                itemCache.set(valueEntry, { shortOpt: ShortOpt.short })
              } else {
                itemCache.set(valueEntry, { shortOpt: ShortOpt.extra })
              }
            } else {
              itemCache.set(valueEntry, null)
            }
          }
        } else {
          itemCache.set(valueEntry, null)
        }
      }
    }

    return {
      data: targetData,
      valueEntry,
      editionName,
      entrySchemaMap,
      valueSchemaMap,
      rootSchema,
      cache,
      dataErrors,
      reRender: reRender ? {} : null, // 本来在 areEqual 之前还有一个浅比较：相等一定不渲染。这里true用一个空对象(变引用)就可以解决这一个问题
    }
  },
  { doAction }
)(
  React.memo(FieldBase, (prevProps, nextProps) => {
    const { route: prevRoute, field: prevField } = prevProps
    const { route: nextRoute, field: nextField } = nextProps
    return !nextProps.reRender && _.isEqual(prevRoute, nextRoute) && prevField === nextField
  })
)

export default Field
