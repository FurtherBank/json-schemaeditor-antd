import React, { useCallback, useMemo, useState } from 'react'
import { CreateName } from '../../base/creator'
import { canSchemaCreate, getListAllowedShortLevel } from '../../../../definition'
import { concatAccess, getFieldSchema, getValueByPattern, jsonDataType } from '../../../../utils'
import { isShort } from '../../../../context/virtual'
import { EditionProps } from '../../../core/type/props'
import { SelectableGroup } from 'react-selectable-fast'
import { DataItemProps, ItemList } from './ItemList'
import { ChildData, FatherInfo } from '../../../core/type/list'

const ArrayListView = (props: EditionProps) => {
  const { data, route, field, schemaEntry, fieldInfo } = props
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

  const allowedShortLevel = getListAllowedShortLevel(ctx, dataType, valueEntry)

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
  const canCreate = canSchemaCreate(props, fieldInfo)

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
      const Field = ctx.Field
      return <Field route={access} field={key} fatherInfo={fatherInfo} schemaEntry={subEntry} short={short} />
    },
    [data, access, valueEntry, fieldInfo, fatherInfo]
  )

  return (
    <div style={{ height: '100%', flexDirection: 'row', alignItems: 'stretch', display: 'flex' }}>
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
              fieldProps={props}
              fieldInfo={fieldInfo}
              style={{ margin: '3px', width: 'auto' }}
              key={'create'}
            />
          ) : null}
        </div>
      </aside>
      <main style={{ height: '100%', overflow: 'auto', flex: 'auto' }}>
        {data.length > 0 ? getSubField(currentItem.toString(), allowedShortLevel) : null}
      </main>
    </div>
  )
}

export const ArrayListViewEdition = (props: EditionProps) => {
  const {
    field,
    fieldInfo: { ctx }
  } = props

  // 该 list 组件只允许在根节点使用，如果不是根节点，通过 ctx 使用默认组件显示
  const DefaultEdition = ctx.getComponent(null, ['edition', 'array'])
  return field === undefined ? <ArrayListView {...props} /> : <DefaultEdition {...props} />
}
