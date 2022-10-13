import React from 'react'
import { IFieldEditProps } from '../types'
import { CInputNumber } from '../../utils/cacheInput'

export const NumberEdit = (props: IFieldEditProps<number>) => {
  const { data, onValueChange } = props

  return (
    <CInputNumber
      size="small"
      key="value"
      value={data}
      validate
      onValueChange={onValueChange}
      onPressEnter={(e: any) => {
        e.target.blur()
      }}
      style={{ flex: 1 }}
    />
  )
}
