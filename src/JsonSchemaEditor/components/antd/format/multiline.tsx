import React, { useCallback } from 'react'
import { CTextArea } from '../base/cacheInput'
import { FormatEditionProps } from '../../core/type/props'

export const MultilineEdition = (props: FormatEditionProps) => {
  const { route, field, data, schemaEntry } = props
  // 这里单独拿出来是为防止 ts 认为是 undefined
  const doAction = props.doAction!

  const handleValueChange = useCallback(
    (value: any) => {
      if (value !== undefined) doAction('change', schemaEntry, route, field, value)
    },
    [doAction]
  )

  return (
    <CTextArea
      size="small"
      key="value"
      value={data}
      onValueChange={handleValueChange}
      validate={true}
      style={{ flex: 1 }}
      autoSize={{ minRows: 3, maxRows: 5 }}
      onPressEnter={undefined}
    />
  )
}
