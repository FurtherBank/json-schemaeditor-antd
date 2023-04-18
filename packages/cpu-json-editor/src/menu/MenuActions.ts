import { ofSchemaCache } from '../context/ofInfo'

export const MenuActions = ['undo', 'redo', 'detail', 'reset', 'moveup', 'movedown', 'delete'] as const

export type MenuActionType = (typeof MenuActions)[number]

export interface FieldOpParams {
  create: true | string[]
  oneOf: ofSchemaCache
  type: string[]
}
