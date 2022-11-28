import { ofSchemaCache } from '../context/ofInfo'

export interface DirectActionParams {
  create: true | string[]
  oneOf: ofSchemaCache
  type: string[]
}
