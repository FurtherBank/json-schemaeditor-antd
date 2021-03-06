import { List } from 'antd'
import React, { useCallback, useMemo, useState } from 'react'
import { SelectableGroup } from 'react-selectable-fast'
import { IField } from './Field'
import CreateName from './components/CreateName'
import Field, { FieldProps } from './Field'
import { gridOption, maxItemsPerPageByShortLevel } from './definition'
import { ItemList, DataItemProps } from './components/ItemList'
import { ShortOpt } from './reducer'
import { concatAccess, getFieldSchema, getValueByPattern, jsonDataType } from './utils'
import { isShort } from './info/virtual'

interface FieldListProps {
  fieldProps: FieldProps
  fieldInfo: IField
  short: ShortOpt
  canCreate?: boolean
  view?: string
  id: string | undefined
}

/**
 * 原则上来自于父字段的信息，不具有子字段特异性
 */
export interface FatherInfo {
  type: string // 是父亲的实际类型，非要求类型
  length?: number // 如果是数组，给出长度
  required?: string[] // 如果是对象，给出 required 属性
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
  const { fieldProps, short, canCreate, view, fieldInfo, id } = props
  const { data, route, field, setDrawer, schemaEntry } = fieldProps
  const { valueEntry, ctx, mergedValueSchema } = fieldInfo
  const dataType = jsonDataType(data) as 'object' | 'array'

  console.assert(dataType === 'object' || dataType === 'array')

  const access = useMemo(() => {
    return concatAccess(route, field)
  }, [route, field])

  const { required, properties, additionalProperties, patternProperties } = mergedValueSchema || {}
  const fatherInfo = useMemo((): FatherInfo => {
    const childFatherInfo: FatherInfo = {
      schemaEntry,
      valueEntry,
      type: dataType
    }
    switch (dataType) {
      case 'array':
        childFatherInfo.type = 'array'
        childFatherInfo.length = data.length
        break
      default:
        childFatherInfo.type = 'object'
        if (required) childFatherInfo.required = required
        break
    }
    return childFatherInfo
  }, [schemaEntry, valueEntry, data])

  const content = useMemo(() => {
    let children: ChildData[] = []
    if (dataType === 'array') {
      children = data.map((value: any, i: number) => {
        return { key: i.toString(), value }
      })
    } else if (dataType === 'object') {
      const shortenProps: string[] = []
      // todo: 分开查找可优化的项，然后按顺序排列
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          const value = data[key]
          const patternRef = patternProperties ? getValueByPattern(patternProperties, key) : undefined
          const propRealRef =
            properties && properties[key] ? properties[key] : patternRef ? patternRef : additionalProperties
          if (propRealRef) {
            const { [isShort]: shortable } = ctx.getMergedSchema(propRealRef) || {}
            if (shortable) {
              shortenProps.push(key)
              continue
            }
          }
          children.push({ key, value })
        }
      }

      if (shortenProps.length > 0) {
        const shortenChildren = shortenProps.map((key) => {
          const value = data[key]
          return {
            key,
            value
          }
        })
        children.unshift({ data: shortenChildren, key: '', value: '' })
      }
    }
    return children
  }, [schemaEntry, valueEntry, data])

  // items 后处理
  const endItem = { end: true, key: '', value: '' }
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

  const getSubField = useCallback(
    (key, short) => {
      const subEntry = getFieldSchema(data, valueEntry, mergedValueSchema, key) || undefined
      return (
        <Field
          route={access}
          field={key}
          fatherInfo={fatherInfo}
          schemaEntry={subEntry}
          short={short}
          setDrawer={setDrawer}
        />
      )
    },
    [fieldProps, fieldInfo, fatherInfo]
  )

  switch (view) {
    case 'list':
      return (
        <div style={{ height: '100%', flexDirection: 'row', alignItems: 'stretch', display: 'flex' }} id={id}>
          <aside style={{ height: '100%', minWidth: '15em' }}>
            <div
              className="ant-card-bordered"
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '2px'
              }}
            >
              <SelectableGroup
                clickClassName="tick"
                enableDeselect={true}
                tolerance={0}
                deselectOnEsc={false}
                allowClickWithoutSelected={true}
                resetOnStart={true}
                onSelectionFinish={handleSelectable}
                ignoreList={['.not-selectable']}
                style={{ flex: '1', overflow: 'auto', margin: '3px 0' }}
                key={'select'}
              >
                <ItemList items={content} />
              </SelectableGroup>
              {canCreate ? (
                <CreateName
                  fatherInfo={fatherInfo}
                  fieldProps={fieldProps}
                  fieldInfo={fieldInfo}
                  style={{ margin: '3px', width: 'auto' }}
                  key={'create'}
                />
              ) : null}
            </div>
          </aside>
          <main style={{ height: '100%', overflow: 'auto', flex: 'auto' }}>
            {data.length > 0 ? getSubField(currentItem.toString(), short) : null}
          </main>
        </div>
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
                        pageSize: maxItemsPerPageByShortLevel[ShortOpt.short]
                      }
                    : undefined
                }
                renderItem={renderItem(ShortOpt.short)}
              />
            )
          } else if (!end) {
            return <List.Item key={'property-' + key}>{getSubField(key, shortLv)}</List.Item>
          } else
            return (
              <List.Item key="end">
                <CreateName fatherInfo={fatherInfo} fieldProps={fieldProps} fieldInfo={fieldInfo} />
              </List.Item>
            )
        }
      }
      // const keys = Object.keys(data)
      // // todo: 排查属性的 order 关键字并写入 cache，然后在这里排个序再 map
      // const renderItems = keys.map((key: number | string) => {
      //   return <Field
      //     key={`property-${key}`}
      //     route={access}
      //     field={key.toString()}
      //     fatherInfo={fatherInfo.type ? fatherInfo : undefined}
      //     schemaEntry={getFieldSchema(fieldProps, fieldInfo, key.toString())}
      //     short={short}
      //     setDrawer={setDrawer}
      //   />
      // })
      // // 创建新属性组件
      // if (canCreate) renderItems.push(
      //   <CreateName
      //     fatherInfo={fatherInfo}
      //     fieldProps={fieldProps}
      //     fieldInfo={fieldInfo}
      //   />
      // )

      // return (
      //   <div style={{
      //     gridTemplateColumns: 'repeat(auto-fit, minmax(24.5em, 1fr))',
      //     gridGap: '0.25em 0.25em',
      //     gridAutoFlow: 'dense',
      //   }}>
      //     {renderItems}
      //   </div>
      // )
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
          id={id}
        />
      )
  }
}

export default FieldList
