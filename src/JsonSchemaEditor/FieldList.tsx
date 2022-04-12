import { PlusOutlined } from "@ant-design/icons"
import { Layout } from "antd"
import Button from "antd/lib/button"
import { Content } from "antd/lib/layout/layout"
import Sider from "antd/lib/layout/Sider"
import List from "antd/lib/list"
import space from "antd/lib/space"
import React, { useMemo, useState } from "react"
import { SelectableGroup } from "react-selectable-fast"
import { SchemaCache } from "."
import CreateName from "./CreateName"
import { DataItemProps } from "./DataItem"
import Field, { FieldProps } from "./Field"
import { gridOption, maxItemsPerPageByShortLevel } from "./FieldOptions"
import ItemList from "./ItemList"
import { ShortOpt } from "./reducer"
import { concatAccess, getFieldSchema, getValueByPattern, jsonDataType } from "./utils"

interface FieldListProps {
  fieldProps: FieldProps
  fieldCache: SchemaCache
  short: ShortOpt
  canCreate?: boolean
  view?: string
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

const FieldList = (props: FieldListProps) => {
  const { fieldProps, short, canCreate, view, fieldCache } = props
  const doAction = fieldProps.doAction!
  const { data, route, field, setDrawer, schemaEntry } = fieldProps
  const { valueEntry, propertyCache, itemCache, ofCache } = fieldCache
  const dataType = jsonDataType(data)
  const access = useMemo(() => {
    return concatAccess(route, field)
  }, [route, field])

  const fatherInfo = useMemo(() => {
    const childFatherInfo: FatherInfo = {
      schemaEntry,
      valueEntry,
    }
    switch (dataType) {
      case "array":
        childFatherInfo.type = "array"
        childFatherInfo.length = data.length
        break
      default:
        childFatherInfo.type = "object"
        break
    }
    return childFatherInfo
  }, [schemaEntry, valueEntry, dataType === "array" ? data.length : -1])

  const content = useMemo(() => {
    let children: ChildData[] = []
    if (dataType === "array") {
      children = data.map((value: any, i: number) => {
        return { key: i.toString(), value }
      })
    } else if (dataType === "object") {
      const propertyCacheValue = valueEntry ? propertyCache.get(valueEntry) : null
      const shortenProps: string[] = []
      // todo: 分开查找可优化的项，然后按顺序排列
      for (const key in data) {
        const value = data[key]
        if (propertyCacheValue) {
          const { props, patternProps, additional } = propertyCacheValue
          const patternInfo = getValueByPattern(patternProps, key)
          if (props[key]) {
            if (props[key].shortable) {
              shortenProps.push(key)
              continue
            }
          } else if (patternInfo) {
            if (patternInfo.shortable) {
              shortenProps.push(key)
              continue
            }
          } else if (additional && additional.shortable) {
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
    return children
  }, [schemaEntry, valueEntry, data])

  // items 后处理
  const endItem = { end: true, key: "", value: "" }
  const items = canCreate ? content.concat(endItem) : content

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

  switch (view) {
    case "list":
      return (
        <Layout style={{ height: "100%", flexDirection: "row", alignItems: "stretch", display: "flex" }}>
          <Sider theme={"light"} style={{ height: "100%" }}>
            <div style={{ height: "100%", display: "flex", flexDirection: "column", borderRadius: '2px', border: '1px solid #d9d9d9' }}>
              <SelectableGroup
                clickClassName="tick"
                enableDeselect={true}
                tolerance={0}
                deselectOnEsc={false}
                allowClickWithoutSelected={true}
                resetOnStart={true}
                onSelectionFinish={handleSelectable}
                ignoreList={[".not-selectable"]}
                style={{ flex: "1", overflow: "auto", margin: "3px 0" }}
                key={"select"}
              >
                <ItemList items={content} />
              </SelectableGroup>
              {canCreate ? (
                <CreateName
                  fatherInfo={fatherInfo}
                  fieldProps={fieldProps}
                  fieldCache={fieldCache}
                  style={{ margin: "3px", width: "auto" }}
                  key={"create"}
                />
              ) : null}
            </div>
          </Sider>
          <Content style={{ height: "100%", overflow: "auto" }}>
            {data.length > 0 ? (
              <Field
                route={access}
                field={currentItem.toString()}
                fatherInfo={fatherInfo.type ? fatherInfo : undefined}
                schemaEntry={getFieldSchema(fieldProps, fieldCache, currentItem.toString())}
                short={short}
                setDrawer={setDrawer}
              />
            ) : null}
          </Content>
        </Layout>
      )
    default:
      const renderItem = (shortLv: ShortOpt) => {
        return (item: { key?: any; end?: any; data?: any }) => {
          const { key, end, data: itemData } = item
          if (itemData) {
            // 注意这是对象所有短字段集合，强制短
            return (
              <List
                size="small"
                split={false}
                dataSource={itemData}
                grid={gridOption[ShortOpt.short]}
                pagination={
                  itemData.length > maxItemsPerPageByShortLevel[ShortOpt.short]
                    ? {
                        simple: true,
                        pageSize: maxItemsPerPageByShortLevel[ShortOpt.short],
                      }
                    : undefined
                }
                renderItem={renderItem(ShortOpt.short)}
              />
            )
          } else if (!end)
            return (
              <List.Item key={"property-" + key}>
                <Field
                  route={access}
                  field={key}
                  fatherInfo={fatherInfo.type ? fatherInfo : undefined}
                  schemaEntry={getFieldSchema(fieldProps, fieldCache, key)}
                  short={shortLv}
                  setDrawer={setDrawer}
                />
              </List.Item>
            )
          else
            return (
              <List.Item key="end">
                <CreateName fatherInfo={fatherInfo} fieldProps={fieldProps} fieldCache={fieldCache} />
              </List.Item>
            )
        }
      }

      return (
        <List
          size="small"
          split={false}
          dataSource={items}
          grid={gridOption[short]}
          pagination={
            items.length > maxItemsPerPageByShortLevel[short]
              ? {
                  simple: true,
                  pageSize: maxItemsPerPageByShortLevel[short]
                }
              : undefined
          }
          renderItem={renderItem(short)}
        />
      )
  }
}

export default FieldList
