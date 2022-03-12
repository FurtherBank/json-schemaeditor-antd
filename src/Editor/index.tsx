import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { createStore, Store } from "redux"
import { Provider } from "react-redux"
import Field from "./Field"
import { ajvInstance, Caches, itemSchemaCache, ofSchemaCache, propertySchemaCache, reducer } from "./reducer"
import FieldDrawer from "./FieldDrawer"
import Alert from "antd/lib/alert"

import "./css/index.scss"
import _ from "lodash"

interface EditorProps {
  onChange?: (data: any) => void | null
  data?: any
  schema: RootSchema | true
}
export const CacheContext = React.createContext({
  ofCache: new Map(),
  propertyCache: new Map(),
  itemCache: new Map(),
  rootSchema: {}
} as ContextContent)

export interface ContextContent {
  ofCache: Map<string, ofSchemaCache | null>
  propertyCache: Map<string, propertySchemaCache | null>
  itemCache: Map<string, itemSchemaCache | null>
  rootSchema: RootSchema
}

export interface SchemaCache extends ContextContent {
  entrySchemaMap: Map<string, boolean | Schema>
  valueEntry: string | undefined
  valueSchemaMap: Map<string, boolean | Schema>
}

const EditorHook = (props: EditorProps) => {
  const { schema, data, onChange } = props
  let schemaChanged = false

  // 编译 schema，并通知 schema 已经改变。
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

  // 在 store 被更改的时候才会重新渲染，这一步清空 schema 修改标记
  const initStore = () => {
    schemaChanged = false
    const initialState = {
      data: data,
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
  const caches = useMemo(() => {
    console.log('caches变化');
    
    return {
      ofCache: new Map(),
      propertyCache: new Map(),
      itemCache: new Map(),
      rootSchema: validate instanceof Function ? typeof schema !== 'boolean' ? schema : {} : {}
    }
  }, [schema])
  const drawerRef = useRef(null) as React.RefObject<any>

  const [nowData, setNowData] = useState(data)  // 通过 nowData 与 data 是否同步检测变化是否来自外部，如果是则重置store
  const [store, setStore] = useState(initStore)

  const setDrawer = (...args: any[]) => {
    console.log("setDrawer", drawerRef.current)
    if (drawerRef.current) drawerRef.current.setDrawer(...args)
  }


  // 如果 data 更新来自外部，或者 schema 更改，则重置 store
  if (!_.isEqual(data, nowData) || schemaChanged) {
    console.log("重置 store", schemaChanged)
    if (!schemaChanged) {
      console.log("schema没改：新的data", data, "现在的data", nowData)
    }
    setStore(initStore())
    setNowData(data)
    return <></>
  }

  return (
    <Provider store={store}>
      {validate instanceof Function ? null : (
        <Alert message="Error" description={validate.toString()} type="error" showIcon />
      )}
      <CacheContext.Provider value={caches}>
      <Field route={[]} field={null} schemaEntry="#" setDrawer={setDrawer} />
      <FieldDrawer ref={drawerRef} />

      </CacheContext.Provider>
    </Provider>
  )
}

export default React.memo(EditorHook)
