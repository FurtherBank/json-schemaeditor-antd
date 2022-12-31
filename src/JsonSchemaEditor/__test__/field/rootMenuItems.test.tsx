import { fireEvent, act, screen } from '@testing-library/react'
import React, { useCallback, useImperativeHandle } from 'react'
import { forwardRef, useRef } from 'react'
import JsonSchemaEditor from '../../..'
import CpuEditorContext from '../../context'
import { getExample } from '../test-utils'
import { MockRender } from '../test-utils/MockComponent'

it('root menu items work', async () => {
  const [data, schema] = getExample('basic: string Array')

  const TestComponent = forwardRef<CpuEditorContext | null, any>((props, ref) => {
    const editorRef = useRef<CpuEditorContext>(null)

    useImperativeHandle(ref, () => editorRef.current!, [editorRef.current])

    const pushItem = useCallback(() => {
      const ctx = editorRef.current
      if (ctx) {
        const data = ctx.getNowData()
        if (data instanceof Array) {
          const newItem = `new Item ${data.length}`
          ctx.executeAction('create', [], data.length.toString(), newItem)
        }
      }
    }, [editorRef])
    const rootMenuItems = [
      <button key="1" type="button" onClick={pushItem}>
        press to push item
      </button>
    ]

    return <JsonSchemaEditor data={data} schema={schema} rootMenuItems={rootMenuItems} ref={editorRef} />
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
