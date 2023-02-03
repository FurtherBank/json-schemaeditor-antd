import React, { useCallback } from 'react'
import { EditionProps } from '../../core/type/props'
import { CInputNumber } from '../base/cacheInput'

export const NumberEdition = (props: EditionProps) => {
  const { route, field, schemaEntry } = props
  // 这里单独拿出来是为防止 ts 认为是 undefined
  const doAction = props.doAction!
  const data = props.data as number

  const handleValueChange = useCallback(
    (value: number) => {
      doAction('change', schemaEntry, route, field, value)
    },
    [doAction]
  )

  return (
    <CInputNumber
      size="small"
      key="value"
      value={data}
      validate
      onValueChange={handleValueChange}
      onPressEnter={(e: any) => {
        e.target.blur()
      }}
      style={{ flex: 1 }}
    />
  )
}
