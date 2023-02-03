/**
 * title: JsonSchemaEditor demo
 * desc: 可以自行查看示例、编辑，并从 monaco-editor 协助编辑 json 和 schema！点击左下角 `Open in new tab` 获取最佳编辑体验！
 * compact: true
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import _ from 'lodash'

import { Button, Card, PageHeader, message } from 'antd' // 用 antd 封装demo
import MonacoEditor from 'react-monaco-editor/lib/editor'

import JsonSchemaEditor, { metaSchema } from 'json-schemaeditor-antd'
import examples from './examples'
import { useCooldown } from './hooks'
import ModalSelect from './ModalSelect'
import CpuEditorContext from '../context'

const exampleJson = examples(metaSchema)
// 从 localStorage 读取 json
const loadLocalJson = (key: string) => {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : undefined
  } catch (error) {
    return undefined
  }
}

// app 最终定义
export default () => {
  const [mode, setMode] = useState(0)

  const [data, setData] = useState(() => loadLocalJson('data') ?? _.cloneDeep(exampleJson['基础'][0]))
  const [schema, setSchema] = useState(() => loadLocalJson('schema') ?? _.cloneDeep(exampleJson['基础'][1]))

  const dataEditor = useRef<MonacoEditor>(null)
  const schemaEditor = useRef<MonacoEditor>(null)
  const editorRef = useRef<CpuEditorContext>(null)

  const [isModalVisible, setIsModalVisible] = useState(false)

  const showModal = () => {
    setIsModalVisible(true)
  }

  const handleCancel = () => {
    setIsModalVisible(false)
  }

  // 自动保存
  // 注：开发模式会渲染两次，这里就会保存两遍。生产模式没事
  const save = useCooldown(
    (data, schema) => {
      try {
        localStorage.setItem('data', JSON.stringify(data))
        localStorage.setItem('schema', JSON.stringify(schema))
      } catch (error) {
        console.error(error)
      }
    },
    1000,
    []
  )

  useMemo(() => {
    save(data, schema)
  }, [data, schema])

  const changeData = (value: any) => {
    setData(typeof value === 'object' ? value : value)
  }

  const changeExample = (data: any, schema: any) => {
    setData(data)
    setSchema(schema)
    setIsModalVisible(false)
  }

  const changeMode = () => {
    if (mode) {
      try {
        // get code
        const dataCode = dataEditor.current?.editor?.getValue() ?? '{}'
        const schemaCode = schemaEditor.current?.editor?.getValue() ?? '{}'
        // parse json code
        const newData = JSON.parse(dataCode),
          newSchema = JSON.parse(schemaCode)
        setData(newData)
        setSchema(newSchema)
        setMode(0)
      } catch (error) {
        message.error(`JSON 数据 或者 JSON JSONSchema6 解析出错，请检查代码编辑器中的数据是否正确。`)
      }
    } else {
      setMode(1)
    }
  }

  const pushItem = useCallback(() => {
    const ctx = editorRef.current
    if (ctx) {
      const data = ctx.getNowData()
      if (data instanceof Array) {
        const newItem = `new Item ${data.length}`
        ctx.executeAction('create', undefined, [], data.length.toString(), newItem)
      }
    }
  }, [editorRef])

  // ctx 暴露给 window 便于测试
  useEffect(() => {
    const ctx = editorRef.current
    if (ctx) {
      // @ts-ignore
      window.ctx = ctx
    }
  }, [editorRef.current])

  const rootMenuItems = [
    <button
      key="root-menu-1"
      type="button"
      onClick={pushItem}
      title="该按钮通过 rootMenuItems 属性呈现，可以在组件中拿到 ctx 然后通过 ctx 实现点击事件操作"
    >
      press to push item
    </button>
  ]

  return (
    <div style={{ height: '100vh', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="JSON Editor"
        className="site-page-header"
        subTitle="By FurtherBank"
        extra={[
          <Button key="2" onClick={changeMode}>
            {mode ? '返回编辑器' : '源代码编辑'}
          </Button>,
          <Button key="1" type="primary" onClick={showModal}>
            加载示例
          </Button>
        ]}
      ></PageHeader>
      {mode ? (
        <div style={{ display: 'flex', overflow: 'auto', justifyContent: 'stretch', flex: 1 }}>
          <Card title="data" style={{ flex: 1, display: 'flex', flexDirection: 'column' }} bodyStyle={{ flex: 1 }}>
            <MonacoEditor
              language="json"
              theme="vs"
              value={JSON.stringify(data, null, 2)}
              ref={dataEditor}
              options={{
                automaticLayout: true,
                formatOnPaste: true,
                formatOnType: true,
                renderLineHighlight: 'none',
                autoClosingOvertype: 'always',
                cursorStyle: 'line',
                quickSuggestions: false,
                scrollBeyondLastLine: false,
                snippetSuggestions: 'none',
                minimap: {
                  enabled: true
                }
              }}
            />
          </Card>
          <Card title="schema" style={{ flex: 1, display: 'flex', flexDirection: 'column' }} bodyStyle={{ flex: 1 }}>
            <MonacoEditor
              language="json"
              theme="vs"
              value={JSON.stringify(schema, null, 2)}
              ref={schemaEditor}
              options={{
                automaticLayout: true,
                formatOnPaste: true,
                formatOnType: true,
                renderLineHighlight: 'none',
                autoClosingOvertype: 'always',
                cursorStyle: 'line',
                quickSuggestions: false,
                scrollBeyondLastLine: false,
                snippetSuggestions: 'none',
                minimap: {
                  enabled: true
                }
              }}
            />
          </Card>
        </div>
      ) : (
        <div style={{ flex: 1, height: '0' }}>
          <JsonSchemaEditor
            data={data}
            schema={schema as any}
            onChange={changeData}
            rootMenuItems={rootMenuItems}
            ref={editorRef}
          />
        </div>
      )}
      <ModalSelect cb={changeExample} cancelCb={handleCancel} visible={isModalVisible} />
    </div>
  )
}
