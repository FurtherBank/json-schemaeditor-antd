interface RootSchema extends Schema {
  $id?: string;
  $schema?: string;
  definitions?: { [propName: string]: Schema };
}

interface Schema {
  title?: string;
  description?: string;
  $ref?: string;
  enum?: any[];
  const?: any;
  oneOf?: Schema[];
  anyOf?: Schema[];
  allOf?: Schema[];
  type?: string;
  // string
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  view?: string; // 多种方式解释编辑字符串，其中multi为多行编辑
  // number
  mininum?: number;
  maxinum?: number;
  exclusiveMinimum?: boolean;
  exclusiveMaximum?: boolean;
  // array
  prefixItems?: Schema[] | Schema;
  items?: Schema[] | Schema;
  additionalItems?: Schema;
  minItems?: number;
  maxItems?: number;
  contains?: Schema;
  // object
  properties?: { [propName: string]: Schema };
  patternProperties?: { [propName: string]: Schema };
  additionalProperties?: { [propName: string]: Schema };
  propertyNames?: Schema;
  required?: string[];
  minProperties?: number;
  maxProperties?: number;
  dependencies?: { [propName: string]: string[] };
}


interface Act {
  type: string;
  route: string[];
  field: string | null;
  value?: string;
}

interface State {
  data: any;
  schema: any;
  editionName: string,
  lastChangedRoute: string[] | null,
  lastChangedField: string[]
}

// enum JsonTypes {}