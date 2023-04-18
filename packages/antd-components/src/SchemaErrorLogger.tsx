import { Alert } from 'antd'
import React from 'react'

export const SchemaErrorLogger = (props: { error: string }) => {
  const { error } = props
  return <Alert message="Error" description={error} type="error" showIcon />
}
