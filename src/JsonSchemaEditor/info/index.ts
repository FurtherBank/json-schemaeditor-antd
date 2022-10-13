import { getRefSchemaMap } from '../utils'
import { itemSubInfo, makeItemInfo } from './subInfo'
import { ofSchemaCache, setOfInfo } from './ofInfo'
import { MergedSchema, mergeSchemaMap } from './mergeSchema'
import { doAction, State } from '../reducer'
import { AnyAction, Dispatch, Store } from 'redux'
import { StateWithHistory } from 'redux-undo'
import { JSONSchema } from '../type/Schema'

export interface arrayRefInfo {
  ref: string
  length: number
}

/**
 * SubInfo 是 schema 信息中需要对子层进行归纳的部分。
 * 将 SubInfo 和 mergedSchema 分开，是为了编辑器可以按需创建这些信息。
 * 这些信息需要具有以下性质：
 * 1. 收集这些信息时，只需要使用子模式的 mergedSchema，不需要它们的 subInfo，防止一次性全递归。
 *
 */
type SubInfo = {
  itemInfo: itemSubInfo | null
}

/**
 * 整个`editor`的上下文，包含了：
 * - redux store
 * - `schema`的各个`ref`对应的模式性质信息
 * 在编辑器`schema`变更时重新初始化
 */
export default class SchemaInfoContent {
  rootSchema: JSONSchema | false
  mergedSchemaMap: Map<string, MergedSchema | false>
  subInfoMap: Map<string, SubInfo>
  /**
   * schemaInfo 是 schema 信息的需要对子层进行归纳的部分。
   * 将 schemaInfo 和 mergedSchema 分开，是为了编辑器可以按需创建这些信息。
   */
  ofInfoMap: Map<string, ofSchemaCache | null>
  dispatch: Dispatch<AnyAction>
  doAction: (
    type: string,
    route?: string[],
    field?: string,
    value?: undefined
  ) => { type: string; route: string[]; field?: string; value?: any }

  constructor(
    rootSchema: false | JSONSchema,
    public id: string | undefined,
    public store: Store<StateWithHistory<State>, AnyAction>
  ) {
    this.rootSchema = rootSchema
    this.mergedSchemaMap = new Map()
    this.subInfoMap = new Map()
    this.ofInfoMap = new Map()
    this.dispatch = store.dispatch
    this.doAction = doAction
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
   * 得到 ref 下的 subInfo 信息。
   * @param ref
   * @returns
   */
  getSubInfo(ref: string | undefined): SubInfo {
    if (this.rootSchema === false || !ref)
      return {
        itemInfo: null
      }
    return this.subInfoMap.has(ref) ? this.subInfoMap.get(ref)! : this.makeSubInfo(ref)
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

  private makeMergedSchema(ref: string) {
    if (typeof this.rootSchema === 'boolean') return false
    const map = getRefSchemaMap(ref, this.rootSchema)
    const mergedSchema = mergeSchemaMap(map)
    this.mergedSchemaMap.set(ref, mergedSchema)
    return mergedSchema
  }

  private makeSubInfo(ref: string) {
    if (typeof this.rootSchema === 'boolean')
      return {
        itemInfo: null
      }
    const mergedSchema = this.getMergedSchema(ref)
    const info = {
      itemInfo: mergedSchema ? makeItemInfo(this, mergedSchema) : null
    }
    this.subInfoMap.set(ref, info)
    return info
  }
}
