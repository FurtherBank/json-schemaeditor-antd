/**
 * 将 uri 字符串解析为数组
 * @param uri
 * @returns
 */
export const uri2strArray = (uri: string) => {
  // todo: 转义
  if (uri.startsWith('#')) {
    // Decode URI fragment representation.
    uri = decodeURIComponent(uri.substring(1))
    return uri.split('/').filter((v) => v)
  } else {
    throw new Error(`Could not find a definition for ${uri}.`)
  }
}

/**
 *
 * @param array
 * @returns
 */
export const strArray2uri = (array: string[]) => {
  // todo: 转义
  return '#/' + array.join('/')
}
