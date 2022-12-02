import { ComponentType } from 'react'
import { ContainerProps, EditionProps, MenuActionProps } from '../components/types'
import { JSONSchema } from './Schema'

export type CpuEditionType = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null' | 'enum' | 'const'
/**
 * 编辑器使用的所有组件的 map。
 *
 * 根据对应的组件角色索引到对应使用的组件。
 */
export interface IComponentMap {
  containerNormal: ComponentType<ContainerProps>
  containerShort: ComponentType<ContainerProps>
  title: ComponentType<EditionProps>
  menuAction: ComponentType<MenuActionProps>
  operation: Record<string, ComponentType<any>>
  format: Record<string, ComponentType<any>>
  edition: Record<CpuEditionType, ComponentType<EditionProps>>
  drawer: ComponentType<any>
}

export interface IViewsMap extends Partial<IComponentMap> {
  /**
   * 使用该自定义 view 的字段是否可以作为 [短字段](https://github.com/FurtherBank/json-schemaeditor-antd#短字段)。
   *
   * 注意，viewMap 中的所有组件都使用`shortable`的统一设置。
   *
   * 如果您需要对不同的组件设置不同的`shortable`值，可以使用不同的`viewType`
   */
  shortable: boolean
  /**
   * 使用该自定义 view 的字段参数的 schema。
   *
   * 如果不设置，将认为该自定义 view 没有任何参数。
   *
   * 注：该字段仅供对外声明使用，为提高性能，并不对传入的参数进行校验。
   */
  paramSchema?: JSONSchema
}
