import '@testing-library/jest-dom'
import React from 'react'
import { render } from '@testing-library/react'
import JsonSchemaEditor from '@cpu-studio/json-editor/src'
import { getExample } from '@cpu-studio/json-editor/src/__test__/test-utils'
import { JSONSchema } from '@cpu-studio/json-editor/src/type/Schema'
import { antdComponentMap, antdViewsMap } from '../../src'
import CpuEditorContext from '@cpu-studio/json-editor/src/context'
import { EditorProps } from '@cpu-studio/json-editor/src/JsonSchemaEditor'
import { MockRender } from '@cpu-studio/json-editor/src/__test__/test-utils/MockComponent'

test('view is list when schema has view.type === list', async () => {
  const [data, schema] = getExample('view: list')
  // const { asFragment } =
  render(<JsonSchemaEditor data={data} schema={schema} componentMap={antdComponentMap} viewsMap={antdViewsMap} />)
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
  render(
    <JsonSchemaEditor
      data={{ a: [null, 'abcd', 0, 12, 5] }}
      schema={schema as JSONSchema}
      componentMap={antdComponentMap}
      viewsMap={antdViewsMap}
    />
  )
  // asserts
  const listItems = document.querySelectorAll('.list-item')
  expect(listItems).toHaveLength(0)
})

test('view is not list when root schema is array but data not', async () => {
  const [, schema] = getExample('view: list')
  // const { asFragment } =
  render(<JsonSchemaEditor data={123} schema={schema} componentMap={antdComponentMap} viewsMap={antdViewsMap} />)
  // asserts
  const listItems = document.querySelectorAll('.list-item')
  expect(listItems).toHaveLength(0)
})

test('parse in need', () => {
  const [data, schema] = getExample('view: list')
  // const { asFragment } =

  const editorProps: EditorProps = { data, schema, componentMap: antdComponentMap, viewsMap: antdViewsMap }
  const { current: ctx } = MockRender<CpuEditorContext>(JsonSchemaEditor, editorProps)
  console.log(ctx.mergedSchemaMap.keys())

  // only parse direct subField of array item
  expect(ctx.mergedSchemaMap.has('#/items/0')).toBe(true)
  expect(ctx.mergedSchemaMap.has('#/items/2')).toBe(true)
  expect(ctx.mergedSchemaMap.has('#/items/2/properties/name')).toBe(false)
})