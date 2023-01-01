/* eslint-disable no-param-reassign */
import CpuEditorContext from '../context'
import { MergedSchema } from '../context/mergeSchema'
import { getOfOption, getRefByOfChain } from '../context/ofInfo'
import { jsonDataType, getFieldSchema } from '../utils'

export enum ShortLevel {
  no,
  short,
  extra
}

/**
 * 确定一个数据的**常量名称**。
 * 定义具体详见 [常量名称](https://gitee.com/furtherbank/json-schemaeditor-antd#常量名称)
 * @param v
 * @returns
 */
export const toConstName = (v: any) => {
  const t = jsonDataType(v)
  switch (t) {
    case 'object':
      return v.hasOwnProperty('name') ? v.name.toString() : `Object[${Object.keys(v).length}]`
    case 'array':
      return `Array[${v.length}]`
    case 'null':
      return 'null' // 注意 null 没有 toString
    default:
      return v.toString()
  }
}

/**
 * 确定一个模式在 of 选项中展示的**模式名称**。
 * 定义具体详见 [模式名称](https://gitee.com/furtherbank/json-schemaeditor-antd#模式名称)
 * @param mergedSchema 处理合并后的模式
 * @returns
 */
export const toOfName = (mergedSchema: MergedSchema) => {
  const { title, type } = mergedSchema
  if (title) return title
  if (type && type.length === 1) return type[0]
  return ''
}

/**
 * 得到当前 schemaEntry 下的 valueEntry 和 ofOption
 * @param data 当前数据
 * @param schemaEntry 当前数据的 schemaEntry
 * @param ctx 编辑器上下文对象
 * @returns
 */
export const getValueEntry = (data: any, schemaEntry: string | undefined, ctx: CpuEditorContext) => {
  let valueEntry = undefined as undefined | string
  let ofOption: string | false | null = null
  if (schemaEntry) {
    // 确定 valueEntry
    ofOption = getOfOption(data, schemaEntry, ctx)
    valueEntry =
      ofOption === null ? schemaEntry : ofOption === false ? undefined : getRefByOfChain(ctx, schemaEntry, ofOption)
  }
  return { valueEntry, ofOption }
}

/**
 * 得到当前数据通过 instancePath 继续查找得到的 schemaEntry
 * @param data 当然数据
 * @param path 继续的数据路径
 * @param ctx 编辑器上下文对象
 * @param curEntry 当前的 valueEntry，从这里开始查找
 */
export const getSchemaEntryByPath = (data: any, path: string[], ctx: CpuEditorContext, curEntry = '#') => {
  let schemaEntry: string | undefined = curEntry
  let nowData = data
  while (path.length > 0) {
    const key = path.shift()!
    const { valueEntry } = getValueEntry(data, schemaEntry, ctx)
    if (valueEntry === undefined) return undefined
    const mergedValueSchema = ctx.getMergedSchema(valueEntry)
    console.assert(typeof nowData === 'object')
    nowData = nowData[key]
    // 如果 getFieldEntry 得到 false，那就是一个指向 false 的 ref，直接当作 undefined
    schemaEntry = getFieldSchema(nowData, valueEntry, mergedValueSchema, key) || undefined
    if (schemaEntry === undefined) return undefined
  }
  return schemaEntry
}
