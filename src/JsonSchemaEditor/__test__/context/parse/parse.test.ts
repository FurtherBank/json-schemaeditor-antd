import { MergedSchema } from '../../../context/mergeSchema'
import { getExample, mockCtx } from '../../test-utils'

it('use alternative rules correctly', () => {
  const [, schema] = getExample('替代法则测试')
  const ctx = mockCtx(schema)
  const rootMerged = ctx.getMergedSchema('#/') as MergedSchema

  expect(rootMerged.format).toBe('multiline')
  expect(rootMerged.title).toBe('alternative')
  expect(rootMerged.description).toBe('#/definitions/a')
})

it('parse in need', () => {
  expect(true).toEqual(true)
})
