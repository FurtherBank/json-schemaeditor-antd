import React from 'react'
import { CInput } from '../../utils/cacheInput'
import { IFieldEditProps } from '../types'

const allUsedProps = {
  size: 'small',
  key: 'value',
  validate: true
}

export const StringEdit = (props: IFieldEditProps<string>) => {
  const { data, onValueChange } = props

  return (
    <CInput
      {...allUsedProps}
      style={{ flex: 1 }}
      value={data}
      onValueChange={onValueChange}
      onPressEnter={(e: any) => {
        e.currentTarget.blur()
      }}
    />
  )
}
