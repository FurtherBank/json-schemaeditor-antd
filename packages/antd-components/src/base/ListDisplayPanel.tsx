import { List } from 'antd'
import React from 'react'
import { CreateName } from './creator'
import { ShortLevel } from '@cpu-studio/json-editor/src/definition'
import { ChildData, EmptyChildData, ListDisplayPanelProps } from '../../../../src/JsonSchemaEditor/components/type/list'
import { useSubFieldQuery } from '../../../../src/JsonSchemaEditor/components/hooks/useSubFieldQuery'
import { gridOption } from '../config'

export const ListDisplayPanel = (props: ListDisplayPanelProps) => {
  const { viewport, data, access, fieldInfo, fatherInfo, lists } = props
  const { schemaEntry } = fatherInfo
  const { ctx, mergedValueSchema } = fieldInfo

  const getSubField = useSubFieldQuery(data, access, fieldInfo, fatherInfo, viewport)

  const renderItem = (shortLv: ShortLevel) => {
    return (item: ChildData | EmptyChildData) => {
      if (item.key !== '') {
        const { key } = item
        return <List.Item key={'property-' + key}>{getSubField(key, shortLv)}</List.Item>
      } else {
        return (
          <List.Item key="end">
            <CreateName
              data={data}
              access={access}
              mergedValueSchema={mergedValueSchema}
              ctx={ctx}
              schemaEntry={schemaEntry}
            />
          </List.Item>
        )
      }
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
    <div>
      {lists.map((list, i) => {
        const { items, short } = list
        return (
          <List
            key={i}
            size="small"
            split={false}
            dataSource={items}
            grid={gridOption[short]}
            renderItem={renderItem(short)}
          />
        )
      })}
    </div>
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
