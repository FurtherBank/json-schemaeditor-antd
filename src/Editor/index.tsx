import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { createStore, Store } from "redux"
import { Provider } from "react-redux"
import Field from "./Field"
import { ajvInstance, reducer } from "./reducer"
import FieldDrawer from "./FieldDrawer"
import Alert from "antd/lib/alert"

import "./css/index.scss"
import _ from "lodash"

interface EditorProps {
  editionName: string
  onChange?: (data: any) => void | null
  data?: any
  schema: RootSchema | boolean
}

const EditorHook = (props: EditorProps) => {
  const { schema, data, onChange, editionName } = props
  let schemaChanged = false
  const compileSchema = () => {
    let validate = undefined
    let schemaErrors = null
    schemaChanged = true
    try {
      validate = ajvInstance.compile(schema)
      return validate
    } catch (error) {
      schemaErrors = error
      return schemaErrors
    }
  }

  // 在 store 被更改的时候才会重新渲染
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

  const change = () => {
    const changedData = store.getState().data
    setNowData(changedData)
    if (onChange && typeof onChange == "function") {
      onChange(changedData)
    }
  }
  const validate = useMemo(compileSchema, [schema]) as Function | any
  const drawerRef = useRef(null) as React.RefObject<any>

  const [nowData, setNowData] = useState(undefined)  // 通过 nowData 与 data 是否同步检测变化是否来自外部，如果是则重置store
  const [store, setStore] = useState(undefined! as Store<State, Act>)

  const setDrawer = (...args: any[]) => {
    console.log("setDrawer", drawerRef.current)
    if (drawerRef.current) drawerRef.current.setDrawer(...args)
  }

  if (!_.isEqual(data, nowData) || schemaChanged) {
    console.log("重置 store")
    schemaChanged = false
    setNowData(data)
    setStore(initStore)
  }

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
