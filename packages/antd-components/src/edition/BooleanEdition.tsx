import { Switch } from 'antd'
import React, { useCallback } from 'react'
import { EditionProps } from '@cpu-studio/json-editor/src/components/type/props'

export const BooleanEdition = (props: EditionProps) => {
  const {
    route,
    field,
    data,
    schemaEntry,
    fieldInfo: { ctx }
  } = props

  const handleValueChange = useCallback(
    (value: any) => {
      if (value !== undefined) ctx.executeAction('change', { schemaEntry, route, field, value })
    },
    [ctx]
  )

  return (
    <Switch checkedChildren="true" unCheckedChildren="false" checked={data} onChange={handleValueChange} size="small" />
  )
}
