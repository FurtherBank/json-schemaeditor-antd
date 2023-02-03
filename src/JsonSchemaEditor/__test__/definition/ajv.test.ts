import ajvInstance from '../../definition/ajvInstance'
import { getExample } from '../test-utils'

test('draft4 support', () => {
  expect(true).toBeTruthy()
})

test('errors of partial validation', () => {
  const [data, schema] = getExample('一系列测试')

  ajvInstance.addSchema(schema, 'id')

  const validate = ajvInstance.getSchema('id#/properties/mess')!
  validate(data.mess)

  console.log(validate.errors)

  expect(validate.errors?.length).toBe(1)
  expect(validate.errors![0]).toStrictEqual({
    instancePath: '/1',
    schemaPath: '#/items/format',
    keyword: 'format',
    params: { format: 'color' },
    message: 'must match format "color"'
  })
  const validate2 = ajvInstance.getSchema('id')!
  expect(typeof validate2).toBe('function')
})
