/* eslint-disable @typescript-eslint/no-shadow */
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import draft6MetaSchema from 'ajv/dist/refs/json-schema-draft-06.json'

const defaultAjvInstance = new Ajv({
  allErrors: true
}) // options can be passed, e.g. {allErrors: true}
defaultAjvInstance.addMetaSchema(draft6MetaSchema)
addFormats(defaultAjvInstance)

// 添加base-64 format
defaultAjvInstance.addFormat('data-url', /^data:([a-z]+\/[a-z0-9-+.]+)?;(?:name=(.*);)?base64,(.*)$/)

// 添加color format
defaultAjvInstance.addFormat(
  'color',
  // eslint-disable-next-line max-len
  /^(#?([0-9A-Fa-f]{3}){1,2}\b|aqua|black|blue|fuchsia|gray|green|lime|maroon|navy|olive|orange|purple|red|silver|teal|white|yellow|(rgb\(\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*\))|(rgb\(\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*\)))$/
)

// 添加row format
defaultAjvInstance.addFormat('row', /.*/)

// 添加multiline format
defaultAjvInstance.addFormat('multiline', /.*/)

// 添加 view 关键字
defaultAjvInstance.addKeyword({
  keyword: 'view',
  type: 'object',
  metaSchema: {
    type: 'object',
    properties: { type: { type: 'string' }, param: {} },
    required: ['type'],
    additionalProperties: false
  }
})

export default defaultAjvInstance
