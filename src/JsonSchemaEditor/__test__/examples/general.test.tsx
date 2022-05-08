import '@testing-library/jest-dom'
import React from 'react'
import { render, screen } from '@testing-library/react'
import JsonSchemaEditor, { metaSchema } from '../../..'
import examples from '../../demos/examples'
import { countNullId } from '../test-utils'

test('general', () => {
  const exampleJson = examples(metaSchema)
  const [data, schema] = exampleJson['一系列测试']
  // const { asFragment } =
  render(<JsonSchemaEditor data={data} schema={schema} />)
  // asserts
  const textCanSeen = [
    '一系列测试',
    'enumValue',
    'constValue',
    'typeError',
    'Array[5]',
    '类型错误',
    '又臭又长',
    '变量创建-命名测试',
    'pro1',
    'pro3',
    '混乱',
    '格式测试',
    'oneOf套娃 0',
    'oneOf套娃 6'
  ]
  textCanSeen.forEach((text) => {
    expect(screen.getByText(text)).toBeTruthy()
  })
  const displayValueCanSeen = ['如果你不喜欢现在的生活，那么你快去考研吧！', 'pattern567', 'balabala', '#ffffff']
  displayValueCanSeen.forEach((text) => {
    expect(screen.getByDisplayValue(text)).toBeTruthy()
  })
  expect(countNullId(data)).toBe(9) // enumValue(Array[5]) + constValue(Object[2]) + typeError(Object[2]) = 9
})
