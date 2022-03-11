import React, { useState } from "react"
// import formdata from "./json-example/formdata.json"
import ItemsSchema from "./schema-example/Itemsv20.json"
import Items from "./json-example/Items.json"
import ClassesSchema from "./json-example/$schema.Classes.json"
import Classes from "./json-example/Classes.json"
import meta from "./json-example/$meta.json"
import Editor from "./Editor"
import _ from "lodash"
import Affix from "antd/lib/affix"


const datas = [ItemsSchema,Items,  Classes, meta].map((v) => _.cloneDeep(v))
const schemas = [ meta, ItemsSchema,ClassesSchema, meta].map((v) => _.cloneDeep(v))

const App = () => {
  const [id, setId] = useState(0)

  const data = datas[id], schema = schemas[id]
  const change = (value: string) => {
    console.log("新的只", value)
  }

  return (
    <>
      <Editor data={data} schema={schema as any} onChange={change} />
      <Affix offsetTop={50} style ={{position: "absolute", bottom: "80px", right:"60px"}}><button
        onClick={(e) => {
          const newid = (id + 1) % datas.length
          console.log("更改变量", newid, datas[newid])
          setId(newid)
        }}
      >
        有本事点我一下(受控测试)
      </button></Affix>
    </>
  )
}

export default App
