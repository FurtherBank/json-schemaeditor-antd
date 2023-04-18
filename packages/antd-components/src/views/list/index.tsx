import React, { useMemo, useState } from 'react'
import { CreateName } from '../../base/creator'
import { concatAccess, jsonDataType } from '@cpu-studio/json-editor/src/utils'
import { EditionProps } from '@cpu-studio/json-editor/src/components/type/props'
import { SelectableGroup } from 'react-selectable-fast'
import { DataItemProps, ItemList } from './ItemList'
import { ChildData } from '@cpu-studio/json-editor/src/components/type/list'
import { useFatherInfo } from '@cpu-studio/json-editor/src/components/hooks/useFatherInfo'
import { useArrayListContent } from '@cpu-studio/json-editor/src/components/hooks/useArrayListContent'
import { useSubFieldQuery } from '@cpu-studio/json-editor/src/components/hooks/useSubFieldQuery'

const ArrayListView = (props: EditionProps) => {
  const { viewport, data, route, field, schemaEntry, fieldInfo } = props
  const { valueEntry, ctx, mergedValueSchema } = fieldInfo

  const dataType = jsonDataType(data) as 'object' | 'array'
  console.assert(dataType === 'object' || dataType === 'array')

  const access = useMemo(() => {
    return concatAccess(route, field)
  }, [route, field])

  const fatherInfo = useFatherInfo(data, schemaEntry, valueEntry, mergedValueSchema)

  const lists = useArrayListContent(data, schemaEntry, fieldInfo)

  const lastList = lists[lists.length - 1].items
  const canCreate = lastList[lastList.length - 1] === null

  const content = useMemo(() => {
    // 展平 list，且将最后的 { key: '' } 去除掉
    const allChildData = lists.map((list) => list.items).flat(1)
    if (allChildData[allChildData.length - 1].key === '') allChildData.pop()
    return allChildData as ChildData[]
  }, [lists])

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

  const getSubField = useSubFieldQuery(data, access, fieldInfo, fatherInfo, viewport)

  return (
    <div style={{ height: '100%', flexDirection: 'row', alignItems: 'stretch', display: 'flex' }}>
      <aside style={{ height: '100%', width: '15em' }}>
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
              data={data}
              access={access}
              schemaEntry={schemaEntry}
              mergedValueSchema={mergedValueSchema}
              ctx={ctx}
              style={{ margin: '3px', width: 'auto' }}
              key={'create'}
            />
          ) : null}
        </div>
      </aside>
      <main style={{ height: '100%', overflow: 'auto', flex: 'auto' }}>
        {data.length > 0 ? getSubField(currentItem.toString(), 0) : null}
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
