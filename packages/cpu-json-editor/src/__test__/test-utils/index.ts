import CpuEditorContext from '../../context'
import examples from '../../demos/examples'
import { CpuInteraction } from '../../context/interaction'
import { IComponentMap, IViewsMap } from '../../components/ComponentMap'
import Ajv from 'ajv'
import defaultAjvInstance from '../../definition/ajvInstance'
import { MockComponentMap } from './componentMap'

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
  return examples.plainData[name] || [0, {}]
}

/**
 * 不需要组件的情况下构造 ctx，便于测试
 *
 * 该函数会随着 ctx 的构造函数参数改动而改动
 * @param data
 * @param schema
 * @param ajvInstance
 * @param id
 * @param componentMap
 * @param viewsMap
 * @returns
 */
export const mockCtx = (
  data: any,
  schema: any,
  ajvInstance?: Ajv,
  id?: string,
  componentMap?: IComponentMap,
  viewsMap?: Record<string, IViewsMap>
) => {
  const interaction = new CpuInteraction(() => {})
  return new CpuEditorContext(
    data,
    schema,
    ajvInstance ?? defaultAjvInstance,
    id,
    interaction,
    componentMap ?? MockComponentMap,
    viewsMap ?? {}
  )
}
