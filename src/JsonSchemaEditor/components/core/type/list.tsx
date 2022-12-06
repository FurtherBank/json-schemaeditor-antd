import { ShortLevel } from '../../../definition'

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
  end?: boolean
  data?: ChildData[]
}

export interface FieldDisplayList {
  short: ShortLevel
  items: ChildData[]
}

export interface ListDisplayPanelProps {
  lists: FieldDisplayList[]
  canCreate: boolean
}
