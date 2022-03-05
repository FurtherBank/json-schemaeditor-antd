import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { createStore, Store } from "redux"
import { Provider } from "react-redux"
import Field from "./Field"
import { ajvInstance, reducer } from "./reducer"
import FieldDrawer from "./FieldDrawer"
import Alert from "antd/lib/alert"

import "./css/index.scss"

interface EditorProps {
  editionName: string
  onChange?: (data: any) => void | null
  data?: any
  schema: RootSchema | boolean
}

const EditorHook = (props: EditorProps) => {
  const { schema, data, onChange, editionName } = props
  const compileSchema = () => {
    let validate = undefined
    let schemaErrors = null
    try {
      validate = ajvInstance.compile(schema)
      return validate
    } catch (error) {
      schemaErrors = error
      return schemaErrors
    }
  }
  const change = () => {
    if (onChange && typeof onChange == "function") {
      onChange(store.getState().data)
    }
  }
  const initStore = () => {
    const initialState = {
      data: data,
      editionName: editionName,
      rootSchema: typeof validate === "function" ? schema : true,
      lastChangedRoute: [],
      lastChangedField: [],
      dataErrors: [],
      schemaErrors: typeof validate === "function" ? null : validate,
      cache: {
        ofCache: new Map(),
        propertyCache: new Map(),
        itemCache: new Map(),
      },
      validate: typeof validate === "function" ? validate : undefined,
    }
    const store = createStore(reducer, initialState)
    store.subscribe(change)
    return store
  }

  const validate = useMemo(compileSchema, [schema]) as Function | any
  const drawerRef = useRef(null) as React.RefObject<any>
  const store = initStore()

  const setDrawer = (...args: any[]) => {
    console.log("setDrawer", drawerRef.current)
    if (drawerRef.current) drawerRef.current.setDrawer(...args)
  }
  console.log("editor重新渲染")

  return (
    <Provider store={store}>
      {validate instanceof Function ? null : (
        <Alert message="Error" description={validate.toString()} type="error" showIcon />
      )}
      <Field route={[]} field={null} schemaEntry="#" setDrawer={setDrawer} />
      <FieldDrawer ref={drawerRef} />
    </Provider>
  )
}

export default React.memo(EditorHook)
