import _ from 'lodash'
import { MergedSchema } from '../context/mergeSchema'
import { JSONSchema } from '../type/Schema'

export const KeywordTypes = {
  intersection: ['type'],
  merge: ['properties', 'patternProperties']
} as any

export const getKeywordType = (keyword: string) => {
  for (const type in KeywordTypes) {
    if (KeywordTypes[type].includes(keyword)) return type
  }
  return 'first'
}

export const concatAccess = (route: string[], ...args: (string | null | undefined)[]) => {
  const filtered = args.filter((value) => typeof value === 'string' && value) as string[]
  return route.concat(filtered)
}

export const jsonDataType = (data: any) => {
  return data === null ? 'null' : data instanceof Array ? 'array' : typeof data
}

/**
 * 简单的迭代器转数组
 * @param it 迭代器
 * @returns
 */
export const iterToArray = <T>(it: Iterable<T>): T[] => {
  const r = []
  for (const ele of it) {
    r.push(ele)
  }
  return r
}

/**
 * 将 uri 字符串解析为数组
 * @param uri
 * @returns
 */
export const extractURI = (uri: string) => {
  if (typeof uri !== 'string') {
    // debugger
  }
  if (uri.startsWith('#')) {
    // Decode URI fragment representation.
    uri = decodeURIComponent(uri.substring(1))
    return uri.split('/').filter((v) => v)
  } else {
    throw new Error(`Could not find a definition for ${uri}.`)
  }
}

/**
 * 通过 uri 查找 obj 对象对应路径下的值。
 * 如果找不到会返回 undefined
 * @param obj 对象
 * @param $ref
 * @returns
 */
export const getPathVal = (obj: any, $ref: string) => {
  const pathArr = extractURI($ref)
  for (let i = 0; i < pathArr.length; i += 1) {
    if (obj === undefined) return undefined
    obj = pathArr[i] === '' ? obj : obj[pathArr[i]]
  }
  return obj
}

/**
 * 给 uri 路径继续添加子路径。
 * 不提供子路径也可以当作去末尾 / 的格式化工具
 * @param ref uri 路径
 * @param path 需要添加的子路径
 * @returns
 */
export const addRef = (ref: string | undefined, ...path: string[]) => {
  if (ref === undefined) return undefined
  if (ref[ref.length - 1] === '/') ref = ref.substring(0, ref.length - 1)

  path.forEach((v) => {
    if (v) ref = ref + '/' + v
  })
  return ref
}

/**
 * 通过 data access 得到 data 的 ref 字符串，用作 id
 * todo: 只要有需要对这个输出字符串分割的可能，必须要转义
 * @param access
 * @returns
 */
export const getAccessRef = (access: string[]) => {
  return access.join('.')
}

/**
 * 通过数组 path 得到对象树中对象的位置。
 * @param data
 * @param path
 * @returns
 */
export const pathGet = (data: any, path: string[]) => {
  let nowData = data
  for (const field of path) {
    if (typeof nowData !== 'object') return undefined
    nowData = nowData[field]
  }
  return nowData
}

/**
 * 设置对象树某一位置的值。
 * 如果途中遇到了已定义的非对象，会取消操作
 * @param obj
 * @param ref
 * @param value
 * @returns
 */
export const pathSet = (obj: any, ref: string, value: any) => {
  const path = extractURI(ref)
  const oriObj = obj
  path.every((v, i) => {
    if (i === path.length - 1) {
      obj[v] = value
    } else if (obj[v] === undefined || obj[v] === null) {
      obj[v] = {}
      obj = obj[v]
    } else if (typeof obj[v] === 'object' && !(obj[v] instanceof Array)) {
      obj = obj[v]
    } else {
      return false
    }
    return true
  })
  return oriObj
}

/**
 * 深度递归收集一个对象某个键的所有属性
 * @param obj
 * @param key
 * @returns
 */
export const deepCollect = (obj: any, key: string): any[] => {
  let collection: any[] = []
  // js 原型链安全问题
  for (const k in obj) {
    if (k === key) {
      collection.push(obj[k])
    } else {
      if (obj[k] && typeof obj[k] === 'object') {
        collection = collection.concat(deepCollect(obj[k], key))
      }
    }
  }
  return collection
}

/**
 * 深度递归替换一个对象某个键的所有属性。
 * 注意如果需要深拷贝请提前做。
 * @param obj
 * @param key
 * @param map 替换函数
 * @returns
 */
export const deepReplace = (obj: any, key: string, map: (value: any, key: any) => any) => {
  // js 原型链安全问题
  for (const k in obj) {
    if (k === key) {
      obj[k] = map(obj[k], k)
      // console.log('替换',obj[k]);
    } else {
      if (obj[k] && typeof obj[k] === 'object') obj[k] = deepReplace(obj[k], key, map)
    }
  }
  return obj
}

/**
 * 找到 $ref 引用的 schemaMap。如果找不到返回一个空 Map
 * @param $ref
 * @param rootSchema
 * @param deepSearch 深入搜索：深递归加入所有schema引用，否则只递归到浅一层
 * @returns
 */
export const getRefSchemaMap = (
  $ref: string | undefined | string[],
  rootSchema = {},
  deepSearch = false
): Map<string, JSONSchema | boolean> => {
  const schemaMap = new Map()
  const refQueue = $ref instanceof Array ? _.clone($ref) : $ref ? [$ref] : []
  while (refQueue.length > 0) {
    const nowRef = addRef(refQueue.shift()!)!
    const current = getPathVal(rootSchema, nowRef)
    if (current !== undefined) {
      schemaMap.set(nowRef, current)
      if (deepSearch) {
        const refs = deepCollect(current, '$ref')
        if (refs instanceof Array) {
          for (const ref of refs) {
            if (typeof ref === 'string' && !schemaMap.has(addRef(ref))) refQueue.push(ref)
          }
        }
      } else {
        if (current.hasOwnProperty('$ref') && !schemaMap.has(addRef(current.$ref))) {
          refQueue.push(current.$ref)
        }
      }
    }
  }
  return schemaMap
}

/**
 * 找到 schemaMap 中所有含有某键的 uri 引用
 * @param schemaMap
 * @param k
 * @param all 是否拿到所有 ref ，默认只拿第一个
 * @param add 返回的ref是否加入属性名称，默认加入
 * @returns
 */
export const findKeyRefs = (schemaMap: Map<string, any>, k: string, all = false, add = true) => {
  const allRefs = []
  for (const [ref, schema] of schemaMap) {
    if (schema instanceof Object && schema[k] !== undefined) {
      if (all) {
        allRefs.push(add ? addRef(ref, k)! : ref)
      } else {
        return add ? addRef(ref, k)! : ref
      }
    }
  }
  return all ? allRefs : undefined
}

/**
 * 确定数组中第一个value的位置，但是深拷贝判断
 * @param array
 * @param value
 * @returns
 */
export const exactIndexOf = (array: any[], value: any) => {
  for (let i = 0; i < array.length; i++) {
    const element = array[i]
    if (_.isEqual(element, value)) return i
  }
  return -1
}

/**
 * 将对象或map的keys当作正则表达式来匹配 key，如果匹配到返回这个正则表达式
 * @param map
 * @param key
 * @returns
 */
export const getKeyByPattern = (map: Map<string | RegExp, any> | { [x: string]: any }, key: string) => {
  const keys = map instanceof Map ? map.keys() : Object.keys(map)

  for (const k of keys) {
    const pattern = typeof k === 'string' ? new RegExp(k) : k
    if (pattern.test(key)) {
      return pattern
    }
  }
  return undefined
}

/**
 * 查找对象某键的值，但是正则匹配
 * @param obj 查找的对象，对象的键作为正则式与 key 匹配
 * @param key 待匹配的字符串
 * @returns
 */
export const getValueByPattern = <T>(obj: { [k: string]: T }, key: string): T | undefined => {
  for (const k of Object.keys(obj)) {
    const pattern = new RegExp(k)
    if (pattern.test(key)) {
      return obj[k]
    }
  }
  return undefined
}

/**
 * 对 Array/Object 获取特定字段 schemaEntry。
 * 注意：
 * 1. 无论这其中有多少条 ref，一定保证给出的 schemaEntry 是从 `properties, patternProperties, additionalProperties, prefixItems, items` 这五个字段之一进入的。
 * 2. 只要给出的 ref 不是 undefined，一定能够找到对应的 schema
 * @param data 当前的 data
 * @param valueEntry
 * @param mergedValueSchema
 * @param field
 * @returns 对应子字段的 schemaEntry，结果为 false 代表对应 schema 为 false，在模式支持上当作 undefined 处理即可
 */
export const getFieldSchema = (
  data: any,
  valueEntry: string | undefined,
  mergedValueSchema: MergedSchema | false,
  field: string
): string | false | undefined => {
  if (!mergedValueSchema) return undefined

  const { properties, patternProperties, additionalProperties, items, prefixItems } = mergedValueSchema
  const dataType = jsonDataType(data)
  switch (dataType) {
    case 'object':
      if (properties && properties[field]) return properties[field]

      if (patternProperties) {
        const ref = getValueByPattern(patternProperties, field)
        if (ref) return ref
      }

      if (additionalProperties !== undefined) return additionalProperties
      // 如果上面这些属性都没有但是 type = object，会使得这里到了下面的 case 而出错
      return undefined
    case 'array':
      /**
       * 注意：draft 2020-12 调整了items，删除了additionalItems属性。
       * 个人认为这么做是正确的，但是旧的没改，还需要兼容
       * 详情见：https://json-schema.org/draft/2020-12/release-notes.html
       */
      const index = parseInt(field, 10)
      if (isNaN(index) || index < 0) {
        throw new Error(
          `获取字段模式错误：在数组中获取非法索引 ${field}\n辅助信息：${valueEntry} \n ${JSON.stringify(
            mergedValueSchema,
            null,
            2
          )}`
        )
      }
      if (prefixItems) {
        const { length, ref } = prefixItems
        if (index < length) {
          return addRef(ref, field)
        } else {
          return items
        }
      } else if (items) {
        return items
      } else {
        return undefined
      }
    default:
      throw new Error(
        `获取字段模式错误：在非对象中获取字段模式 ${field}\n辅助信息：${valueEntry} \n ${JSON.stringify(
          mergedValueSchema,
          null,
          2
        )}`
      )
  }
}
