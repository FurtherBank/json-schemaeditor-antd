import '@testing-library/jest-dom'
import React from 'react'
import { render } from '@testing-library/react'
import JsonSchemaEditor from '../../..'
import _ from 'lodash'
import { getExample } from '../test-utils'
import { JSONSchema } from '../../type/Schema'

test('view is list when root schema is array', async () => {
  const [data, schema] = getExample('view: list')
  // const { asFragment } =
  render(<JsonSchemaEditor data={data} schema={schema} />)
  // asserts
  const listItems = document.querySelectorAll('.list-item')
  expect(listItems).toHaveLength(data.length)
})

test('view is not list when root is array but schema not', async () => {
  const [data, schema] = getExample('view: list')
  const realSchema = {
    $schema: schema.$schema,
    oneOf: [
      _.omit(schema, ['$schema']),
      {
        type: 'object',
        maxProperties: 18
      }
    ]
  }
  // const { asFragment } =
  render(<JsonSchemaEditor data={data} schema={realSchema as JSONSchema} />)
  // asserts
  const listItems = document.querySelectorAll('.list-item')
  expect(listItems).toHaveLength(0)
})

test('view is not list when root schema is array but data not', async () => {
  const [, schema] = getExample('view: list')
  // const { asFragment } =
  render(<JsonSchemaEditor data={123} schema={schema} />)
  // asserts
  const listItems = document.querySelectorAll('.list-item')
  expect(listItems).toHaveLength(0)
})
