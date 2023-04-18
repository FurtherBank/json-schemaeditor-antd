import '@testing-library/jest-dom'
import React from 'react'
import { render } from '@testing-library/react'
import JsonSchemaEditor from '../..'
import { countNullId, getExample } from '../test-utils'

test('default', () => {
  const [data, schema] = getExample('小型示例')
  // const { asFragment } =
  render(<JsonSchemaEditor data={data} schema={schema} />)
  expect(countNullId(data)).toBe(0)
})
