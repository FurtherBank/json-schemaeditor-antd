import '@testing-library/jest-dom'
import React from 'react'
import { render } from '@testing-library/react'
import JsonSchemaEditor from '../../..'
import { countNullId, getExample } from '../test-utils'

test('eslint', () => {
  const [data, schema] = getExample('eslint(draft7)')
  // const { asFragment } =
  render(<JsonSchemaEditor data={data} schema={schema} />)
  expect(countNullId(data)).toBeDefined()
  // allof 支持后做验证
})
