import '@testing-library/jest-dom'
import React from 'react'
import { render } from '@testing-library/react'
import JsonSchemaEditor, { metaSchema } from '../../..'
import examples from '../../demos/examples'
import _ from 'lodash'
import { JSONSchema6 } from 'json-schema'

test('view is list when root schema is array', async () => {
  const exampleJson = examples(metaSchema)
  const [data, schema] = exampleJson['view: list']
  // const { asFragment } =
  render(<JsonSchemaEditor data={data} schema={schema} />)
  // asserts
  const listItems = document.querySelectorAll('.list-item')
  expect(listItems).toHaveLength(data.length)
})

test('view is not list when root is array but schema not', async () => {
  const exampleJson = examples(metaSchema)
  const [data, schema] = exampleJson['view: list']
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
  render(<JsonSchemaEditor data={data} schema={realSchema as JSONSchema6} />)
  // asserts
  const listItems = document.querySelectorAll('.list-item')
  expect(listItems).toHaveLength(0)
})
