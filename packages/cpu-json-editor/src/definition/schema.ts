import { FatherInfo } from '../components/type/list'
import { IField, FieldProps } from '../Field'
import { jsonDataType, getKeyByPattern } from '../utils'

/**
 * 通过 schema 判断当前 json 是否可以创建新的属性。
 * @param props
 * @param fieldInfo
 */
export const canFieldCreate = (data: any, fieldInfo: IField) => {
  const dataType = jsonDataType(data)
  const { mergedValueSchema } = fieldInfo

  if (!mergedValueSchema) return dataType === 'array' || dataType === 'object'
  const { maxProperties, properties, additionalProperties, patternProperties, maxItems, items, prefixItems } =
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
      const prefixLength = prefixItems && items === false ? prefixItems.length : +Infinity
      const maxLength = maxItems === undefined ? +Infinity : maxItems
      return (maxLength < prefixLength ? data.length < maxLength : data.length < prefixLength) ? [] : false
    default:
      return false
  }
}

/**
 * 通过 schema 判断该字段(来自一个对象)是否可以重新命名
 * @param props
 * @returns 返回字符串为不可命名(同时其也是字段名称)，返回正则为命名范围，返回空串即可命名
 */
export const canFieldRename = (props: FieldProps, fieldInfo: IField) => {
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
 * 通过 schema 判断该字段是否可删除。可删除条件：
 * 1. `field === undefined` 意味着根字段，不可删除
 * 2. 如果父亲是数组，只要不在数组 prefixItems 里面即可删除
 * 3. 如果父亲是对象，只要不在 required 里面即可删除
 *
 * @param props
 * @param fieldInfo
 */
export const canFieldDelete = (props: FieldProps, fieldInfo: IField) => {
  const { fatherInfo, field } = props
  const { ctx } = fieldInfo

  if (field === undefined) return false
  if (fatherInfo) {
    const { valueEntry: fatherValueEntry } = fatherInfo
    switch (fatherInfo.type) {
      case 'array':
        const { prefixItems } = ctx.getMergedSchema(fatherValueEntry) || {}
        const index = parseInt(field)
        return prefixItems ? index >= prefixItems.length : true
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
