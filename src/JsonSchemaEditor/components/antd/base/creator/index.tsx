import React from 'react'
import { ArrayItemCreator, CreateNameProps, ObjectPropCreator } from './CreateName'

export const CreateName = (props: CreateNameProps) => {
  const {
    fatherInfo: { type }
  } = props
  return type === 'object' ? <ObjectPropCreator {...props} /> : <ArrayItemCreator {...props} />
}
