import React, { useMemo, useRef, useState, useEffect, useCallback } from "react"
import _, { cloneDeep } from "lodash"

import { Button, Card, PageHeader, message, Modal, Select } from "antd"  // 用 antd 封装demo
import MonacoEditor from "react-monaco-editor/lib/editor"

import JsonSchemaEditor from "."  // 不知道为什么，直接写"json-schemaeditor-antd"会报错！有什么解决方案？

// json 配置
import general from "./json-example/general.json"
import $general from "./json-example/$schema.general.json"
import $default from "./json-example/$schema.default.json"
import Default from "./json-example/default.json" // 注意 小写 default 保留字

import $dataFacility from "./json-example/$schema.dataFacility.json"
import dataFacility from "./json-example/dataFacility.json"

import $dataTechTree from "./json-example/$schema.dataTechTree.json"
import dataTechTree from "./json-example/dataTechTree.json"

import $items from "./json-example/$schema.items.json"
import items from "./json-example/items.json"

import $basic from "./json-example/$schema.basic.json"
import basic from "./json-example/basic.json"

import $simple from "./json-example/$schema.simple.json"
import simple from "./json-example/simple.json"

import meta from "./json-example/$meta.json"

const examples = [
  ['基础', basic, $basic],
  ['一系列测试', general, $general],
  ['小型示例', Default, $default],
  ['简单示例', simple, $simple],
  ['模式编辑', $default, meta],
  ['元模式自编辑', meta, meta],
  ['《星际探索者》设施配置示例', dataFacility, $dataFacility],
  ['《星际探索者》设施配置模式编辑', $dataFacility, meta],
  ['《星际探索者》科技树示例', dataTechTree, $dataTechTree],
  ['《星际探索者》科技树配置模式编辑', $dataTechTree, meta],
  ['RMMZ 物品数据示例', items, $items],
]

/**
 * 节流：设置 func 在 interval 时间内只执行一次。  
 * 函数会随依赖改变，且保证组件卸载等情况下，函数可以跟进执行最后一次。
 * @param func 
 * @param interval 
 * @param deps 
 * @returns 
 */
const useCooldown = <T extends (...args: any[]) => void>(
  func: T,
  interval = 1,
  deps: React.DependencyList
): T => {
  let cd = 0 
  let newArgs = undefined as undefined | any[]
  const rf = (...args: any[]) => {
    if (cd === 0) {
      func(...args)
      cd = setTimeout(() => {
        if (newArgs) func(...newArgs)
        newArgs = undefined
        cd = 0
      }, interval)
    } else {
      newArgs = args
    }
  }
  // 在组件卸载时，清除计时器
  useEffect(() => {
    // 不加载，只清除
    return () => {
      if (cd) {
        clearTimeout(cd)
        if (newArgs) func(...newArgs)
      }
    }
  }, deps)

  return useCallback(rf as T, deps)
}

// 接下来是示例选择功能的定义
const options = examples.map((example, i) => {
  return { label: example[0], value: i.toString() }
}) as unknown as { label: string; value: string }[]

const ModalSelect = (props: { cb: (data: any, schema: any) => void, cancelCb: () => void, visible: boolean}) => {
  const {cb, cancelCb, visible} = props
  const [item, setItem] = useState(0)

  return (
    <Modal
      title="选择示例"
      okText="选择"
      cancelText="取消"
      onOk={() => {
        const data = cloneDeep(examples[item][1]), schema = cloneDeep(examples[item][2])
        cb(data, schema)
      }}
      onCancel={() => {
        cancelCb()
      }}
      visible={visible}
    >
      <Select
        showSearch
        placeholder="选择示例"
        optionFilterProp="label"
        onChange={(value) => {
          setItem(parseInt(value))
        }}
        filterOption={(input, option) => {
          return !!option && option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
        }}
        defaultValue={'0'}
        options={options}
        style={{width: "100%"}}
      />
    </Modal>
  )
}

// 从 localhost 读取 json
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

  const [data, setData] = useState(() => loadLocalJson("data") ?? cloneDeep(examples[0][1]))
  const [schema, setSchema] = useState(() => loadLocalJson("schema") ?? cloneDeep(examples[0][2]))

  const dataEditor = useRef<MonacoEditor>(null)
  const schemaEditor = useRef<MonacoEditor>(null)

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
        localStorage.setItem("data", JSON.stringify(data))
        localStorage.setItem("schema", JSON.stringify(schema))
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
        const dataCode = dataEditor.current?.editor?.getValue() ?? "{}"
        const schemaCode = schemaEditor.current?.editor?.getValue() ?? "{}"
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

  return (
    <div style={{ height: "100vh", overflow: "auto", display: "flex", flexDirection: "column" }}>
      <PageHeader
        title="JSON Editor"
        className="site-page-header"
        subTitle="By FurtherBank"
        extra={[
          <Button key="2" onClick={changeMode}>
            {mode ? "返回编辑器" : "源代码编辑"}
          </Button>,
          <Button key="1" type="primary" onClick={showModal}>
            加载示例
          </Button>,
        ]}
      ></PageHeader>
      {mode ? (
        <div style={{ display: "flex", overflow: "auto", justifyContent: "stretch", flex: 1 }}>
          <Card title="data" style={{ flex: 1, display: "flex", flexDirection: "column" }} bodyStyle={{ flex: 1 }}>
            <MonacoEditor
              language="json"
              theme="vs"
              value={JSON.stringify(data, null, 2)}
              ref={dataEditor}
              options={{
                automaticLayout: true,
                formatOnPaste: true,
                formatOnType: true,
                renderLineHighlight: "none",
                autoClosingOvertype: "always",
                cursorStyle: "line",
                quickSuggestions: false,
                scrollBeyondLastLine: false,
                snippetSuggestions: "none",
                minimap: {
                  enabled: true,
                },
              }}
            />
          </Card>
          <Card title="schema" style={{ flex: 1, display: "flex", flexDirection: "column" }} bodyStyle={{ flex: 1 }}>
            <MonacoEditor
              language="json"
              theme="vs"
              value={JSON.stringify(schema, null, 2)}
              ref={schemaEditor}
              options={{
                automaticLayout: true,
                formatOnPaste: true,
                formatOnType: true,
                renderLineHighlight: "none",
                autoClosingOvertype: "always",
                cursorStyle: "line",
                quickSuggestions: false,
                scrollBeyondLastLine: false,
                snippetSuggestions: "none",
                minimap: {
                  enabled: true,
                },
              }}
            />
          </Card>
        </div>
      ) : (
        <JsonSchemaEditor data={data} schema={schema as any} onChange={changeData} />
      )}
      <ModalSelect cb={changeExample} cancelCb={handleCancel} visible={isModalVisible}/>
    </div>
  )
}

