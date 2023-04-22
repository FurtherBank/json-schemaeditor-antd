import { fireEvent, act, screen } from '@testing-library/react'
import React, { useCallback, useImperativeHandle } from 'react'
import { forwardRef, useRef } from 'react'
import JsonSchemaEditor from '@cpu-studio/json-editor/src'
import CpuEditorContext from '@cpu-studio/json-editor/src/context'
import { getExample } from '@cpu-studio/json-editor/src/__test__/test-utils'
import { MockRender } from '@cpu-studio/json-editor/src/__test__/test-utils/MockComponent'
import { antdComponentMap, antdViewsMap } from '../src'

it('root menu items work', async () => {
  const [data, schema] = getExample('string[]')

  const TestComponent = forwardRef<CpuEditorContext | null, any>((props, ref) => {
    const editorRef = useRef<CpuEditorContext>(null)

    useImperativeHandle(ref, () => editorRef.current!, [editorRef.current])

    const pushItem = useCallback(() => {
      const ctx = editorRef.current
      if (ctx) {
        const data = ctx.getNowData()
        if (data instanceof Array) {
          const newItem = `new Item ${data.length}`
          ctx.executeAction('create', { route: [], field: data.length.toString(), value: newItem })
        }
      }
    }, [editorRef])
    const rootMenuItems = [
      <button key="1" type="button" onClick={pushItem}>
        press to push item
      </button>
    ]

    return (
      <JsonSchemaEditor
        data={data}
        schema={schema}
        rootMenuItems={rootMenuItems}
        ref={editorRef}
        componentMap={antdComponentMap}
        viewsMap={antdViewsMap}
      />
    )
  }) as any

  const { current: ctx } = MockRender<CpuEditorContext>(TestComponent, {})

  const rootMenuButton = screen.getByRole('button', {
    name: /press to push item/i
  })

  expect(rootMenuButton).toBeTruthy()

  // 点击 rootMenuButton
  act(() => {
    fireEvent.click(rootMenuButton)
  })

  // 因为 immutable 性质，所以应当使用 ctx.getNowData 获取最新的 data
  expect(ctx.getNowData().length).toBe(5)
  expect(ctx.getNowData()[4]).toBe('new Item 4')
})
