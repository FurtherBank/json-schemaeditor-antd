import { List } from 'antd'
import React, { useCallback, useMemo } from 'react'
import { CreateName } from '../base/creator'
import { canSchemaCreate, getListAllowedShortLevel, gridOption, maxItemsPerPageByShortLevel } from '../../../definition'
import { ShortLevel } from '../../../definition'
import { concatAccess, getFieldSchema } from '../../../utils'
import { EditionProps } from '../../core/type/props'
import { ConstEdition } from './ConstEdition'
import { ChildData, FatherInfo } from '../../core/type/list'

const ArrayEditionPanel = (props: EditionProps) => {
  const { data, route, field, schemaEntry, fieldInfo } = props
  const { valueEntry, ctx, mergedValueSchema } = fieldInfo

  console.assert(data instanceof Array)

  const access = useMemo(() => {
    return concatAccess(route, field)
  }, [route, field])

  const fatherInfo = useMemo((): FatherInfo => {
    return {
      schemaEntry,
      valueEntry,
      type: 'array',
      length: data.length
    }
  }, [schemaEntry, valueEntry, data])

  const allowedShortLevel = getListAllowedShortLevel(ctx, 'array', valueEntry)

  const content = useMemo(() => {
    let children: ChildData[] = []
    children = data.map((value: any, i: number) => {
      return { key: i.toString(), value }
    })
    return children
  }, [schemaEntry, valueEntry, data])

  // items 后处理
  const canCreate = canSchemaCreate(props, fieldInfo)
  const endItem = { end: true, key: '', value: '' }
  const items = canCreate ? content.concat(endItem) : content

  const getSubField = useCallback(
    (key, short) => {
      const subEntry = getFieldSchema(data, valueEntry, mergedValueSchema, key) || undefined
      const Field = ctx.Field
      return <Field route={access} field={key} fatherInfo={fatherInfo} schemaEntry={subEntry} short={short} />
    },
    [data, access, valueEntry, fieldInfo, fatherInfo]
  )

  const renderItem = (shortLv: ShortLevel) => {
    return (item: { key?: any; end?: any; data?: any }) => {
      const { key, end, data: itemData } = item
      if (itemData) {
        // 注意这是对象所有短字段集合，强制短
        return (
          <List
            size="small"
            split={false}
            dataSource={itemData}
            grid={gridOption[ShortLevel.short]}
            pagination={
              itemData.length > maxItemsPerPageByShortLevel[ShortLevel.short]
                ? {
                    simple: true,
                    pageSize: maxItemsPerPageByShortLevel[ShortLevel.short]
                  }
                : undefined
            }
            renderItem={renderItem(ShortLevel.short)}
          />
        )
      } else if (!end) {
        return <List.Item key={'property-' + key}>{getSubField(key, shortLv)}</List.Item>
      } else
        return (
          <List.Item key="end">
            <CreateName fatherInfo={fatherInfo} fieldProps={props} fieldInfo={fieldInfo} />
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
      grid={gridOption[allowedShortLevel]}
      pagination={
        items.length > maxItemsPerPageByShortLevel[allowedShortLevel]
          ? {
              simple: true,
              pageSize: maxItemsPerPageByShortLevel[allowedShortLevel]
            }
          : undefined
      }
      renderItem={renderItem(allowedShortLevel)}
    />
  )
  // switch (1) {
  //   case 'list':
  //     return (
  //       <div style={{ height: '100%', flexDirection: 'row', alignItems: 'stretch', display: 'flex' }} id={id}>
  //         <aside style={{ height: '100%', minWidth: '15em' }}>
  //           <div
  //             className="ant-card-bordered"
  //             style={{
  //               height: '100%',
  //               display: 'flex',
  //               flexDirection: 'column',
  //               borderRadius: '2px'
  //             }}
  //           >
  //             <SelectableGroup
  //               clickClassName="tick"
  //               enableDeselect={true}
  //               tolerance={0}
  //               deselectOnEsc={false}
  //               allowClickWithoutSelected={true}
  //               resetOnStart={true}
  //               onSelectionFinish={handleSelectable}
  //               ignoreList={['.not-selectable']}
  //               style={{ flex: '1', overflow: 'auto', margin: '3px 0' }}
  //               key={'select'}
  //             >
  //               <ItemList items={content} />
  //             </SelectableGroup>
  //             {canCreate ? (
  //               <CreateName
  //                 fatherInfo={fatherInfo}
  //                 fieldProps={fieldProps}
  //                 fieldInfo={fieldInfo}
  //                 style={{ margin: '3px', width: 'auto' }}
  //                 key={'create'}
  //               />
  //             ) : null}
  //           </div>
  //         </aside>
  //         <main style={{ height: '100%', overflow: 'auto', flex: 'auto' }}>
  //           {data.length > 0 ? getSubField(currentItem.toString(), short) : null}
  //         </main>
  //       </div>
  //     )
  //   default:
  // }
}

export const ArrayEdition = (props: EditionProps) => {
  const { short } = props
  return short ? <ConstEdition {...props} /> : <ArrayEditionPanel {...props} />
}
