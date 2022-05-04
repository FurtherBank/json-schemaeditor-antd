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

export const countNullId = (data: any) => {
  const [, allElements] = getKeysAndIds(data)
  return allElements.filter((element) => !element).length
}
