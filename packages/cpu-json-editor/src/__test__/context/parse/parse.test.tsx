import '@testing-library/jest-dom'
import JsonSchemaEditor, { EditorProps } from '../../../JsonSchemaEditor'
import { MergedSchema } from '../../../context/mergeSchema'
import { getExample, mockCtx } from '../../test-utils'
import { MockRender } from '../../test-utils/MockComponent'
import CpuEditorContext from '../../../context'
import { MockComponentMap } from '../../test-utils/componentMap'

it('use alternative rules correctly', () => {
  const [data, schema] = getExample('替代法则测试')
  const ctx = mockCtx(data, schema)
  const rootMerged = ctx.getMergedSchema('#/') as MergedSchema

  expect(rootMerged.format).toBe('multiline')
  expect(rootMerged.title).toBe('替代法则测试')
  expect(rootMerged.description).toBe('#/definitions/a')
})

it('do not parse when components not used', () => {
  const [data, schema] = getExample('view: list')
  // const { asFragment } =

  const editorProps: EditorProps = { data, schema, componentMap: MockComponentMap }
  const { current: ctx } = MockRender<CpuEditorContext>(JsonSchemaEditor, editorProps)
  console.log(ctx.mergedSchemaMap.keys())

  // only parse direct subField of array item
  expect(ctx.mergedSchemaMap.has('#/items/0')).toBe(false)
  expect(ctx.mergedSchemaMap.has('#/items/2')).toBe(false)
  expect(ctx.mergedSchemaMap.has('#/items/2/properties/name')).toBe(false)
})
