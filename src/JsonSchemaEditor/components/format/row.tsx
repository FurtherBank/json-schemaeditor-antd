import React, { useCallback } from 'react'
import { CInput } from '../base/cacheInput'
import { FormatEditionProps } from '../types'

export const RowEdition = (props: FormatEditionProps) => {
  const { route, field, data } = props
  // 这里单独拿出来是为防止 ts 认为是 undefined
  const doAction = props.doAction!

  const handleValueChange = useCallback(
    (value: any) => {
      if (value !== undefined) doAction('change', route, field, value)
    },
    [doAction]
  )

  return (
    <CInput
      size="small"
      key="value"
      value={data}
      onValueChange={handleValueChange}
      validate={true}
      onPressEnter={(e: any) => {
        e.currentTarget.blur()
      }}
      style={{ flex: 1, minWidth: '400px' }}
    />
  )
}
