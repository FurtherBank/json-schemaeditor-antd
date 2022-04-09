import React, { useContext, useMemo } from "react"
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EllipsisOutlined,
  RedoOutlined,
  UndoOutlined,
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
import _, { isEqual } from "lodash"
import { connect, useSelector } from "react-redux"
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
  shallowValidate,
  toConstName,
  toOfName,
} from "./FieldOptions"
import { doAction, itemSchemaCache, JsonTypes, ofSchemaCache, propertySchemaCache, ShortOpt, State } from "./reducer"
import {
  absorbProperties,
  concatAccess,
  exactIndexOf,
  getRefSchemaMap,
  jsonDataType,
  findKeyRefs,
  getPathVal,
  addRef,
  extractSchema,
  getError,
  deepReplace,
} from "./utils"
import Switch from "antd/lib/switch"
import FieldList, { FatherInfo } from "./FieldList"
import Dropdown from "antd/lib/dropdown"
import { Menu } from "antd"
import TextArea from "antd/lib/input/TextArea"
import { CacheContext, ContextContent, SchemaCache } from "."
import { StateWithHistory } from "redux-undo"
const { Panel } = Collapse

export interface FieldProps {
  route: string[] // 只有这个属性是节点传的
  field: string | null // route的最后
  fatherInfo?: FatherInfo
  schemaEntry?: string | undefined
  short?: ShortOpt
  setDrawer?: Function
  canNotRename?: boolean | undefined
  // redux props
  doAction?: Function
  data?: any
  reRender?: any
}

const CInput = cacheInput(Input),
  CInputNumber = cacheInput(InputNumber),
  CTextArea = cacheInput(TextArea)

const sideActions = ["detail", "undo", "redo", "moveup", "movedown", "oneOf", "type", "delete"]
/**
 * 动作空间函数，理应有。
 * 注意：该函数输出的顺序影响侧栏动作按钮的顺序！
 */
const actionSpace = (props: FieldProps, schemaCache: SchemaCache, errors: any | undefined) => {
  const { fatherInfo, field, data, schemaEntry, short } = props
  const { ofCache, propertyCache, itemCache, entrySchemaMap, valueSchemaMap } = schemaCache
  const dataType = jsonDataType(data)
  const schemas = []
  for (const iterator of entrySchemaMap!.values()) {
    schemas.push(iterator)
  }
  const hasFalse = schemas.includes(false)
  const result = new Map()
  // 对象和数组 在schema允许的情况下可以 create
  if (data instanceof Array || data instanceof Object) {
    const autoCompleteFields = canSchemaCreate(props, schemaCache)
    if (autoCompleteFields) result.set("create", autoCompleteFields)
  }

  // 父亲是数组，且自己的索引不超限的情况下，加入 move
  if (fatherInfo && fatherInfo.type === "array") {
    const index = parseInt(field!)
    if (index - 1 >= 0) result.set("moveup", true)
    if (index + 1 < fatherInfo.length!) result.set("movedown", true)
  }

  // 先看有没有 Of
  const ofCacheValue = schemaEntry ? ofCache.get(schemaEntry) : undefined
  if (ofCacheValue) {
    result.set("oneOf", ofCacheValue)
  }

  // 然后根据 valueEntry 看情况
  const constSchema = absorbProperties(valueSchemaMap, "const") as any | undefined
  const enums = absorbProperties(valueSchemaMap, "enum") as any[] | undefined
  if (constSchema !== undefined) {
    result.set("const", constSchema)
  } else if (enums !== undefined) {
    result.set("enum", enums)
  } else {
    // 如果类型可能性有多种，使用 'type' 切换属性
    const types = absorbProperties(valueSchemaMap, "type")
    if (hasFalse || types.length !== 1) result.set("type", types.length > 0 ? types : JsonTypes)
  }

  // 短优化时，如果有 const/enum 或者类型错误，加入detail
  if (short && (result.has("const") || result.has("enum") || errors.length > 0)) result.set("detail", true)

  // 如果父亲是对象/数组，且属性可删除，加入删除功能
  if (fatherInfo && fatherInfo.type) {
    if (canDelete(props, schemaCache)) result.set("delete", true)
  }

  // 如果是根节点，那么加入撤销和恢复
  if (field === null) {
    result.set("undo", true)
    result.set("redo", true)
  }
  return result
}

/**
 * 验证数据符合 oneOf/anyOf 的哪一个选项
 * @param data
 * @param schemaEntry
 * @param ofCache
 * @returns `null`为无 oneOf/anyOf，`false`为不符合任何选项，`string`为选项链
 */
const getOfOption = (data: any, schemaEntry: string, context: ContextContent): string | null | false => {
  const { ofCache } = context
  const ofCacheValue = schemaEntry ? ofCache.get(schemaEntry) : null
  if (ofCacheValue) {
    const { extracted, ofLength, ofRef } = ofCacheValue
    for (let i = 0; i < ofLength; i++) {
      const validate = extracted[i]
      if (typeof validate === "string") {
        // 展开的 validate 为 string，就是子 oneOf 的 ref
        const optOfCacheValue = ofCache.get(validate)
        console.assert(optOfCacheValue)
        const subOption = getOfOption(data, validate, context)
        console.assert(subOption !== null)
        if (subOption) return `${i}-${subOption}`
      } else {
        const valid = shallowValidate(data, addRef(ofRef, i.toString())!, context)
        if (valid) return i.toString()
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
  const { data, route, field, schemaEntry, short, canNotRename, setDrawer } = props

  const caches = useContext(CacheContext),
    { ofCache, propertyCache, itemCache, rootSchema } = caches

  // 读取路径上的 schemaMap
  const entrySchemaMap = useMemo(() => {
    return getRefSchemaMap(schemaEntry, rootSchema)
  }, [schemaEntry, caches])

  let valueEntry = undefined as undefined | string
  let ofOption: string | false | null | undefined = undefined
  if (schemaEntry) {
    // 设置 ofCache (use Entry map ,root)
    if (!ofCache.has(schemaEntry)) {
      setOfCache(ofCache, schemaEntry, entrySchemaMap, rootSchema)
    }
    // 确定 valueEntry
    ofOption = getOfOption(data, schemaEntry, caches)
    valueEntry =
      ofOption === null ? schemaEntry : ofOption === false ? undefined : getRefByOfChain(ofCache, schemaEntry, ofOption)
  }

  const valueSchemaMap = useMemo(() => {
    return getRefSchemaMap(valueEntry, rootSchema)
  }, [valueEntry, caches])

  if (valueEntry) {
    // 设置 propertyCache
    if (!propertyCache.has(valueEntry)) {
      setPropertyCache(propertyCache, valueEntry, valueSchemaMap, rootSchema)
    }
    // 设置 itemCache
    if (!itemCache.has(valueEntry)) {
      setItemCache(itemCache, valueEntry, valueSchemaMap, rootSchema)
    }
  }

  const schemaCache = { ofCache, propertyCache, itemCache, rootSchema, valueEntry, valueSchemaMap, entrySchemaMap }
  // 这里单独拿出来是为防止被undefined
  const doAction = props.doAction!

  const dataType = jsonDataType(data)
  const access = concatAccess(route, field)

  const dataErrors = useSelector<StateWithHistory<State>, any[]>((state) => {
    return state.present.dataErrors
  })

  const errors = getError(dataErrors, access)

  const space = actionSpace(props, schemaCache, errors)
  const valueType = space.has("const") ? "const" : space.has("enum") ? "enum" : dataType

  const title = absorbProperties(entrySchemaMap!, "title") as string | undefined
  const description = absorbProperties(entrySchemaMap!, "description")
  const fieldNameRange = canSchemaRename(props, schemaCache)
  const itemCacheValue = itemCache.get(valueEntry!)

  const format = absorbProperties(valueSchemaMap!, "format")
  const formatType = getFormatType(format)
  const types = absorbProperties(entrySchemaMap!, "type")

  // 渲染排错
  if (dataType === "undefined") {
    console.log("错误的渲染:", props)
    return null
  }
  // console.log("渲染", access.join('/'), data)

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
        errors.length > 0 ? (
          <Tooltip
            title={errors.map((error: { message: string }) => error.message).join("\n")}
            placement="topLeft"
            key="valid"
          >
            <CloseCircleOutlined style={{ color: "red" }} />
          </Tooltip>
        ) : null
      }

      {short !== ShortOpt.extra ? (
        <Tooltip title={description} placement="topLeft" key="name">
          {!canNotRename && (fieldNameRange === "" || fieldNameRange instanceof RegExp) ? (
            <CInput
              size="small"
              bordered={false}
              style={{
                textDecoration: "underline",
                width: "100px",
                padding: "0",
              }}
              title={field}
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
            <span style={{ width: "100px" }} title={titleName!}>{titleName}</span>
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
        return (
          <CTextArea
            {...allUsedProps}
            style={{ flex: 1 }}
            autoSize={{ minRows: 3, maxRows: 5 }}
            onPressEnter={undefined}
          />
        )
      case "row":
      case "uri":
      case "uri-reference":
        // 所有使用 row 输入的格式，用这个
        return <CInput {...allUsedProps} style={{ flex: 1, minWidth: "400px" }} />
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
            <Input key="const" size="small" value={toConstName(data)} disabled allowClear={false} />
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
                  label: toConstName(value),
                }
              })}
              style={{ flex: 1, maxWidth: '185px' }}
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
            checked={data}
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
    undo: (value: string) => {
      doAction("undo")
    },
    redo: (value: string) => {
      doAction("redo")
    },
    copy: (value: string) => {
      // todo
    },
    paste: (value: string) => {
      doAction("change", route, field, defaultTypeValue[value])
    },
  } as any

  if (!short) {
    // 3. 设置右上动作栏组件(短优化后改为动作菜单)
    const sideActionComSpace = (action: string) => {
      switch (action) {
        case "oneOf":
          const { options, ofRef } = space.get("oneOf") as ofSchemaCache
          const ofIndex = ofOption || " "
          return (
            <TreeSelect
              key="oneOf"
              size="small"
              treeData={options}
              onChange={(value, labellist, extra) => {
                const schemaRef = getRefByOfChain(ofCache, schemaEntry!, value)
                const defaultValue = getDefaultValue(schemaCache, schemaRef, data)
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
        case "undo":
          return <Button key="undo" icon={<UndoOutlined />} size="small" shape="circle" onClick={actionEvents.undo} />
        case "redo":
          return <Button key="redo" icon={<RedoOutlined />} size="small" shape="circle" onClick={actionEvents.redo} />
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
    return access.length === 0 && dataType === "array" && _.isEqual(types, ["array"]) ? (
      <FieldList
        fieldProps={props}
        fieldCache={schemaCache}
        short={ShortOpt.no}
        canCreate={space.has("create")}
        view={"list"}
      />
    ) : dataType === "object" || dataType === "array" ? (
      <Collapse defaultActiveKey={access.length < maxCollapseLayer ? ["theoneandtheonly"] : undefined}>
        <Panel key="theoneandtheonly" header={titleCom} extra={<Space onClick={stopBubble}>{actionComs}</Space>}>
          <FieldList
            fieldProps={props}
            fieldCache={schemaCache}
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
 * 对 设置 ofCache
 * @param ofCache
 * @param schemaEntry
 * @param entrySchemaMap
 * @param rootSchema
 * @param nowOfRefs
 * @returns
 */
export const setOfCache = (
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
    const oneOfOptRefs = getPathVal(rootSchema, ofRef).map((v: any, i: string) =>
      addRef(ofRef, i.toString())
    ) as string[]

    // 得到展开的 schema
    const extractedSchemas = [] as (undefined | string)[]

    const oneOfOptions = oneOfOptRefs.map((ref, i) => {
      const optMap = getRefSchemaMap(ref, rootSchema)
      const name = toOfName(optMap)
      const result = {
        value: i.toString(),
        title: name ? name : `Option ${i + 1}`,
      } as any
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
        // 选项有子选项，将子选项ref给他
        extractedSchemas.push(ref)
      } else {
        extractedSchemas.push(undefined)
      }
      return result
    })

    ofCache.set(schemaEntry, {
      extracted: extractedSchemas,
      ofRef: ofRef,
      ofLength: oneOfOptRefs.length,
      options: oneOfOptions,
    })
  } else {
    ofCache.set(schemaEntry, null)
  }
  return ofCache.get(schemaEntry)
}

/**
 * 设置 propCache
 * @param propertyCache
 * @param valueEntry
 * @param valueSchemaMap
 * @param rootSchema
 * @returns
 */
export const setPropertyCache = (
  propertyCache: Map<string, propertySchemaCache | null>,
  valueEntry: string,
  valueSchemaMap: Map<string, Schema | boolean>,
  rootSchema: RootSchema
) => {
  // 得到以下属性的 ref
  const propertyRefs = findKeyRefs(valueSchemaMap, "properties", true) as string[]
  const patternRefs = findKeyRefs(valueSchemaMap, "patternProperties", true) as string[]
  const additionalRef = findKeyRefs(valueSchemaMap, "additionalProperties", false) as string | undefined
  const requiredRefs = findKeyRefs(valueSchemaMap, "required", true) as string[]

  if (propertyRefs.length + patternRefs.length > 0 || additionalRef) {
    // 对字段是否是短字段进行分类
    const props = {} as any
    propertyRefs.reverse().forEach((ref) => {
      const schemas = getPathVal(rootSchema, ref)
      if (!schemas || schemas === true) return
      for (const key in schemas) {
        props[key] = {
          shortable: schemaShortable(addRef(ref, key)!, rootSchema),
          ref: addRef(ref, key)!,
        }
      }
    })
    const patternProps = {} as any
    patternRefs.reverse().forEach((ref) => {
      const schemas = getPathVal(rootSchema, ref)
      if (!schemas || schemas === true) return
      for (const key in schemas) {
        patternProps[key] = {
          shortable: schemaShortable(addRef(ref, key)!, rootSchema),
          ref: addRef(ref, key)!,
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
      props,
      patternProps,
      required,
      additional: additionalValid ? { ref: additionalRef!, shortable: additionalShortAble } : undefined,
    })
  } else {
    propertyCache.set(valueEntry, null)
  }
  return propertyCache.get(valueEntry)
}

/**
 * 设置 itemCache
 * @param itemCache
 * @param valueEntry
 * @param valueSchemaMap
 * @param rootSchema
 */
export const setItemCache = (
  itemCache: Map<string, itemSchemaCache | null>,
  valueEntry: string,
  valueSchemaMap: Map<string, Schema | boolean>,
  rootSchema: RootSchema
) => {
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
          return absorbProperties(fieldMap, "title") === undefined
        })
        const additionalItemHasTitle = absorbProperties(additionalItemSchemaMap, "title") !== undefined
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
        itemCache.set(valueEntry, {
          shortOpt: ShortOpt.no,
          itemLength: itemSchema.length,
        })
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
        itemCache.set(valueEntry, { shortOpt: ShortOpt.no })
      }
    }
  } else {
    itemCache.set(valueEntry, null)
  }
  return itemCache.get(valueEntry)
}

/**
 * 注意，如果一个组件使用自己且使用 react-redux 链接，请注意使用connect后的名字！
 */

const checkMemoChange = (prevProps: any, nextProps: any) => {
  const { route, field } = nextProps
  const access = concatAccess(route, field).join("/")
  let changed = false
  for (const key in prevProps) {
    if (Object.prototype.hasOwnProperty.call(prevProps, key)) {
      if (prevProps[key] !== nextProps[key]) {
        changed = true
        console.log(key, "改变", access ? access : "<root>", isEqual(prevProps[key], nextProps[key]))
      }
    }
  }
  return !changed
}

const Field = connect(
  (state: StateWithHistory<State>, props: FieldProps) => {
    const { route, field } = props
    const {
      present: { data },
    } = state

    // 得到确切访问路径，取得数据
    const access = field != null ? route.concat(field) : route
    let targetData = data
    access.forEach((key) => {
      targetData = targetData[key]
    })

    return {
      data: targetData,
    }
  },
  { doAction }
)(React.memo(FieldBase, checkMemoChange))

export default Field
