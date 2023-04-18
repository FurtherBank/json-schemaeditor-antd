const longFormats = ['row', 'uri', 'uri-reference']
const extraLongFormats = ['multiline']

/**
 * 格式按照组件需要空间的情况分为三种类型：
 * - `short`：字段短优化后的空间即可正常显示
 * - `long`：需要一行的空间才能正常显示，不支持短优化
 * - `extralong`：需要多行的空间才能正常显示，不支持短优化
 * @param format
 * @returns
 */
export const getFormatType = (format: string | undefined) => {
  if (extraLongFormats.includes(format!)) return 2
  if (longFormats.includes(format!)) return 1
  return 0
}
