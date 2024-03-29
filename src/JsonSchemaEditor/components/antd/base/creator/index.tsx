import React from 'react'
import { jsonDataType } from '../../../../utils'
import { ArrayItemCreator, CreateNameProps, ObjectPropCreator } from './CreateName'

export const CreateName = (props: CreateNameProps) => {
  const { data } = props
  const type = jsonDataType(data)
  return type === 'object' ? <ObjectPropCreator {...props} /> : <ArrayItemCreator {...props} />
}
