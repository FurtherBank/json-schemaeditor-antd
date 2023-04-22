import _ from 'lodash'
import { isShort } from '../../context/virtual'
import { getExample, mockCtx } from '../test-utils'

test('parse ok', () => {
  const [data, schema] = getExample('简单示例')
  const ctx = mockCtx(data, schema)
  const rootMerged = ctx.getMergedSchema('#/')
  const newProps = {} as any
  for (const key in schema.properties) {
    if (Object.prototype.hasOwnProperty.call(schema.properties, key)) {
      newProps[key] = '#/properties/' + key
    }
  }

  expect(rootMerged).toEqual(
    Object.assign(_.omit(schema, 'properties'), {
      type: [schema.type],
      properties: newProps,
      additionalProperties: false,
      [isShort]: false
    })
  )
})
