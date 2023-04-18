import { deepGet } from '../utils'
import { ofSchemaCache, setOfInfo } from './ofInfo'
import { MergedSchema, mergeSchemaMap } from './mergeSchema'
import {
  doAction,
  CpuEditorState,
  getReducer,
  CpuEditorActionDispatcher,
  CpuEditorActionOption
} from '../definition/reducer'
import { AnyAction, createStore, Dispatch, Store } from 'redux'
import { StateWithHistory } from 'redux-undo'
import { JSONSchema } from '../type/Schema'
import { IComponentMap, IViewsMap } from '../components/core/ComponentMap'
import Field from '../Field'
import { ComponentType } from 'react'
import { CpuInteraction } from './interaction'
import { v4 as uuidv4 } from 'uuid'
import Ajv from 'ajv/dist/core'
import { getRefSchemaMap } from '../utils/schemaWithRef'

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
  /**
   * 获取 store 中目前的 data
   * @returns
   */
  getNowData = () => {
    return this.store.getState().present.data
  }
  rootSchema: JSONSchema | false
  schemaId: string
  schemaError: any
  store: Store<StateWithHistory<CpuEditorState>, AnyAction>
  basicModelMap: Map<string, any> | any
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
  private createAction: CpuEditorActionDispatcher

  constructor(
    data: any,
    schema: boolean | JSONSchema | undefined,
    public ajvInstance: Ajv,
    public domId: string | undefined,
    public interaction: CpuInteraction,
    public readonly componentMap: IComponentMap,
    /**
     * 自定义 view 的组件列表，通过`view.type`索引到 componentMap；
     *
     * 其中 componentMap 的组件都是非必须的。
     *
     * 如果在 schema 中限定了`view.type`，但没有在对应的 componentMap 找到组件，将使用对应的默认组件代替。
     */
    public readonly viewsMap: Record<string, IViewsMap>
  ) {
    // 1. 注册 schema，并设立 id
    try {
      const realSchema = schema === true ? {} : schema ? schema : schema === false ? false : {}
      const idInSchema = realSchema ? realSchema.$id || realSchema.id : undefined
      this.schemaId = idInSchema || uuidv4()
      ajvInstance.addSchema(realSchema, this.schemaId)
      this.rootSchema = realSchema
    } catch (error) {
      this.schemaError = error
      // 出错了，注册一个空 schema
      this.schemaId = uuidv4()
      this.rootSchema = {}
      ajvInstance.addSchema(this.rootSchema, this.schemaId)
    }

    // 2. 初始化 store，拿到 dispatch
    const initialState: CpuEditorState = {
      data: data,
      dataErrors: {}
    }

    this.store = createStore(getReducer(this), {
      past: [],
      present: initialState,
      future: []
    })

    this.dispatch = this.store.dispatch
    this.createAction = doAction
    // 3. 初始化各种 map
    this.mergedSchemaMap = new Map()
    this.ofInfoMap = new Map()
    this.resourceMap = new Map()
  }

  /**
   * 直接执行动作，对数据进行操作
   * @param type
   * @param options
   * @returns
   */
  executeAction(type: string, options: CpuEditorActionOption = {}) {
    const action = this.createAction(type, options)
    this.dispatch(action)
    return action
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
      const result = deepGet(this.viewsMap[view] || {}, componentPath)

      if (result) return result
    }
    const result = deepGet(this.componentMap, componentPath)
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
      const result = deepGet(this.viewsMap, componentPath)
      if (result) return result
    }
    const result = deepGet(this.componentMap, componentPath)
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
