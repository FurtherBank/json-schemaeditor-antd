import React, { useCallback } from 'react'
import { CInput } from '../base/cacheInput'
import { EditionProps } from '../../core/type/props'

const allUsedProps = {
  size: 'small',
  key: 'value',
  validate: true
}

export const StringEdition = (props: EditionProps) => {
  const {
    route,
    field,
    data,
    schemaEntry,
    fieldInfo: { ctx }
  } = props

  const handleValueChange = useCallback(
    (value: string) => {
      if (value !== undefined) ctx.executeAction('change', { schemaEntry, route, field, value })
    },
    [ctx]
  )

  return (
    <CInput
      {...allUsedProps}
      style={{ flex: 1 }}
      value={data}
      onValueChange={handleValueChange}
      onPressEnter={(e: any) => {
        e.currentTarget.blur()
      }}
    />
  )
}
