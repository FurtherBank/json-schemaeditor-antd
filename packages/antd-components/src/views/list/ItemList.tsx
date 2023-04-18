import React, { memo, PropsWithChildren } from 'react'
import { toConstName } from '../../../../definition'
import { createSelectable, TSelectableItemProps } from 'react-selectable-fast'

import '../../css/data-item.less'
import { ChildData } from '../../@cpu-studio/json-editor/type/list'

type Props = {
  items: ChildData[]
}

export const DataItem = createSelectable<DataItemProps>(
  (props: TSelectableItemProps & PropsWithChildren<DataItemProps>) => {
    const { selectableRef, isSelected, isSelecting, children, id } = props

    const classNames = [
      'ant-select-item ant-select-item-option list-item',
      false,
      isSelecting && 'ant-select-item-option-active',
      isSelected && 'ant-select-item-option-selected'
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div ref={selectableRef} className={classNames}>
        <p className="item-title">{id}</p>
        <span>{children}</span>
      </div>
    )
  }
)

export type DataItemProps = {
  id: number
}

export const ItemList = memo((props: Props) => {
  const { items } = props

  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      {items.map((item, i) => {
        const { value } = item
        return <DataItem key={i} id={i}>{`${toConstName(value)}`}</DataItem>
      })}
    </div>
  )
})
