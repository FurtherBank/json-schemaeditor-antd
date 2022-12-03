import { JSONSchema6 } from 'json-schema'

/**
 * 编辑器适用的 json-schema type definition
 * - 修好了`type`为字符串枚举，而json的`type`类型都是`string`所以不可赋值的bug
 * - 该定义不包括`boolean`，如果需要就`|`一下
 */
export type JSONSchema = Omit<JSONSchema6, 'type'> & {
  type?: string | string[] | undefined
  view?: {
    param?: any
    type: string
  }
}
