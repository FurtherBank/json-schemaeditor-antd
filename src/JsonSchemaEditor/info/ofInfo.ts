import _ from 'lodash'
import { toOfName } from '../definition'
import { addRef, deepReplace } from '../utils'
import SchemaInfoContent from '.'
import { shallowValidate } from '../definition/shallowValidate'
import { JSONSchema } from '../type/Schema'

export interface ofSchemaCache {
  ofRef: string
  ofLength: number
  subOfRefs: (undefined | string)[]
  options: any[]
}

/**
 * 验证数据符合 oneOf/anyOf 的哪一个选项
 * @param data
 * @param schemaEntry
 * @param ctx
 * @returns `null`为无 oneOf/anyOf，`false`为不符合任何选项，`string`为选项链
 */
export const getOfOption = (data: any, schemaEntry: string, ctx: SchemaInfoContent): string | null | false => {
  const ofCacheValue = schemaEntry ? ctx.getOfInfo(schemaEntry) : null
  if (ofCacheValue) {
    const { subOfRefs, ofLength, ofRef } = ofCacheValue
    for (let i = 0; i < ofLength; i++) {
      const subOfRef = subOfRefs[i]
      if (typeof subOfRef === 'string') {
        // 展开的 validate 为 string，就是子 oneOf 的 ref
        const subOption = getOfOption(data, subOfRef, ctx)
        console.assert(subOption !== null)
        if (subOption) return `${i}-${subOption}`
      } else {
        const valid = shallowValidate(data, addRef(ofRef, i.toString())!, ctx)
        if (valid) return i.toString()
      }
    }
    return false
  }
  return null
}

/**
 * 通过 of 链找到 schema 经层层选择之后引用的 valueEntry
 * @param ctx
 * @param schemaEntry
 * @param ofChain
 */
export const getRefByOfChain = (ctx: SchemaInfoContent, schemaEntry: string, ofChain: string) => {
  const ofSelection = ofChain.split('-')
  let entry = schemaEntry
  for (const opt of ofSelection) {
    const { ofRef } = ctx.getOfInfo(entry)!
    entry = addRef(ofRef, opt)!
  }
  return entry
}

/**
 * 对 `schemaEntry` 设置 ofInfo
 * @param infoContent
 * @param schemaEntry
 * @param rootSchema
 * @param nowOfRefs
 * @returns
 */
export const setOfInfo = (
  infoContent: SchemaInfoContent,
  schemaEntry: string,
  rootSchema: JSONSchema,
  nowOfRefs: string[] = []
) => {
  const mergedSchema = infoContent.getMergedSchema(schemaEntry)
  if (!mergedSchema) return null
  // todo: noAnyOfChoice 的情况下
  const arrayRefInfo = mergedSchema.oneOf || mergedSchema.anyOf
  if (!arrayRefInfo) return null
  const { ref: ofRef, length: ofLength } = arrayRefInfo
  // 设置 ofCache (use Entry map ,root)
  if (ofRef && nowOfRefs.includes(ofRef)) {
    console.error('你进行了oneOf/anyOf的循环引用，这会造成无限递归，危', nowOfRefs, ofRef)
    infoContent.ofInfoMap.set(schemaEntry, null)
    return null
  } else if (ofRef) {
    nowOfRefs.push(ofRef)

    // 接下来得到每个选项的 ref 和树选择需要的选项 options
    const subOfRefs = [] as (undefined | string)[]
    const oneOfOptions = []
    for (let i = 0; i < ofLength; i++) {
      const ref = addRef(ofRef, i.toString())!
      const optMergedSchema = infoContent.getMergedSchema(ref)
      const name = optMergedSchema ? toOfName(optMergedSchema) : ''
      const optOption = {
        value: i.toString(),
        title: name ? name : `Option ${i + 1}`
      } as any
      const optCache = infoContent.ofInfoMap.has(ref)
        ? infoContent.ofInfoMap.get(ref)
        : setOfInfo(infoContent, ref, rootSchema, nowOfRefs)
      if (optCache) {
        const { options } = optCache
        optOption.children = options.map((option) => {
          return deepReplace(_.cloneDeep(option), 'value', (prev) => {
            return `${i}-${prev}`
          })
        })
        optOption.disabled = true
        // 选项有子选项，将子选项ref给他
        subOfRefs.push(ref)
      } else {
        subOfRefs.push(undefined)
      }
      oneOfOptions.push(optOption)
    }

    const ofInfo = {
      subOfRefs,
      ofRef: ofRef,
      ofLength,
      options: oneOfOptions
    }
    infoContent.ofInfoMap.set(schemaEntry, ofInfo)
    return ofInfo
  } else {
    infoContent.ofInfoMap.set(schemaEntry, null)
    return null
  }
}
