import '@testing-library/jest-dom'
import React from 'react'
import { render } from '@testing-library/react'
import JsonSchemaEditor from '../..'
import { getExample } from '../test-utils'
import { JSONSchema } from '../../type/Schema'

test('view is list when schema has view.type === list', async () => {
  const [data, schema] = getExample('view: list')
  // const { asFragment } =
  render(<JsonSchemaEditor data={data} schema={schema} />)
  // asserts
  const listItems = document.querySelectorAll('.list-item')
  expect(listItems).toHaveLength(data.length)
})

test('view is not list when schema has view.type === list but data is not root', async () => {
  const schema = {
    $schema: 'http://json-schema.org/draft-06/schema#',
    type: 'object',
    properties: {
      a: {
        type: 'array',
        view: {
          type: 'list'
        },
        items: [
          {
            type: 'null'
          },
          {
            type: 'string'
          }
        ],
        additionalItems: {
          type: 'integer'
        }
      }
    }
  }

  // const { asFragment } =
  render(<JsonSchemaEditor data={{ a: [null, 'abcd', 0, 12, 5] }} schema={schema as JSONSchema} />)
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
