import React, { useState } from "react"
// import formdata from "./json-example/formdata.json"
import schema from "./schema-example/dataFacilityv2.json"
import jsonData from "./json-example/dataFacility.json"
import Editor from "./Editor"
import _ from "lodash"
import Affix from "antd/lib/affix"

const initialData = _.cloneDeep(jsonData)

const App = () => {
  const [data, setData] = useState(jsonData)

  const change = (value: string) => {
    console.log("新的只", value)
  }

  return (
    <div style={{ position: "relative" }}>
      <Editor data={data} schema={schema as any} editionName={"datavalue"} onChange={change} />
      <Affix offsetTop={50}><button
        onClick={(e) => {
          console.log("重置")
          console.dir(initialData)
          setData(initialData)
        }}
      >
        有本事点我一下(受控测试)
      </button></Affix>
    </div>
  )
}

export default App
