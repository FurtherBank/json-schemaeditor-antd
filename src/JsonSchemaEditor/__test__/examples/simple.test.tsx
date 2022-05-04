import '@testing-library/jest-dom'
import React from 'react'
import { render } from '@testing-library/react'
import JsonSchemaEditor, { metaSchema } from '../../..'
import examples from '../../demos/examples'
import { countNullId } from '../testUtils'

test('simple', () => {
  const exampleJson = examples(metaSchema)
  const [data, schema] = exampleJson['简单示例']
  // const { asFragment } =
  render(<JsonSchemaEditor data={data} schema={schema} />)
  expect(countNullId(data)).toBe(0)
})
