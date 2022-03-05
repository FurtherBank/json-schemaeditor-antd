import React, { PropsWithChildren } from "react"
import { TSelectableItemProps, createSelectable } from "react-selectable-fast"

export type DataItemProps = {
  id: number
}

const DataItem = createSelectable<DataItemProps>((props: TSelectableItemProps & PropsWithChildren<DataItemProps>) => {
  const { selectableRef, isSelected, isSelecting, children } = props

  const classNames = ["selectable-div", false, isSelecting && "selected-div", isSelected && "selected-div"]
    .filter(Boolean)
    .join(" ")

  return (
    <div ref={selectableRef} className={classNames}>
      {children}
    </div>
  )
})

export default DataItem
