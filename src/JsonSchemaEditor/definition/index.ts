/* eslint-disable no-param-reassign */
import produce from 'immer'
import _ from 'lodash'
import { IField, FieldProps } from '../Field'
import { FatherInfo } from '../FieldList'
import SchemaInfoContent from '../info'
import { MergedSchema } from '../info/mergeSchema'
import { getOfOption, getRefByOfChain } from '../info/ofInfo'
import { addRef, getValueByPattern, jsonDataType, getKeyByPattern, getFieldSchema } from '../utils'

export const maxCollapseLayer = 3
export const maxItemsPerPageByShortLevel = [16, 32, 48]

export const gridOption = [
  { gutter: 2, column: 1 },
  { gutter: 2, column: 2, lg: 2, xl: 2, xxl: 2 },
  { gutter: 2, column: 4, lg: 4, xl: 4, xxl: 4 }
]

// formats
const longFormats = ['row', 'uri', 'uri-reference']
const extraLongFormats = ['multiline']
export const getFormatType = (format: string | undefined) => {
  if (extraLongFormats.includes(format!)) return 2
  if (longFormats.includes(format!)) return 1
  return 0
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
 * 当前json在既定的schema下是否可以创建新的属性。
 * @param props
 * @param fieldInfo
 */
export const canSchemaCreate = (props: FieldProps, fieldInfo: IField) => {
  const { data } = props
  const dataType = jsonDataType(data)
  const { mergedValueSchema } = fieldInfo
  if (!mergedValueSchema) return dataType === 'array' || dataType === 'object'
  const { maxProperties, properties, additionalProperties, patternProperties, maxItems, items, additionalItems } =
    mergedValueSchema
  let autoCompleteKeys: string[] = []
  switch (dataType) {
    case 'object':
      /**
       * object可以创建新属性，需要关注的条件：
       * 1. patternProperties 不为空，我们默认 patternProperties 只要有可用的正则就肯定能再创建。
       * 2. additionalProperties 不为 false
       * 3. 不超过 maxLength
       */
      const nowKeys = Object.keys(data)
      // 1. 长度验证
      if (maxProperties !== undefined && nowKeys.length >= maxProperties) return false
      // 收集 properties 中可以创建的+可自动补全的属性
      const restKeys = properties ? Object.keys(properties).filter((key) => !nowKeys.includes(key)) : []
      // todo: 依据 dependencies 筛选可创建属性
      if (properties) autoCompleteKeys = autoCompleteKeys.concat(restKeys)
      // 2. additionalProperties 验证
      if (additionalProperties !== false) return autoCompleteKeys
      // 3. patternProperties 有键
      if (patternProperties && Object.keys(patternProperties).length > 0) return autoCompleteKeys
      // 4. 有无剩余键
      return restKeys.length > 0 ? autoCompleteKeys : false
    case 'array':
      const itemsLength = items instanceof Array && additionalItems === false ? items.length : +Infinity
      const maxLength = maxItems === undefined ? +Infinity : maxItems
      return (maxLength < itemsLength ? data.length < maxLength : data.length < itemsLength) ? [] : false
    default:
      return false
  }
}

/**
 * 判断该字段(来自一个对象)是否可以重新命名
 * @param props
 * @returns 返回字符串为不可命名(同时其也是字段名称)，返回正则为命名范围，返回空串即可命名
 */
export const canSchemaRename = (props: FieldProps, fieldInfo: IField) => {
  const { field, fatherInfo } = props
  const { ctx, mergedEntrySchema } = fieldInfo
  // 注意，一个模式的 title 看 entryMap，如果有of等不理他
  const { title } = mergedEntrySchema || {}

  if (field === undefined) {
    return title ? title : ' '
  }
  // 不是根节点，不保证 FatherInfo 一定存在，因为可能有抽屉！
  const { valueEntry: fatherValueEntry, type: fatherType } = fatherInfo ?? {}
  const fatherMergedValueSchema = ctx.getMergedSchema(fatherValueEntry)
  if (fatherType === 'array') {
    return title ? title + ' ' + field : field
  } else if (!fatherMergedValueSchema) {
    return ''
  } else {
    const { properties, patternProperties } = fatherMergedValueSchema

    if (properties && properties[field]) return title ? title : field

    const pattern = patternProperties ? getKeyByPattern(patternProperties, field) : undefined

    if (pattern) return pattern

    return ''
  }
}

/**
 * 判断 该字段是否可删除。可删除条件：
 * 1. `field === undefined` 意味着根字段，不可删除
 * 2. 如果父亲是数组，只要不在数组 items 里面即可删除
 * 3. 如果父亲是对象，只要不在 required 里面即可删除
 *
 * @param props
 * @param fieldInfo
 */
export const canDelete = (props: FieldProps, fieldInfo: IField) => {
  const { fatherInfo, field } = props
  const { ctx } = fieldInfo

  if (field === undefined) return false
  if (fatherInfo) {
    const { valueEntry: fatherValueEntry } = fatherInfo
    switch (fatherInfo.type) {
      case 'array':
        const { items } = ctx.getMergedSchema(fatherValueEntry) || {}
        const index = parseInt(field)
        return typeof items === 'object' ? index >= items.length : true
      case 'object':
        const fatherMergedValueSchema = ctx.getMergedSchema(fatherValueEntry)
        if (fatherMergedValueSchema && fatherMergedValueSchema.required) {
          return !fatherMergedValueSchema.required.includes(field)
        } else {
          return true
        }
      default:
        console.error('意外的判断情况')
        return false
    }
  }
  return false
}

// defaultValue
export const defaultTypeValue: any = {
  string: '',
  number: 0,
  integer: 0,
  object: {},
  array: [],
  null: null,
  boolean: false
}

/**
 * 通过一个schemaEntry 得到schema，确定其创建时默认对象。
 * 允许找不到schema的场合，且前后变量保持最大兼容
 * @param ctx
 * @param entry 目标位置的 valueEntry，切换 of 选项的情况下不同于目前数据的 valueEntry，切换
 * @param nowData 目前的数据
 * @returns
 */
export const getDefaultValue = (ctx: SchemaInfoContent, entry: string | undefined, nowData: any = undefined): any => {
  const mergedSchema = ctx.getMergedSchema(entry)
  if (!entry || !mergedSchema) return null

  const {
    properties,
    patternProperties,
    required,
    default: defaultValue,
    const: constValue,
    enum: enumValue,
    type: allowedTypes,
    items,
    additionalItems
  } = mergedSchema
  const nowDataType = jsonDataType(nowData)
  // 0. 如果nowData是对象，且有属性列表，就先剪掉不在列表中的属性，然后进行合并
  if (nowDataType === 'object') {
    if (properties || patternProperties) {
      nowData = produce(nowData, (draft: any) => {
        for (const key of Object.keys(draft)) {
          if ((!properties || !properties[key]) && (!patternProperties || !getValueByPattern(patternProperties, key)))
            delete draft[key]
        }
      })
    }
  }
  // 1. 优先返回规定的 default 字段值(注意深拷贝，否则会形成对象环！)
  if (defaultValue !== undefined) {
    const defaultType = jsonDataType(defaultValue)
    if (defaultType === 'object' && nowDataType === 'object') {
      // 特殊：如果默认是 object，会采取最大合并
      return Object.assign({}, nowData, _.cloneDeep(defaultValue))
    }
    return _.cloneDeep(defaultValue)
  } else {
    // 2. 如果有 const/enum，采用其值
    if (constValue !== undefined) return _.cloneDeep(constValue)
    if (enumValue !== undefined) return _.cloneDeep(enumValue[0])
    // 3. oneOf/anyOf 选择第0项的schema返回
    const ofInfo = ctx.getOfInfo(entry)
    if (ofInfo) {
      return getDefaultValue(ctx, addRef(ofInfo.ofRef, '0')!)
    }
  }
  // 4. 按照 schema 寻找答案
  if (allowedTypes && allowedTypes.length > 0) {
    const type = allowedTypes[0]
    switch (type) {
      case 'object':
        const result = jsonDataType(nowData) === 'object' ? _.clone(nowData) : {}

        if (required) {
          // 仅对 required 中的属性进行创建
          for (const name of required) {
            if (properties && properties[name]) {
              result[name] = getDefaultValue(ctx, properties[name])
            } else {
              return result
            }
          }
        }

        return result
      case 'array':
        const arrayResult = jsonDataType(nowData) === 'array' && additionalItems ? _.clone(nowData) : []
        // 如果 items 是 arrayRefInfo，那么就是有前缀，覆写前缀
        if (typeof items === 'object') {
          const { ref, length } = items
          for (let i = 0; i < length; i++) {
            arrayResult[i] = getDefaultValue(ctx, addRef(ref, i.toString()))
          }
        }
        return arrayResult
      default:
        break
    }
    return _.cloneDeep(defaultTypeValue[type])
  } else {
    return null
  }
}

/**
 * 字段是否为 required 字段
 * @param field
 * @param fatherInfo
 * @returns
 */
export const isFieldRequired = (field: string | undefined, fatherInfo?: FatherInfo | undefined) => {
  if (!fatherInfo || !field) return false
  const { required } = fatherInfo
  return required instanceof Array && required.indexOf(field) > -1
}

/**
 * 得到当前 schemaEntry 下的 valueEntry 和 ofOption
 * @param data 当前数据
 * @param schemaEntry 当前数据的 schemaEntry
 * @param ctx 编辑器上下文对象
 * @returns
 */
export const getValueEntry = (data: any, schemaEntry: string | undefined, ctx: SchemaInfoContent) => {
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
export const getSchemaEntryByPath = (data: any, path: string[], ctx: SchemaInfoContent, curEntry = '#') => {
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
