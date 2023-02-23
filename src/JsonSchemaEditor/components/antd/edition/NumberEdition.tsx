import React, { useCallback } from 'react'
import { EditionProps } from '../../core/type/props'
import { CInputNumber } from '../base/cacheInput'

export const NumberEdition = (props: EditionProps) => {
  const {
    route,
    field,
    schemaEntry,
    fieldInfo: { ctx }
  } = props
  const data = props.data as number

  const handleValueChange = useCallback(
    (value: number) => {
      ctx.executeAction('change', { schemaEntry, route, field, value })
    },
    [ctx]
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
