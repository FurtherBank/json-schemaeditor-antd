import React from 'react';
// import formdata from "./json-example/formdata.json"
import schema from "./schema-example/schema.json"
import data from "./json-example/dataFaciltyv2.json"
import Editor from './Editor';
import EditorHook from './EditorHook';

function App() {
  return (
    <EditorHook 
      data={data}
      schema={schema}
      editionName={'datavalue'}
    />
  );
}

export default App;
