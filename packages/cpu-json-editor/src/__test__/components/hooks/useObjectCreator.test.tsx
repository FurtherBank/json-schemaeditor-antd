import { renderHook } from '@testing-library/react-hooks'
import { useObjectCreator } from '../../../components/hooks/useObjectCreator'
import { CpuEditorAction } from '../../../definition/reducer'
import { getExample, mockCtx } from '../../test-utils'

describe('useObjectCreator: get correct return value', () => {
  const [data, schema] = getExample('一系列测试')
  const ctx = mockCtx(data, schema)

  let createObjectPropOnNewNameTest: (name: string) => any
  renderHook(() => {
    createObjectPropOnNewNameTest = useObjectCreator(
      ctx,
      data['newNameTest'],
      ['newNameTest'],
      '#/properties/newNameTest',
      ctx.getMergedSchema('#/properties/newNameTest')
    )
  })

  let createObjectPropOnRoot: (name: string) => any
  renderHook(() => {
    createObjectPropOnRoot = useObjectCreator(ctx, data, [], '#', ctx.getMergedSchema('#'))
  })

  it('return error message when field exists', () => {
    const result = createObjectPropOnNewNameTest('pro1')
    expect(typeof result).toBe('string')
    expect(result).toBe(`字段 pro1 已经存在！`)
  })
  it('return error message when additionalProperties is not allowed and name is in additionalProperties', () => {
    const result = createObjectPropOnRoot('abcd')
    expect(typeof result).toBe('string')
    expect(result).toBe(`abcd 不匹配 properties 中的名称或 patternProperties 中的正则式`)
  })
  it('create current value with properties', () => {
    const result = createObjectPropOnNewNameTest('pro4')
    expect(result).toEqual<CpuEditorAction>({
      type: 'create',
      route: ['newNameTest'],
      field: 'pro4',
      schemaEntry: '#/properties/newNameTest',
      value: 4
    })
  })
  it('create current value with patternProperties', () => {
    const result = createObjectPropOnNewNameTest('pattern123')
    expect(result).toEqual<CpuEditorAction>({
      type: 'create',
      route: ['newNameTest'],
      field: 'pattern123',
      schemaEntry: '#/properties/newNameTest',
      value: 19
    })
  })
  it('create current value with additionalProperties', () => {
    const result = createObjectPropOnNewNameTest('abcd')
    expect(result).toEqual<CpuEditorAction>({
      type: 'create',
      route: ['newNameTest'],
      field: 'abcd',
      schemaEntry: '#/properties/newNameTest',
      value: 49
    })
  })
})
