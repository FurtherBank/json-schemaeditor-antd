import '@testing-library/jest-dom'
import JsonSchemaEditor from '../../..'
import { MergedSchema } from '../../../context/mergeSchema'
import { getExample, mockCtx } from '../../test-utils'
import { MockRender } from '../../test-utils/MockComponent'
import CpuEditorContext from '../../../context'

it('use alternative rules correctly', () => {
  const [, schema] = getExample('替代法则测试')
  const ctx = mockCtx(schema)
  const rootMerged = ctx.getMergedSchema('#/') as MergedSchema

  expect(rootMerged.format).toBe('multiline')
  expect(rootMerged.title).toBe('alternative')
  expect(rootMerged.description).toBe('#/definitions/a')
})

it('parse in need', () => {
  const [data, schema] = getExample('view: list')
  // const { asFragment } =

  const { current: ctx } = MockRender<CpuEditorContext>(JsonSchemaEditor, {
    data,
    schema
  })

  console.log(ctx.mergedSchemaMap.keys())

  expect(ctx.mergedSchemaMap.has('#/items/0')).toBe(true)
  expect(ctx.mergedSchemaMap.has('#/items/2')).toBe(false)
})
