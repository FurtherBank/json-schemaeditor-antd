import React, { useState } from "react"
// import formdata from "./json-example/formdata.json"
import schema from "./schema-example/schema.json"
import jsonData from "./json-example/dataFaciltyv2.json"
import Editor from "./Editor"
import _ from "lodash"

const initialData = _.cloneDeep(jsonData)

const App = () => {
  const [data, setData] = useState(jsonData)

  const change = (value: string) => {
    console.log('新的只', value)
  }

  return (
    <div style={{position: "relative"}}>
      <Editor
        data={data}
        schema={schema as any}
        editionName={"datavalue"}
        onChange={change}
      />
      <button
        onClick={(e) => {
          console.log('重置');
          console.dir(initialData);
          setData(initialData)
        }}
        style={{position: "sticky", top: "3px"}}
      >
        有本事点我一下(受控测试)
      </button>
    </div>
  )
}

export default App
