import Ajv, { ValidateFunction } from "ajv"
import addFormats from "ajv-formats"
import draft6MetaSchema from "ajv/dist/refs/json-schema-draft-06.json"

import propertyTest from "../../schema-example/test-property.json"
import refTest from "../../schema-example/test-ref.json"
import formatTest from "../../schema-example/test-format.json"
import messTest from "../../schema-example/test-format.json"
import _ from "lodash"

const ajv = new Ajv({
  allErrors: true
}) // options can be passed, e.g. {allErrors: true}
ajv.addMetaSchema(draft6MetaSchema)
addFormats(ajv)

// 添加base-64 format
ajv.addFormat(
  "data-url",
  /^data:([a-z]+\/[a-z0-9-+.]+)?;(?:name=(.*);)?base64,(.*)$/
)

// 添加color format
ajv.addFormat(
  "color",
  // eslint-disable-next-line max-len
  /^(#?([0-9A-Fa-f]{3}){1,2}\b|aqua|black|blue|fuchsia|gray|green|lime|maroon|navy|olive|orange|purple|red|silver|teal|white|yellow|(rgb\(\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*\))|(rgb\(\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*\)))$/
)

// 添加row format
ajv.addFormat(
  "row",
  /.*/
)

// 添加multiline format
ajv.addFormat(
  "multiline",
  /.*/
)

const ajvValidate = (
  schema: any,
  data: any
): [boolean | PromiseLike<any>, ValidateFunction] => {
  const validate = ajv.compile(schema)

  const valid = validate(data)
  return [valid, validate]
}

test("基础", () => {
  const data = 10
  const plainSchema = {
    type: 'string'
  }
  const [valid, validate] = ajvValidate(plainSchema, 10)
  expect(validate.errors).toBeDefined()
  expect(validate.errors instanceof Array).toBeTruthy()
  expect(validate.errors![0].instancePath).toBe('')
  // 一层
  const objSchema = {
    type: 'object',
    properties: {
      num: {
        type: 'number'
      }
    },
    required: ['num']
  }
  const [valid2, validate2] = ajvValidate(objSchema, {num: '15'})
  expect(validate2.errors![0].instancePath).toBe('/num')
})

test("properties和patternProperties是否合并", () => {
  const data = {
    num: 10,
  }
  const [valid, validate] = ajvValidate(propertyTest, data)
  // 在 ajv 严格模式下不允许 properties 中属性匹配 patternProperties
  if (!valid) console.log(validate.errors)
  
  expect(valid).toBe(false)
})

test("ref是否合并", () => {
  const data = {
    num: 40,
  }
  const [valid, validate] = ajvValidate(refTest, data)
  const data2 = {
    num: 42,
  }
  // ref 会进行合并，且验证时两模式必须同时满足
  const errors = validate.errors
  expect(valid).toBe(false)
  const valid2 = validate(data2)
  expect(valid2).toBe(false)
  const errors2 = validate.errors
  expect(_.isEqual(errors, errors2)).toBe(false)
  console.log(errors, errors2)
  const data3 = {
    num: 45,
  }
  const valid3 = validate(data3)
  expect(valid3).toBe(true)
  console.log(validate.errors)
  
  
})

test("ajv格式支持", () => {
  const data = {
    color: "#665544",
    row: "这写代码多是一件美事啊！",
    multi: "我是一家人",
    ipv4: "127.0.0.1",
    email: "iamyourfather@env.com"
  }
  const [valid, validate] = ajvValidate(formatTest, data)
  // 在 ajv 严格模式下不允许 properties 中属性匹配 patternProperties
  if (!valid) console.log(validate.errors)
  expect(valid).toBe(true)
})

test("无类型混乱模式", () => {
  const data = {
    color: "#665544",
    row: "这写代码多是一件美事啊！",
    multi: "我是一家人",
    ipv4: "127.0.0.",
    email: "iamyourfather@env.com"
  }
  
  const data2 = {
    color: "#665544",
    row: "这写代码多是一件美事啊！",
    multi: "我是一家人",
    ipv4: "127.0.0.1",
    email: "iamyourfather@env.com"
  }
  const [valid, validate] = ajvValidate(messTest, data)
  expect(valid).toBe(false)
  // 在 ajv 严格模式下不允许 properties 中属性匹配 patternProperties
  if (!valid) console.log(validate.errors)
})

// test('1', () => {
//   getSchemaTypes
//   const data = null
//   const [valid, validate] = ajvValidate(extracted, data);
//   expect(valid).toBe(true);
// })