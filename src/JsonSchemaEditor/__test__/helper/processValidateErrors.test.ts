import '@testing-library/jest-dom'
import { getExample, mockCtx } from '../test-utils'

it('partial validate errors ok', () => {
  const [data, schema] = getExample('一系列测试')
  const ctx = mockCtx(data, schema)

  const errors = ctx.store.getState().present.dataErrors
  const mess1Error = errors['/mess/1']
  expect(mess1Error.length).toBe(1)
  expect(mess1Error[0].instancePath).toBe('/mess/1')
  expect(mess1Error[0].schemaPath).toBe('#/definitions/messDefForRefTest/items/format')

  // change mess/0 to error
  ctx.executeAction('change', '#/definitions/messDefForRefTest/items', ['mess'], '0', '12345644')

  const errors1 = ctx.store.getState().present.dataErrors
  const mess0Error = errors1['/mess/0']
  expect(mess0Error.length).toBe(1)
  expect(mess0Error[0].instancePath).toBe('/mess/0')
  expect(mess0Error[0].schemaPath).toBe('#/definitions/messDefForRefTest/items/format')
  expect(errors1['/mess/1']).toBe(mess1Error) // 之前的错误引用未变，代表修改为局部不影响其它

  // fix mess/1 error
  ctx.executeAction('change', '#/definitions/messDefForRefTest/items', ['mess'], '1', '#123456')

  const errors2 = ctx.store.getState().present.dataErrors
  expect(errors2['/mess/1']).toBeUndefined()
  expect(errors2['/mess/0']).toBe(mess0Error) // 之前的错误引用未变，代表修改为局部不影响其它
})
