import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from "react"
import { createStore, Store } from "redux"
import { Provider } from "react-redux"
import Field from "./Field"
import { ajvInstance, Caches, itemSchemaCache, ofSchemaCache, propertySchemaCache, reducer } from "./reducer"
import FieldDrawer from "./FieldDrawer"
import Alert from "antd/lib/alert"
import { composeWithDevTools } from 'redux-devtools-extension'

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

const emptyArray: never[] = []

const EditorHook = (props: EditorProps, ref: React.ForwardedRef<any>) => {
  const { schema, data, onChange } = props

  // 编译 schema，并通知 schema 已经改变。
  const compileSchema = () => {
    let validate = undefined
    let schemaErrors = null
    
    console.time('compile schema')
    try {
      validate = ajvInstance.compile(schema)
    } catch (error) {
      schemaErrors = error
    }
    console.timeEnd('compile schema')

    return validate ? validate : schemaErrors
  }
  
  const initStore = () => {
    const initialState = {
      data: data,
      dataErrors: [],
      validate: typeof validate === "function" ? validate : undefined,
    }

    const store = createStore(reducer, {
      past: [],
      present: initialState,
      future: []
    }, composeWithDevTools())

    const change = () => {
      const changedData = store.getState().present.data
      if (onChange && typeof onChange == "function") {
        onChange(changedData)
      }
    }
    store.subscribe(change)
    
    return store
  }

  const validate = useMemo(compileSchema, [schema]) as Function | any
  const store = useMemo(initStore, [schema])
  useImperativeHandle(ref, () => {return store}, [store])

  const caches = useMemo(() => {
    console.log('caches变化')
    return {
      ofCache: new Map(),
      propertyCache: new Map(),
      itemCache: new Map(),
      rootSchema: validate instanceof Function ? typeof schema !== 'boolean' ? schema : {} : {}
    }
  }, [schema])

  // 如果 data 更新来自外部，通过 setData 与 store 同步
  const presentData = store.getState().present.data
  if (data !== presentData) {
    console.log('检测到外部更新：', data, presentData)
    store.dispatch({
      type: 'setData',
      value: data
    })
  }

  // 详细抽屉功能
  const drawerRef = useRef(null) as React.RefObject<any>
  const setDrawer = useCallback((...args: any[]) => {
    console.log("setDrawer", drawerRef.current)
    if (drawerRef.current) drawerRef.current.setDrawer(...args)
  }, [drawerRef])

  return (
    <Provider store={store}>
      {validate instanceof Function ? null : (
        <Alert message="Error" description={validate.toString()} type="error" showIcon />
      )}
      <CacheContext.Provider value={caches}>
      <Field route={emptyArray} field={null} schemaEntry="#" setDrawer={setDrawer} />
      <FieldDrawer ref={drawerRef} />

      </CacheContext.Provider>
    </Provider>
  )
}

export default React.memo(forwardRef(EditorHook))
