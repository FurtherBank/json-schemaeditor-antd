import { useMemo, useCallback } from 'react'
import CpuEditorContext from '../../../context'
import { getDefaultValue } from '../../../definition/defaultValue'
import { FatherInfo } from '../type/list'

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
  fatherInfo: FatherInfo | undefined,
  schemaEntry: string | undefined,
  valueEntry: string | undefined,
  data: any
) => {
  const { schemaEntry: parentSchemaEntry } = fatherInfo ?? {}

  const resetHandler = useCallback(() => {
    ctx.executeAction('change', { route, field, value: getDefaultValue(ctx, valueEntry, data) })
  }, [data, valueEntry, route, field, ctx])

  const menuActionHandlers = useMemo(
    () => ({
      detail: () => {
        ctx.interaction.setDrawer(route, field)
      },
      reset: resetHandler,
      moveup: () => {
        ctx.executeAction('moveup', { route, field, schemaEntry: parentSchemaEntry })
      },
      movedown: () => {
        ctx.executeAction('movedown', { route, field, schemaEntry: parentSchemaEntry })
      },
      delete: () => {
        ctx.executeAction('delete', { route, field, schemaEntry: parentSchemaEntry })
      },
      undo: () => {
        ctx.executeAction('undo')
      },
      redo: () => {
        ctx.executeAction('redo')
      },
      paste: () => {
        ctx.executeAction('change', { route, field, value: 0, schemaEntry })
      }
    }),
    [resetHandler, route, field, ctx, parentSchemaEntry]
  )

  return menuActionHandlers
}
