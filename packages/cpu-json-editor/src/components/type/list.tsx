import { ShortLevel } from '../../definition'
import { IField } from '../../Field'

/**
 * 原则上来自于父字段的信息，不具有子字段特异性
 */
export interface FatherInfo {
  type: string // 是父亲的实际类型，非要求类型
  length?: number // 如果是数组，给出长度
  required?: string[] // 如果是对象，给出 required 属性
  schemaEntry: string | undefined // 父亲的 schemaEntry
  valueEntry: string | undefined // 父亲的 schemaEntry
}

export interface ChildData {
  key: string
  value: any
}

/**
 * 空的数组/对象子项数据，用作 create 组件
 */
export interface EmptyChildData {
  key: string
}

export interface FieldDisplayList {
  short: ShortLevel
  items: (ChildData | EmptyChildData)[]
}

export interface ListDisplayPanelProps {
  viewport: string
  lists: FieldDisplayList[]
  fatherInfo: FatherInfo
  fieldInfo: IField
  data: any
  access: string[]
}
