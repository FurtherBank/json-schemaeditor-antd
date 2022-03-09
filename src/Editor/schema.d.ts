
interface RootSchema extends Schema {
  $id?: string;
  $schema?: string;
  definitions?: { [propName: string]: (Schema | boolean) };
}

interface Schema {
  title?: string;
  description?: string;
  $ref?: string;
  enum?: any[];
  const?: any;
  oneOf?: (Schema | boolean)[];
  anyOf?: (Schema | boolean)[];
  allOf?: (Schema | boolean)[];
  type?: string | string[];
  default?: any,
  examples?: any,
  // string
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string; // 多种方式解释编辑字符串，其中有些格式不支持短优化
  // number
  mininum?: number;
  maxinum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  // array
  prefixItems?: (Schema | boolean)[] | (Schema | boolean);
  items?: (Schema | boolean)[] | (Schema | boolean);
  additionalItems?: (Schema | boolean);
  minItems?: number;
  maxItems?: number;
  contains?: (Schema | boolean);
  // object
  properties?: { [propName: string]: (Schema | boolean) };
  patternProperties?: { [propName: string]: (Schema | boolean) };
  additionalProperties?: (Schema | boolean);
  propertyNames?: (Schema | boolean);
  required?: string[];
  minProperties?: number;
  maxProperties?: number;
  dependencies?: { [propName: string]: string[] };
}

// enum JsonTypes {}