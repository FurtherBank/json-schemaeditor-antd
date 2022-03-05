import React, { memo, useState } from "react"
import DataItem from "./DataItem"
import { ChildData } from "./Field"
import { toEnumName } from "./FieldOptions"

type Props = {
  items: ChildData[]
}

const ItemList = memo((props: Props) => {
  const { items } = props

  return (
    <div style={{ height: "100vh", overflow: "auto" }}>
      {items.map((item, i) => {
        const { value } = item
        return <DataItem key={i} id={i}>{`${i}. ${toEnumName(value)}`}</DataItem>
      })}
    </div>
  )
})

export default ItemList
