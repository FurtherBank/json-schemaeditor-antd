/* eslint-disable no-debugger */
import { JSONSchema6 } from 'json-schema'
import _, { isEqual } from 'lodash'
import { SchemaCache } from '..'
import { FieldProps } from '../Field'

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

export const concatAccess = (route: string[], ...args: (string | null)[]) => {
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
    debugger
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
 * 设置对象树某一位置的值。
 * 如果途中遇到了已定义的非对象，会取消操作
 * @param obj
 * @param ref
 * @param value
 * @returns
 */
export const deepSet = (obj: any, ref: string, value: any) => {
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
): Map<string, JSONSchema6 | boolean> => {
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
export const matchRegexKey = (map: Map<string | RegExp, any> | { [x: string]: any }, key: string) => {
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
export const getValueByPattern = (obj: any, key: string) => {
  for (const k of Object.keys(obj)) {
    const pattern = new RegExp(k)
    if (pattern.test(key)) {
      return obj[k]
    }
  }
  return undefined
}

/**
 * 筛选迭代器
 * @param it 迭代器
 * @param c 条件函数
 * @returns
 */
export const filterIter = <T>(it: Iterable<T>, c: (value: T, i: number) => boolean) => {
  const result = []
  let i = 0
  for (const obj of it) {
    if (c(obj, i)) result.push(obj)
    i++
  }
  return result
}

/**
 * 对 Array/Object 获取特定字段 schemaEntry。
 * 注意：
 * 1. 无论这其中有多少条 ref，一定保证给出的 schemaEntry 是从 `properties, patternProperties, additionalProperties, items, additionalItems` 这五个字段之一进入的。
 * 2. 只要给出的 ref 不是 undefined，一定能够找到对应的 schema
 * @param props
 * @param schemaCache
 * @param field
 * @returns
 */
export const getFieldSchema = (props: FieldProps, schemaCache: SchemaCache, field: string) => {
  const { data } = props
  const { valueSchemaMap, rootSchema } = schemaCache
  const dataType = jsonDataType(data)
  switch (dataType) {
    case 'object':
      const propertyRefs = findKeyRefs(valueSchemaMap!, 'properties', true) as string[]
      for (const ref of propertyRefs) {
        const propertySchema = getPathVal(rootSchema, ref) as object
        // debugger
        if (propertySchema.hasOwnProperty(field)) return addRef(ref, field)
      }

      const patternPropertyRefs = findKeyRefs(valueSchemaMap!, 'patternProperties', true) as string[]
      for (const ref of patternPropertyRefs) {
        const patternSchema = getPathVal(rootSchema, ref) as object
        const patternKeys = Object.keys(patternSchema)
        for (const key of patternKeys) {
          const regex = new RegExp(key)
          if (regex.test(field)) {
            return addRef(ref, key)
          }
        }
      }

      return findKeyRefs(valueSchemaMap!, 'additionalProperties', false) as string | undefined
    case 'array':
      /**
       * 注意：draft 2020-12 调整了items，删除了additionalItems属性。
       * 个人认为这么做是正确的，但是旧的没改，还需要兼容
       * 详情见：https://json-schema.org/draft/2020-12/release-notes.html
       */
      const itemsRef = findKeyRefs(valueSchemaMap!, 'items', false) as string | undefined
      const index = parseInt(field, 10)
      if (isNaN(index) && index < 0) {
        throw new Error(`获取字段模式错误：在数组中获取非法索引 ${field}\n辅助信息：${valueSchemaMap}`)
      }
      if (itemsRef) {
        const itemsSchema = getPathVal(rootSchema, itemsRef) as object | object[]
        if (itemsSchema instanceof Array) {
          const itemLength = itemsSchema.length
          if (index < itemLength) {
            return addRef(itemsRef, field)
          } else {
            return findKeyRefs(valueSchemaMap!, 'additionalItems', false) as string | undefined
          }
        } else {
          return itemsRef
        }
      } else {
        return undefined
      }
    default:
      throw new Error(`获取字段模式错误：在非对象中获取字段模式 ${field}\n辅助信息：${valueSchemaMap}`)
  }
}

/**
 * 过滤掉 boolean 模式
 * @param it
 * @returns
 */
export const filterObjSchema = (it: Iterable<JSONSchema6 | boolean>) => {
  return filterIter(it, (schema) => {
    return schema instanceof Object
  }) as JSONSchema6[]
}

/**
 * 吸收 schemaMap 的属性字段值。
 * 不同字段的返回方式不同，`first`为返回第一个，若没有返回`undefined`，`intersection`为数组属性返回交集
 * @param filtered 过滤后的schema列表，或者schemaMap
 * @param key 查找的key
 * @returns
 */
export const absorbProperties = (filtered: any[] | Map<string, JSONSchema6 | boolean>, key: string) => {
  if (filtered instanceof Map) {
    filtered = filterObjSchema(filtered.values())
  }
  const method = getKeywordType(key)
  switch (method) {
    case 'first': // 取 第一个出现
      for (const schema of filtered) {
        if (schema.hasOwnProperty(key)) return schema[key]
      }
      return undefined
    case 'intersection': // 取 数组属性交集
      const values = filtered
        .map((schema) => {
          if (schema.hasOwnProperty(key)) {
            return schema[key] instanceof Array ? schema[key] : [schema[key]]
          } else {
            return null
          }
        })
        .filter((value) => value !== null)
      return _.intersection(...values)
    case 'merge': // 取 对象属性merge
      let result = {}
      filtered.reverse()
      for (const schema of filtered) {
        if (schema.hasOwnProperty(key) && jsonDataType(schema[key]) === 'object') {
          result = Object.assign(result, schema[key])
        }
      }
      return result
    default:
      return false
  }
}

/**
 * 使用替代法合并schemaMap
 * @param schemaMap
 * @returns
 */
export const absorbSchema = (schemaMap: Map<string, JSONSchema6 | boolean>): JSONSchema6 | false => {
  const arrayMap = Array.from(schemaMap.values()).reverse()
  let resultSchema = {}
  for (const schema of arrayMap) {
    if (schema === false || resultSchema === false) {
      return false
    } else if (schema === true) {
      continue
    } else {
      resultSchema = Object.assign(resultSchema, schema)
    }
  }
  return resultSchema
}

/**
 * 判断模式是否起到筛选作用。空对象和true没有
 * @param schemas
 * @returns
 */
export const schemaUseful = (...schemas: (JSONSchema6 | boolean)[]) => {
  if (schemas.indexOf(false) > -1) return true
  return Object.keys(Object.assign({}, ...schemas)).length !== 0
}

/**
 * 将深入展开的 subschema 从 rootSchema 中提取出来
 * @param schemaMap
 * @param rootSchema
 * @returns
 */
// export const extractSchema = (
//   schemaMap: Map<string, JSONSchema6 | boolean>,
//   rootSchema: JSONSchema6 | boolean,
// ): JSONSchema6 => {
//   // 1. 建立 $ref 映射
//   const pathMap = new Map();
//   let i = 0;
//   for (const schema of schemaMap.keys()) {
//     const toName = '#/definitions/subSchema' + i;
//     pathMap.set(schema, toName);
//     i++;
//   }
//   const newSchema = {
//     definitions: {},
//   };

//   // 2. 暴力修改 $ref
//   for (const [key, schema] of schemaMap) {
//     const newRef = pathMap.get(key);
//     const replacedSchema = deepReplace(_.cloneDeep(schema), '$ref', (ref) => {
//       return typeof ref === 'string' ? pathMap.get(ref) : ref;
//     });
//     deepSet(newSchema, newRef, replacedSchema);
//   }
//   return newSchema;
// };

/**
 * 得到该字段犯下的错误
 * @param errors 所有的error
 * @param access 字段的access
 * @returns
 */
export const getError = (errors: any[], access: string[]): any | undefined => {
  const foundErrors = errors.filter((error) => {
    const instancePath = error.instancePath.split('/')
    instancePath.shift()
    return isEqual(instancePath, access)
  })
  return foundErrors
}
