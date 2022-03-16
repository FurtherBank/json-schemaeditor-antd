import React, { useState } from "react"
// import formdata from "./json-example/formdata.json"
import $Items from "./schema-example/Itemsv20.json"
import Items from "./json-example/Items.json"
import ClassesSchema from "./json-example/$schema.Classes.json"
import Classes from "./json-example/Classes.json"
import enums from "./json-example/test-enums.json"
import enumsSchema from "./json-example/$schema.test-nums.json"

import facility from "./json-example/dataFacility.json"
import $facility from "./json-example/$schema.dataFacility.json"
import { fromJS } from "immutable"

import $simple from "./json-example/$schema.simple.json"

import meta from "./json-example/$meta.json"
import Editor from "./Editor"
import _ from "lodash"
import Affix from "antd/lib/affix"

const datas = [enums, [], $Items, Items, Classes, meta, $simple].map((v) => _.cloneDeep(v))
const schemas = [enumsSchema, $Items, meta, $Items, ClassesSchema, meta, meta].map((v) => _.cloneDeep(v))

// console.time('switch')
// const immutableMeta = fromJS(meta)
// console.timeLog('switch', 'from')
// const backMeta = immutableMeta.toJS()
// console.timeEnd('switch')


const App = () => {
  const [id, setId] = useState(6)

  const data = datas[id],
    schema = schemas[id]
  const change = (value: string) => {
    console.log("新的只", value)
  }

  return (
    <div style={{height: "100vh"}}>
      <Editor data={data} schema={schema as any} onChange={change} />
      <Affix offsetTop={50} style={{ position: "absolute", bottom: "80px", right: "60px" }}>
        <button
          onClick={(e) => {
            const newid = (id + 1) % datas.length
            console.log("更改变量", newid, datas[newid])
            setId(newid)
          }}
        >
          有本事点我一下(受控测试)
        </button>
      </Affix>
    </div>
  )
}

export default App
