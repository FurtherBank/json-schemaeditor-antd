import { MergedSchemaWithoutVirtual } from './mergeSchema'
import { getFormatType } from '../definition/formats'
import CpuEditorContext from '.'

// symbols
export const isShort = Symbol.for('short')

// all virtual props
export type virtualSchemaProps = {
  [isShort]: boolean
}

/**
 * 确定schema是否可以短优化。条件：
 * 1. 类型确定且为string/number/bool/null，且没有oneof
 * 2. 有enum
 * 注：由于目前该函数主要从 valueInfo 确定子属性时调用，所以不必缓存。
 * @param mergedSchema
 */
export const schemaIsShort = (ctx: CpuEditorContext, mergedSchema: MergedSchemaWithoutVirtual) => {
  const { const: constValue, enum: enumValue, type: allowedTypes, format, view: { type: viewType } = {} } = mergedSchema
  if (constValue !== undefined || enumValue) return true

  if (allowedTypes && allowedTypes.length === 1) {
    if (viewType) {
      const { shortable = false } = ctx.viewsMap[viewType] || {}
      return shortable
    }
    const type = allowedTypes[0]
    switch (type) {
      case 'string':
        if (format && getFormatType(format)) return false
        return true
      case 'number':
      case 'integer':
      case 'boolean':
      case 'null':
        return true
      default:
        return false
    }
  }
  return false
}
