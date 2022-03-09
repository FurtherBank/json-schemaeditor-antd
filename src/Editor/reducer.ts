/* eslint-disable no-prototype-builtins */
import Ajv, { ValidateFunction } from "ajv"
import addFormats from "ajv-formats"
import draft6MetaSchema from "ajv/dist/refs/json-schema-draft-06.json"
import localize from "ajv-i18n/localize/zh"

import _ from "lodash"

export enum ShortOpt {
  no,
  short,
  extra,
}

export interface ofSchemaCache {
  ofRef: string
  ofLength: number
  extracted: RootSchema
  options: any[]
}

export interface propertySchemaCache {
  shortProps: (string | RegExp)[]
  otherProps: (string | RegExp)[]
  required: string[]
  additionalShortAble: boolean
  additionalValid: boolean
}

export interface itemSchemaCache {
  shortOpt: ShortOpt
  itemLength?: number
}

export interface Caches {
  ofCache: Map<string, ofSchemaCache | null>
  propertyCache: Map<string, propertySchemaCache | null>
  itemCache: Map<string, itemSchemaCache | null>
}

export interface Act {
  type: string;
  route: string[];
  field: string | null;
  value?: string;
}

export interface State {
  data: any;
  rootSchema: any;
  lastChangedRoute: string[] | null,
  lastChangedField: string[],
  dataErrors: any[],
  schemaErrors?: any,
  cache: Caches,
  validate?: Function
}

const ajv = new Ajv({
  allErrors: true,
}) // options can be passed, e.g. {allErrors: true}
ajv.addMetaSchema(draft6MetaSchema)
addFormats(ajv)

// 添加base-64 format
ajv.addFormat("data-url", /^data:([a-z]+\/[a-z0-9-+.]+)?;(?:name=(.*);)?base64,(.*)$/)

// 添加color format
ajv.addFormat(
  "color",
  // eslint-disable-next-line max-len
  /^(#?([0-9A-Fa-f]{3}){1,2}\b|aqua|black|blue|fuchsia|gray|green|lime|maroon|navy|olive|orange|purple|red|silver|teal|white|yellow|(rgb\(\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*\))|(rgb\(\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*\)))$/
)

// 添加row format
ajv.addFormat("row", /.*/)

// 添加multiline format
ajv.addFormat("multiline", /.*/)

// 添加 view 关键字
ajv.addKeyword({
  keyword: "view",
  type: "object",
  metaSchema: {
    type: "object",
    properties: { type: { type: "string" } },
    required: ["type"],
    additionalProperties: false,
  },
})

const ajvInstance = ajv

// let validate: ValidateFunction = null!
// const ajvValidate = (
//   schema: any,
//   data: any
// ): [boolean | PromiseLike<any>, ValidateFunction] => {
//   const validate = ajv.compile(schema);

//   const valid = validate(data);
//   return [valid, validate];
// };

const reducer = (
  s: State = {
    data: null,
    rootSchema: {},
    lastChangedRoute: [],
    lastChangedField: [],
    dataErrors: [],
    cache: {
      ofCache: new Map(),
      propertyCache: new Map(),
      itemCache: new Map(),
    },
    validate: null!,
  },
  a: Act
) => {
  const { rootSchema } = s
  const { type, route, field, value } = a
  const reValidate = () => {
    if (typeof s.validate === "function") {
      const validate = s.validate as ValidateFunction
      const valid = validate(s.data)
      localize(validate.errors)
      s.dataErrors = validate.errors ? validate.errors : []
      if (validate.errors) {
        console.log("not valid", validate.errors)
      } else {
        console.log("验证成功")
      }
    }
  }

  // 特殊接口： set强制设置
  if (type === "set") return Object.assign({}, s, value) // set强制设置
  // 初始化
  if (!route) {
    reValidate()
    return Object.assign({}, s)
  }
  const access = field !== null ? route.concat(field) : route
  console.log(type, s, route.join("/") + "+" + field, value)

  const logError = (error: string) => {
    console.log(error, route.join("/") + "+" + field, value, oriNode)
    s.lastChangedRoute = null
    return s
  }

  let data = s.data // 注意这个变量一直是 s 子节点的一个引用
  for (const key of route) {
    data = data[key]
  }
  const oriNode = data

  // 初始化动作修改路径
  s.lastChangedField = []
  s.lastChangedRoute = route

  switch (type) {
    case "create":
      if (!field) {
        logError("未指定field")
        return s
      }
      if (oriNode instanceof Array) {
        // 给array push 一个新东西
        const index = parseInt(field!)
        oriNode[index] = value
      } else if (oriNode instanceof Object) {
        // 给对象创建新的属性
        if (!oriNode.hasOwnProperty(field)) {
          oriNode[field] = value
        }
      } else {
        logError("对非对象/数组的错误创建请求")
      }
      s.lastChangedField = [field]
      break
    case "change": // change 是对非对象值的改变
      if (field === null) {
        s.data = _.cloneDeep(value)
      } else if (oriNode instanceof Array || oriNode instanceof Object) oriNode[field] = _.cloneDeep(value)
      else logError("对非对象/数组的字段修改请求")

      s.lastChangedRoute = access
      break
    case "delete":
      if (!field) return s

      if (oriNode instanceof Array) {
        // 注意数组删除，后面元素是要前移的
        const index = parseInt(field)
        _.remove(oriNode, (value: any, i: number) => i === index)
      } else if (oriNode instanceof Object) delete oriNode[field]
      else {
        logError("对非对象/数组的字段删除请求")
      }
      break
    case "rename":
      if (!field || !value || field === value) break

      if (oriNode instanceof Object) {
        // todo: 严查value类型
        if (!oriNode.hasOwnProperty(value)) {
          oriNode[value!] = oriNode[field]
          delete oriNode[field]
        }
      } else {
        logError("对非对象的字段重命名请求")
      }
      break
    case "moveup":
    case "movedown":
      if (oriNode instanceof Array) {
        if (!field) return s
        const index = parseInt(field)
        const swapIndex = type === "moveup" ? index - 1 : index + 1
        if (swapIndex >= 0 && swapIndex < oriNode.length) {
          const temp = oriNode[index]
          oriNode[index] = oriNode[swapIndex]
          oriNode[swapIndex] = temp
          s.lastChangedField = [field, swapIndex.toString()]
        } else {
          logError("数组项越界移动")
        }
      } else logError("对非数组的移动请求")
      break
    default:
      console.log("错误的动作请求")
  }
  // 重新验证
  reValidate()
  return Object.assign({}, s)
}

const doAction = (type: string, route = [], field = null, value = undefined) => ({
  type,
  route,
  field,
  value,
})

const JsonTypes = ["object", "array", "string", "number", "boolean", "null"]

export { reducer, doAction, JsonTypes, ajvInstance }
