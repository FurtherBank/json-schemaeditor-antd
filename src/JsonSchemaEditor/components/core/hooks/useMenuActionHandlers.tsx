import { useMemo, useCallback } from 'react'
import CpuEditorContext from '../../../context'
import { getDefaultValue } from '../../../definition/defaultValue'

/**
 * [业务] 获取所有 menuAction 的处理函数
 * @param ctx
 * @param route
 * @param field
 * @param valueEntry
 * @param data
 * @returns
 */
export const useMenuActionHandlers = (
  ctx: CpuEditorContext,
  route: string[],
  field: string | undefined,
  valueEntry: string | undefined,
  data: any
) => {
  const resetHandler = useCallback(() => {
    ctx.executeAction('change', route, field, getDefaultValue(ctx, valueEntry, data))
  }, [data, valueEntry, route, field, ctx])

  const menuActionHandlers = useMemo(
    () => ({
      detail: () => {
        ctx.interaction.setDrawer(route, field)
      },
      reset: resetHandler,
      moveup: () => {
        ctx.executeAction('moveup', route, field)
      },
      movedown: () => {
        ctx.executeAction('movedown', route, field)
      },
      delete: () => {
        ctx.executeAction('delete', route, field)
      },
      undo: () => {
        ctx.executeAction('undo')
      },
      redo: () => {
        ctx.executeAction('redo')
      },
      paste: () => {
        ctx.executeAction('change', route, field, 0)
      }
    }),
    [resetHandler, route, field, ctx]
  )

  return menuActionHandlers
}
