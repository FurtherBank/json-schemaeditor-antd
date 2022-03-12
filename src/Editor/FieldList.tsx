import { PlusOutlined } from "@ant-design/icons"
import { Layout } from "antd"
import Button from "antd/lib/button"
import { Content } from "antd/lib/layout/layout"
import Sider from "antd/lib/layout/Sider"
import List from "antd/lib/list"
import space from "antd/lib/space"
import React, { useState } from "react"
import { SelectableGroup } from "react-selectable-fast"
import { SchemaCache } from "."
import CreateName from "./CreateName"
import { DataItemProps } from "./DataItem"
import Field, { FatherInfo, FieldProps } from "./Field"
import { gridOption } from "./FieldOptions"
import ItemList from "./ItemList"
import { ShortOpt } from "./reducer"
import { concatAccess, getFieldSchema, jsonDataType } from "./utils"

interface FieldListProps {
  fieldProps: FieldProps
  fieldCache: SchemaCache
  short: ShortOpt
  content: any[]
  fatherInfo: FatherInfo
  canCreate?: boolean
  view?: string
}

const FieldList = (props: FieldListProps) => {
  const { content, fieldProps, fatherInfo, short, canCreate, view, fieldCache } = props
  const doAction = fieldProps.doAction!
  const { data, route, field, setDrawer } = fieldProps
  const dataType = jsonDataType(data)
  const access = concatAccess(route, field)

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
        <Layout style={{ height: "100%", flexDirection: "row",  alignItems: 'stretch', display: "flex" }}>
          <Sider theme={"light"} style={{ height: "100%"}}>
            <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <SelectableGroup
                clickClassName="tick"
                enableDeselect={true}
                tolerance={0}
                deselectOnEsc={false}
                allowClickWithoutSelected={true}
                resetOnStart={true}
                onSelectionFinish={handleSelectable}
                ignoreList={[".not-selectable"]}
                style={{ flex: "1", overflow: "auto", margin:"3px 0"}}
                key={'select'}
              >
                <ItemList items={content} />
              </SelectableGroup>
              {canCreate ? <CreateName fatherInfo={fatherInfo} fieldProps={fieldProps} fieldCache={fieldCache} style={{margin: "3px", width:"auto"}} key={'create'}/> : null}
            </div>
          </Sider>
          <Content style={{ height: "100%", overflow: 'auto' }}>
            {data.length > 0 ?
              <Field
              route={access}
              field={currentItem.toString()}
              fatherInfo={fatherInfo.type ? fatherInfo : undefined}
              schemaEntry={getFieldSchema(fieldProps, fieldCache, currentItem.toString())}
              short={short}
              setDrawer={setDrawer}
            /> : null}
          </Content>
        </Layout>
      )
    default:
      return (
        <List
          size="small"
          split={false}
          dataSource={items}
          grid={gridOption[short]}
          pagination={
            items.length > 16
              ? {
                  simple: true,
                  pageSize: 16,
                }
              : undefined
          }
          renderItem={(item) => {
            const { key, end, data: itemData } = item
            if (itemData) {
              return (
                <FieldList
                  key="start"
                  content={itemData}
                  fieldProps={fieldProps}
                  fieldCache={fieldCache}
                  fatherInfo={fatherInfo}
                  short={ShortOpt.short}
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
                    short={short}
                    setDrawer={setDrawer}
                  />
                </List.Item>
              )
            else
              return (
                <List.Item key="end">
                  <CreateName fatherInfo={fatherInfo} fieldProps={fieldProps} fieldCache={fieldCache}/>
                </List.Item>
              )
          }}
        />
      )
  }
}

export default FieldList
