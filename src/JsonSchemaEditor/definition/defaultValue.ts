import produce from 'immer'
import _ from 'lodash'
import CpuEditorContext from '../context'
import { jsonDataType, getValueByPattern, addRef } from '../utils'

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
export const getDefaultValue = (ctx: CpuEditorContext, entry: string | undefined, nowData: any = undefined): any => {
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
    prefixItems,
    items
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
        const arrayResult = jsonDataType(nowData) === 'array' && items ? _.clone(nowData) : []
        // 如果 items 是 arrayRefInfo，那么就是有前缀，覆写前缀
        if (prefixItems) {
          const { ref, length } = prefixItems
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
