import { ReactNode } from 'react'
import { FieldProps, IField } from '../Field'
import { MenuActionType } from '../menu/MenuActions'

export interface EditionProps extends FieldProps {
  children?: ReactNode
  fieldInfo: IField
}

export interface FormatEditionProps extends EditionProps {
  format: string
}

export interface MenuActionProps<T extends MenuActionType = MenuActionType> {
  opType: T
  opHandler: () => void
}
