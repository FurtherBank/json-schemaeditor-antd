import { IField } from '../Field'
import SchemaInfoContent from '../info'

export interface IFieldEditProps<T = any> {
  data: T
  ctx: SchemaInfoContent
  fieldInfo: IField
  onValueChange: (value: any) => void
}
