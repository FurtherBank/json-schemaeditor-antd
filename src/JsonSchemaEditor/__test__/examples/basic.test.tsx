import '@testing-library/jest-dom'
import React from 'react'
import { render, screen } from '@testing-library/react'
import JsonSchemaEditor from '../../..'
import { getExample } from '../test-utils'

test('basic', () => {
  const [data, schema] = getExample('基础')
  // const { asFragment } =
  render(<JsonSchemaEditor data={data} schema={schema} />)
  // asserts
  const input = screen.getByDisplayValue(data)
  expect(input).toBeTruthy()
})
