import React, { useCallback } from 'react'
import { CInput } from '../base/cacheInput'
import { EditionProps } from '../../core/type/props'

const allUsedProps = {
  size: 'small',
  key: 'value',
  validate: true
}

export const StringEdition = (props: EditionProps) => {
  const { route, field, data, schemaEntry } = props
  // 这里单独拿出来是为防止 ts 认为是 undefined
  const doAction = props.doAction!

  const handleValueChange = useCallback(
    (value: string) => {
      if (value !== undefined) doAction('change', schemaEntry, route, field, value)
    },
    [doAction]
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
