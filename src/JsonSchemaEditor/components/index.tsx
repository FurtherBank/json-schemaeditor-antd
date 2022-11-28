import FieldDrawer from './drawer/FieldDrawer'
import { ListEdition } from './edition/ListEdition'
import { IComponentMap } from '../type/Components'
import { BooleanEdition } from './edition/BooleanEdition'
import { ConstEdition } from './edition/ConstEdition'
import { EnumEdition } from './edition/EnumEdition'
import { NullEdition } from './edition/NullEdition'
import { NumberEdition } from './edition/NumberEdition'
import { StringEdition } from './edition/StringEdition'
import { MultilineEdition } from './format/multiline'
import { RowEdition } from './format/row'
import { FieldTitle } from './title'
import { ItemList } from './views/list/ItemList'
import { OperationButton } from './operation/OperationButton'
import { OneOfOperation } from './operation/OneOf'
import { TypeOperation } from './operation/Type'

export const antdComponentMap: IComponentMap = {
  container: 1,
  title: FieldTitle,
  menuAction: OperationButton,
  operation: {
    oneOf: OneOfOperation,
    type: TypeOperation
  },
  format: {
    multiline: MultilineEdition,
    row: RowEdition,
    uri: RowEdition,
    'uri-reference': RowEdition
  },
  edition: {
    object: ListEdition,
    array: ListEdition,
    string: StringEdition,
    number: NumberEdition,
    boolean: BooleanEdition,
    null: NullEdition,
    enum: EnumEdition,
    const: ConstEdition
  },
  drawer: FieldDrawer
}

export const antdViewsMap = {
  list: {
    edition: {
      array: ItemList
    },
    shortable: false,
    dataSchema: {
      type: 'array'
    }
  }
}
