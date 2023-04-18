import { FieldDrawer } from './drawer/FieldDrawer'
import { IComponentMap } from '@cpu-studio/json-editor/ComponentMap'
import { BooleanEdition } from './edition/BooleanEdition'
import { ConstEdition } from './edition/ConstEdition'
import { EnumEdition } from './edition/EnumEdition'
import { NullEdition } from './edition/NullEdition'
import { NumberEdition } from './edition/NumberEdition'
import { StringEdition } from './edition/StringEdition'
import { MultilineEdition } from './format/multiline'
import { RowEdition } from './format/row'
import { FieldTitle } from './title'
import { OperationButton } from './operation/OperationButton'
import { OneOfOperation } from './operation/OneOf'
import { TypeOperation } from './operation/Type'
import { FieldContainerNormal } from './container/FieldContainerNormal'
import { FieldContainerShort } from './container/FieldContainerShort'
import { SchemaErrorLogger } from './SchemaErrorLogger'
import { ArrayListViewEdition } from './views/list'

import './css/index.less'
import { ObjectEdition } from './edition/ObjectEdition'
import { ArrayEdition } from './edition/ArrayEdition'
import { DateEdition } from './format/date'
import { DateTimeEdition } from './format/date-time'
import { TimeEdition } from './format/time'

export const antdComponentMap: IComponentMap = {
  containerNormal: FieldContainerNormal,
  containerShort: FieldContainerShort,
  title: FieldTitle,
  menuAction: OperationButton,
  operation: {
    oneOf: OneOfOperation,
    type: TypeOperation
  },
  format: {
    multiline: MultilineEdition,
    date: DateEdition,
    time: TimeEdition,
    'date-time': DateTimeEdition,
    row: RowEdition,
    uri: RowEdition,
    'uri-reference': RowEdition
  },
  edition: {
    object: ObjectEdition,
    array: ArrayEdition,
    string: StringEdition,
    number: NumberEdition,
    boolean: BooleanEdition,
    null: NullEdition,
    enum: EnumEdition,
    const: ConstEdition
  },
  drawer: FieldDrawer,
  schemaErrorLogger: SchemaErrorLogger
}

export const antdViewsMap = {
  list: {
    edition: {
      array: ArrayListViewEdition
    },
    shortable: false
  }
}
