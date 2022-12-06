import React, { CSSProperties, forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from 'react'
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import Field from './Field'
import { reducer } from './definition/reducer'
import EditorDrawer from './EditorDrawer'
import { ValidateFunction } from 'ajv'

import CpuEditorContext from './context'
import ajvInstance from './definition/ajvInstance'
import { JSONSchema } from './type/Schema'

export interface EditorProps {
  onChange?: (data: any) => void | null
  data?: any
  schema?: JSONSchema
  id?: string | undefined
  style?: CSSProperties
}
export const InfoContext = React.createContext<CpuEditorContext>(null!)

const emptyArray: never[] = []

const Editor = (props: EditorProps, ref: React.ForwardedRef<CpuEditorContext>) => {
  const { schema, data, onChange, id } = props

  // useMemo 编译 schema
  const validate = useMemo(() => {
    let validate = undefined
    let schemaErrors = null
    const realSchema = schema === true ? {} : schema ? schema : schema === false ? false : {}
    console.time('compile schema')
    try {
      validate = ajvInstance.compile(realSchema)
    } catch (error) {
      schemaErrors = error
    }
    console.timeEnd('compile schema')

    return validate ? validate : schemaErrors
  }, [schema]) as ValidateFunction | any

  // 详细抽屉功能
  const drawerRef = useRef(null) as React.RefObject<any>
  const setDrawer = useCallback(
    (...args: any[]) => {
      // console.log('setDrawer', drawerRef.current);
      if (drawerRef.current) drawerRef.current.setDrawer(...args)
    },
    [drawerRef]
  )

  // useMemo 初始化 store
  const store = useMemo(() => {
    const initialState = {
      data: data,
      dataErrors: [],
      validate: typeof validate === 'function' ? validate : undefined
    }

    const store = createStore(reducer, {
      past: [],
      present: initialState,
      future: []
    })

    const change = () => {
      const changedData = store.getState().present.data
      if (onChange && typeof onChange === 'function') {
        onChange(changedData)
      }
    }
    store.subscribe(change)

    return store
  }, [schema])

  const ctx = useMemo(() => {
    const realSchema = schema === true ? {} : schema ? schema : schema === false ? false : {}
    return new CpuEditorContext(realSchema, id, store, setDrawer)
  }, [schema])

  // 暴露一下 api
  useImperativeHandle(
    ref,
    () => {
      return ctx
    },
    [ctx]
  )

  // 如果 data 更新来自外部，通过 setData 与 store 同步
  const presentData = store.getState().present.data
  if (data !== presentData) {
    // console.log('检测到外部更新：', data, presentData);
    store.dispatch({
      type: 'setData',
      value: data
    })
  }

  const SchemaErrorLogger = ctx.getComponent(null, ['schemaErrorLogger'])
  return (
    <Provider store={store}>
      {validate instanceof Function ? null : <SchemaErrorLogger error={validate.toString()} />}
      <InfoContext.Provider value={ctx}>
        <Field route={emptyArray} schemaEntry="#" />
        <EditorDrawer ref={drawerRef} />
      </InfoContext.Provider>
    </Provider>
  )
}

export default React.memo(forwardRef(Editor))
