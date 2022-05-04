import '@testing-library/jest-dom'
import React from 'react'
import { render, screen } from '@testing-library/react'
import JsonSchemaEditor, { metaSchema } from '../../..'
import examples from '../../demos/examples'

test('basic', () => {
  const exampleJson = examples(metaSchema)
  const [data, schema] = exampleJson['基础']
  // const { asFragment } =
  render(<JsonSchemaEditor data={data} schema={schema} />)
  // asserts
  const input = screen.getByDisplayValue(data)
  expect(input).toBeTruthy()
})
