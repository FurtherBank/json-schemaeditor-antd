import { uri2strArray } from './path/uri'

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
export const deepGet = (data: any, path: string[]) => {
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
 * @param ref json-pointer string without #
 * @param value
 * @returns
 */
export const deepSet = (obj: any, ref: string, value: any) => {
  const path = uri2strArray(ref)
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
