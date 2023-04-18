import { ErrorObject } from 'ajv'
import { uri2strArray } from '../../utils/path/uri'

/**
 * 将数组形式的 errors 转为 key => value 形式的 errors；
 *
 * 可以加快组件的查找效率。
 * @param prevErrors
 * @param newErrors
 * @param dataPath
 * @param schemaEntry
 */
export const processValidateErrors = (
  prevErrors: Record<string, ErrorObject<string, Record<string, any>, unknown>[]>,
  newErrors: ErrorObject<string, Record<string, any>, unknown>[] = [],
  dataPath: string[] = [],
  schemaEntry: string | undefined = undefined
) => {
  const prefixInstancePath = '/' + dataPath.join('/')
  // 将旧的，部分验证字段下的节点删除
  // todo: 查找过程 O(n)，还有优化空间(想不出好办法，但是数据结构维护会变复杂)
  Object.keys(prevErrors).forEach((key) => {
    if (key.startsWith(prefixInstancePath)) {
      delete prevErrors[key]
    }
  })
  // 将新的 errors 进行修正，然后写到树上
  // todo: 转义
  newErrors.forEach((error) => {
    // instancePath
    if (dataPath.length > 0) {
      error.instancePath = prefixInstancePath + error.instancePath
    }
    // schemaPath
    if (schemaEntry) {
      const schemaPrefixPath = uri2strArray(schemaEntry)
      const errorSchemaPath = uri2strArray(error.schemaPath)
      error.schemaPath = '#/' + schemaPrefixPath.join('/') + '/' + errorSchemaPath.join('/')
    }
    // 赋值到错误数组上
    if (prevErrors[error.instancePath] instanceof Array) {
      prevErrors[error.instancePath].push(error)
    } else {
      prevErrors[error.instancePath] = [error]
    }
  })
  return prevErrors
}
