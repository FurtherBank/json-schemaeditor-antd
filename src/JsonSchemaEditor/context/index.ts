import { getRefSchemaMap, pathGet } from '../utils'
import { ofSchemaCache, setOfInfo } from './ofInfo'
import { MergedSchema, mergeSchemaMap } from './mergeSchema'
import { doAction, CpuEditorState, CpuEditorAction } from '../definition/reducer'
import { AnyAction, Dispatch, Store } from 'redux'
import { StateWithHistory } from 'redux-undo'
import { JSONSchema } from '../type/Schema'
import { IComponentMap, IViewsMap } from '../type/Components'
import { antdComponentMap, antdViewsMap } from '../components/antd'
import Field from '../Field'
import { ComponentType } from 'react'

export interface SchemaArrayRefInfo {
  ref: string
  length: number
}

/**
 * 整个`editor`的上下文，包含了：
 * - redux store
 * - `schema`的各个`ref`对应的模式性质信息
 * 在编辑器`schema`变更时重新初始化
 */
export default class CpuEditorContext {
  Field = Field
  rootSchema: JSONSchema | false
  mergedSchemaMap: Map<string, MergedSchema | false>
  /**
   * schemaInfo 是 schema 信息的需要对子层进行归纳的部分。
   * 将 schemaInfo 和 mergedSchema 分开，是为了编辑器可以按需创建这些信息。
   */
  ofInfoMap: Map<string, ofSchemaCache | null>
  /**
   * 已加载资源的缓存列表，通过`url`为键索引。
   */
  resourceMap: Map<string, any>

  dispatch: Dispatch<AnyAction>

  executeAction: (type: string, route?: string[], field?: string, value?: any) => CpuEditorAction
  private actionCreator: (type: string, route?: string[], field?: string, value?: any) => CpuEditorAction

  constructor(
    rootSchema: false | JSONSchema,
    public id: string | undefined,
    public store: Store<StateWithHistory<CpuEditorState>, AnyAction>,
    public setDrawer: (route: string[], field: string | undefined) => void,
    public readonly componentMap: IComponentMap = antdComponentMap,
    /**
     * 自定义 view 的组件列表，通过`view.type`索引到 componentMap；
     *
     * 其中 componentMap 的组件都是非必须的。
     *
     * 如果在 schema 中限定了`view.type`，但没有在对应的 componentMap 找到组件，将使用对应的默认组件代替。
     */
    public readonly viewsMap: Record<string, IViewsMap> = antdViewsMap
  ) {
    this.rootSchema = rootSchema
    this.mergedSchemaMap = new Map()
    this.ofInfoMap = new Map()
    this.resourceMap = new Map()
    this.dispatch = store.dispatch
    this.actionCreator = doAction
    this.executeAction = (type: string, route?: string[], field?: string, value?: any) => {
      const action = this.actionCreator(type, route, field, value)
      this.dispatch(action)
      return action
    }
  }

  /**
   * 得到对应 ref 的合并的模式。
   * 如果 ref 不存在则返回空对象
   * @param ref
   * @returns
   */
  getMergedSchema(ref: string | undefined) {
    if (this.rootSchema === false || !ref) return false
    return this.mergedSchemaMap.has(ref) ? this.mergedSchemaMap.get(ref)! : this.makeMergedSchema(ref)
  }

  /**
   * 得到 ref 对应模式的 of 信息。
   *
   * @param ref
   * @returns
   */
  getOfInfo(ref: string | undefined) {
    if (this.rootSchema === false || !ref) return null
    return this.ofInfoMap.has(ref) ? this.ofInfoMap.get(ref)! : setOfInfo(this, ref, this.rootSchema)
  }

  /**
   * 从 componentMap 找到对应 role path 的组件。
   *
   * 和`getComponent`的区别是，若未找到，会 fallback 为对应的`string`编辑组件。
   * @param view 组件的`viewType`(必须经过验证)
   * @param rolePath 组件角色路径
   * @returns
   */
  getComponent(view: string | null = null, rolePath: string | string[]): ComponentType<any> {
    const componentPath = typeof rolePath === 'string' ? [rolePath] : rolePath
    if (view) {
      const result = pathGet(this.viewsMap[view] || {}, componentPath)

      if (result) return result
    }
    const result = pathGet(this.componentMap, componentPath)
    if (result) {
      return result
    } else {
      throw new Error(`The component of ${componentPath} not exist in component map`)
    }
  }

  /**
   * 从 componentMap 找到对应 string format 的组件。
   *
   * 和`getComponent`的区别是，若未找到，会 fallback 为对应的`string`编辑组件。
   * @param view 组件的`viewType`(必须经过验证)
   * @param format
   * @returns
   */
  getFormatComponent(view: string | null = null, format: string): ComponentType<any> {
    const componentPath = ['format', format]
    if (view) {
      const result = pathGet(this.viewsMap, componentPath)
      if (result) return result
    }
    const result = pathGet(this.componentMap, componentPath)
    if (result) {
      return result
    } else {
      return this.getComponent(view, ['edition', 'string'])
    }
  }

  private makeMergedSchema(ref: string) {
    if (typeof this.rootSchema === 'boolean') return false
    const map = getRefSchemaMap(ref, this.rootSchema)
    const mergedSchema = mergeSchemaMap(this, map)
    this.mergedSchemaMap.set(ref, mergedSchema)
    return mergedSchema
  }
}
