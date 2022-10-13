import React, { CSSProperties, forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from 'react'
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import Field from './Field'
import { reducer } from './reducer'
import FieldDrawer from './FieldDrawer'
import { Alert } from 'antd'
import { ValidateFunction } from 'ajv'

import './css/index.less'
import SchemaInfoContent from './info'
import ajvInstance from './definition/ajvInstance'
import { JSONSchema } from './type/Schema'

export interface EditorProps {
  onChange?: (data: any) => void | null
  data?: any
  schema?: JSONSchema
  id?: string | undefined
  style?: CSSProperties
}
export const InfoContext = React.createContext<SchemaInfoContent>(null!)

const emptyArray: never[] = []

const Editor = (props: EditorProps, ref: React.ForwardedRef<any>) => {
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

  const infoCtx = useMemo(() => {
    const realSchema = schema === true ? {} : schema ? schema : schema === false ? false : {}
    return new SchemaInfoContent(realSchema, id, store)
  }, [schema])

  // 暴露一下 api
  useImperativeHandle(
    ref,
    () => {
      return infoCtx
    },
    [infoCtx]
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

  // 详细抽屉功能
  const drawerRef = useRef(null) as React.RefObject<any>
  const setDrawer = useCallback(
    (...args: any[]) => {
      // console.log('setDrawer', drawerRef.current);
      if (drawerRef.current) drawerRef.current.setDrawer(...args)
    },
    [drawerRef]
  )

  return (
    <Provider store={store}>
      {validate instanceof Function ? null : (
        <Alert message="Error" description={validate.toString()} type="error" showIcon />
      )}
      <InfoContext.Provider value={infoCtx}>
        <Field route={emptyArray} schemaEntry="#" setDrawer={setDrawer} />
        <FieldDrawer ref={drawerRef} />
      </InfoContext.Provider>
    </Provider>
  )
}

export default React.memo(forwardRef(Editor))
