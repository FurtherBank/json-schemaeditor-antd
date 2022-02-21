import React from 'react';
// import formdata from "./json-example/formdata.json"
import schema from "./json-example/meta_schema.json"
import Editor from './Editor';

function App() {
  return (
    <Editor 
        data={schema}
        editionName={'datavalue'}
    />
  );
}

export default App;
