import '@testing-library/jest-dom'
import JsonSchemaEditor from '../../../JsonSchemaEditor'
import { MergedSchema } from '../../../context/mergeSchema'
import { getExample, mockCtx } from '../../test-utils'
import { MockRender } from '../../test-utils/MockComponent'
import CpuEditorContext from '../../../context'

it('use alternative rules correctly', () => {
  const [data, schema] = getExample('替代法则测试')
  const ctx = mockCtx(data, schema)
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

  // only parse direct subField of array item
  expect(ctx.mergedSchemaMap.has('#/items/0')).toBe(true)
  expect(ctx.mergedSchemaMap.has('#/items/2')).toBe(true)
  expect(ctx.mergedSchemaMap.has('#/items/2/properties/name')).toBe(false)
})
