import { ComponentType } from 'react'
import { EditionProps, MenuActionProps } from '../components/types'

export type CpuEditionType = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null' | 'enum' | 'const'
/**
 * 编辑器使用的所有组件的 map。
 *
 * 根据对应的组件角色索引到对应使用的组件。
 */
export interface IComponentMap {
  container: any
  title: ComponentType<EditionProps>
  menuAction: ComponentType<MenuActionProps>
  operation: Record<string, ComponentType<any>>
  format: Record<string, ComponentType<any>>
  edition: Record<CpuEditionType, ComponentType<EditionProps>>
  drawer: ComponentType<any>
}
