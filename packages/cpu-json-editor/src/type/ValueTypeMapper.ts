export interface ValueTypeMapper {
  [k: string]: any
  string: string
  boolean: boolean
  number: number
  array: any[]
  null: null
}
