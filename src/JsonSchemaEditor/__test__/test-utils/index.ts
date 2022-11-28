import { metaSchema } from '../../..'
import CpuEditorContext from '../../context'
import examples from '../../demos/examples'
import { createStore } from 'redux'

export const getAllObjectRefs = (data: any, ref = ''): string[] => {
  const result = []
  if (data && typeof data === 'object') {
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = data[key]
        const currentRef = ref ? ref + '.' + key.toString() : key.toString()
        result.push(currentRef)
        result.push(...getAllObjectRefs(value, currentRef))
      }
    }
  }
  return result
}

/**
 * 得到 data 所有的 keyref，并根据 keyref 获得所有同名 id 的元素
 * @param data
 * @returns
 */
export const getKeysAndIds = (data: any) => {
  const allRefs = getAllObjectRefs(data)
  const allElements: (Element | null)[] = []
  allRefs.forEach((ref) => {
    allElements.push(document.getElementById(ref))
  })
  return [allRefs, allElements] as [string[], (Element | null)[]]
}

/**
 * 通过 data 所有的 keyref 数量和 id 数量比较，得出几个 key 被隐藏了。
 * @param data
 * @returns
 */
export const countNullId = (data: any) => {
  const [, allElements] = getKeysAndIds(data)
  return allElements.filter((element) => !element).length
}

export const getExample = (name: string) => {
  const exampleJson = examples(metaSchema)
  return exampleJson[name] || [0, {}]
}

export const mockCtx = (schema: any) => {
  return new CpuEditorContext(
    schema,
    '',
    createStore(() => ({}), {})
  )
}
