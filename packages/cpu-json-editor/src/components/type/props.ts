import { ReactNode } from 'react'
import { FieldProps, IField } from '../../../Field'
import { MenuActionType } from '../../../menu/MenuActions'

export interface EditionProps extends FieldProps {
  children?: ReactNode
  fieldInfo: IField
}

export interface FormatEditionProps extends EditionProps {
  format: string
}

export type MenuActionHandlers = Record<MenuActionType, () => void>

/**
 * 应用短优化的容器组件使用的属性。
 *
 * 相比普通容器组件，不会从属性中继承 菜单动作组件 和 选择操作组件。
 */
export interface ContainerProps extends EditionProps {
  fieldDomId: string
  availableMenuActions: MenuActionType[]
  menuActionHandlers: MenuActionHandlers
  titleComponent: ReactNode
  valueComponent: ReactNode
}

export interface MenuActionProps<T extends MenuActionType = MenuActionType> {
  opType: T
  opHandler: () => void
}

export interface EditorDrawerProps {
  visible: boolean
  children?: ReactNode
  onClose: () => void
}
