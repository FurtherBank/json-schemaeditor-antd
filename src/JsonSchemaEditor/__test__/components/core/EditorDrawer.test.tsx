import { fireEvent, act } from '@testing-library/react'
import JsonSchemaEditor from '../../..'
import CpuEditorContext from '../../../context'
import { getExample } from '../../test-utils'
import { MockRender } from '../../test-utils/MockComponent'

it('not render field while not visible', async () => {
  const [data, schema] = getExample('一系列测试')
  const { current: ctx } = MockRender<CpuEditorContext>(JsonSchemaEditor, { data, schema })

  // 点击 detail
  act(() => ctx.interaction.setDrawer(['mess'], '1'))

  // 关闭 drawer
  act(() => {
    const drawer = document.querySelector('.cpu-drawer')!

    const drawerClose = drawer.querySelector('.ant-drawer-close')! as HTMLElement

    fireEvent.click(drawerClose)
  })

  ctx.executeAction('change', undefined, [], 'mess', '')

  // 因为 immutable 性质，所以应当使用 ctx.getNowData 获取最新的 data
  expect(ctx.getNowData().mess).toBe('')
})
