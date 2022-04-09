import Ajv, { ValidateFunction } from "ajv"
import addFormats from "ajv-formats"
import draft6MetaSchema from "ajv/dist/refs/json-schema-draft-06.json"
import localize from "ajv-i18n/localize/zh"

import _, { isEqual } from "lodash"
import produce from "immer"
import undoable from "redux-undo"

export enum ShortOpt {
  no,
  short,
  extra,
}

export interface ofSchemaCache {
  ofRef: string
  ofLength: number
  extracted: (undefined | string)[]
  options: any[]
}

export interface PropertyInfo {
  ref: string
  shortable: boolean
}

export interface propertySchemaCache {
  props: { [x: string]: PropertyInfo }
  patternProps: { [x: string]: PropertyInfo }
  required: string[]
  additional: PropertyInfo | undefined
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
  type: string
  route: string[]
  field: string | null
  value?: string
}

export interface State {
  data: any
  dataErrors: any[]
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

const reducer = undoable(
  produce(
    (s: State, a: Act) => {
      const { type, route, field, value } = a
      const reValidate = () => {
        console.time("验证")
        if (typeof s.validate === "function") {
          const validate = s.validate as ValidateFunction
          const valid = validate(s.data)
          localize(validate.errors)

          if (!isEqual(s.dataErrors, validate.errors)) s.dataErrors = validate.errors ? validate.errors : []

          if (validate.errors) {
            console.warn("not valid", validate.errors)
          }
        }
        console.timeEnd("验证")
      }

      // 特殊接口：setData 强制设置数据
      if (type === "setData") {
        s.data = value
        return
      } 
      
      // 初始化
      if (!route) {
        console.log("初始化验证", a)
        reValidate()
        return
      }
      
      console.log(type, s, route.join("/") + "+" + field, value)

      const logError = (error: string) => {
        console.log(error, route.join("/") + "+" + field, value, fieldData)
      }

      let data = s.data // 注意这个变量一直是 s 子节点的一个引用
      for (const key of route) {
        data = data[key]
      }
      const fieldData = data

      // 初始化动作修改路径

      switch (type) {
        case "create":
          if (!field) {
            logError("未指定field")
            return
          }
          if (fieldData instanceof Array) {
            // 给array push 一个新东西
            const index = parseInt(field!)
            fieldData[index] = value
          } else if (fieldData instanceof Object) {
            // 给对象创建新的属性
            if (!fieldData.hasOwnProperty(field)) {
              fieldData[field] = value
            }
          } else {
            logError("对非对象/数组的错误创建请求")
          }
          break
        case "change": // change 是对非对象值的改变
          if (field === null) {
            s.data = _.cloneDeep(value)
          } else if (fieldData instanceof Array || fieldData instanceof Object) fieldData[field] = _.cloneDeep(value)
          else logError("对非对象/数组的字段修改请求")

          break
        case "delete":
          if (!field) return

          if (fieldData instanceof Array) {
            // 注意数组删除，后面元素是要前移的
            const index = parseInt(field)
            _.remove(fieldData, (value: any, i: number) => i === index)
          } else if (fieldData instanceof Object) delete fieldData[field]
          else {
            logError("对非对象/数组的字段删除请求")
          }
          break
        case "rename":
          if (!field || !value || field === value) break

          if (fieldData instanceof Object) {
            // todo: 严查value类型
            if (!fieldData.hasOwnProperty(value)) {
              fieldData[value!] = fieldData[field]
              delete fieldData[field]
            }
          } else {
            logError("对非对象的字段重命名请求")
          }
          break
        case "moveup":
        case "movedown":
          if (fieldData instanceof Array) {
            if (!field) return
            const index = parseInt(field)
            const swapIndex = type === "moveup" ? index - 1 : index + 1
            if (swapIndex >= 0 && swapIndex < fieldData.length) {
              const temp = fieldData[index]
              fieldData[index] = fieldData[swapIndex]
              fieldData[swapIndex] = temp
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
      return
    },
    {
      data: {},
      dataErrors: [],
    } as State
  ),
  {
    undoType: "undo",
    redoType: "redo",
    limit: 35
  }
)

const doAction = (type: string, route = [], field = null, value = undefined) => ({
  type,
  route,
  field,
  value,
})

const JsonTypes = ["object", "array", "string", "number", "boolean", "null"]

export { reducer, doAction, JsonTypes, ajvInstance }
