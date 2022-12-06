import { Switch } from 'antd'
import React, { useCallback } from 'react'
import { EditionProps } from '../../core/type/props'

export const BooleanEdition = (props: EditionProps) => {
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
    <Switch checkedChildren="true" unCheckedChildren="false" checked={data} onChange={handleValueChange} size="small" />
  )
}
