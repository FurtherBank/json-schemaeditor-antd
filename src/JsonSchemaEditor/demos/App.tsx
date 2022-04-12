/**
 * title: JsonSchemaEditor demo
 * desc: 可以自行查看示例、编辑，并从 monaco-editor 协助编辑 json 和 schema！点击左下角 `Open in new tab` 获取最佳编辑体验！
 * compact: true
 */
import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import _, { cloneDeep } from 'lodash';

import { Button, Card, PageHeader, message, Modal, Select } from 'antd'; // 用 antd 封装demo
import MonacoEditor from 'react-monaco-editor/lib/editor';

import JsonSchemaEditor from 'json-schemaeditor-antd';
import examples from './examples';
import { useCooldown } from './hooks';
import ModalSelect from './ModalSelect';

// 从 localhost 读取 json
const loadLocalJson = (key: string) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : undefined;
  } catch (error) {
    return undefined;
  }
};

// app 最终定义
export default () => {
  const [mode, setMode] = useState(0);

  const [data, setData] = useState(() => loadLocalJson('data') ?? cloneDeep(examples[0][1]));
  const [schema, setSchema] = useState(() => loadLocalJson('schema') ?? cloneDeep(examples[0][2]));

  const dataEditor = useRef<MonacoEditor>(null);
  const schemaEditor = useRef<MonacoEditor>(null);

  const [isModalVisible, setIsModalVisible] = useState(false);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  // 自动保存
  // 注：开发模式会渲染两次，这里就会保存两遍。生产模式没事
  const save = useCooldown(
    (data, schema) => {
      try {
        localStorage.setItem('data', JSON.stringify(data));
        localStorage.setItem('schema', JSON.stringify(schema));
      } catch (error) {
        console.error(error);
      }
    },
    1000,
    [],
  );

  useMemo(() => {
    save(data, schema);
  }, [data, schema]);

  const changeData = (value: any) => {
    setData(typeof value === 'object' ? value : value);
  };

  const changeExample = (data: any, schema: any) => {
    setData(data);
    setSchema(schema);
    setIsModalVisible(false);
  };

  const changeMode = () => {
    if (mode) {
      try {
        // get code
        const dataCode = dataEditor.current?.editor?.getValue() ?? '{}';
        const schemaCode = schemaEditor.current?.editor?.getValue() ?? '{}';
        // parse json code
        const newData = JSON.parse(dataCode),
          newSchema = JSON.parse(schemaCode);
        setData(newData);
        setSchema(newSchema);
        setMode(0);
      } catch (error) {
        message.error(
          `JSON 数据 或者 JSON JSONSchema6 解析出错，请检查代码编辑器中的数据是否正确。`,
        );
      }
    } else {
      setMode(1);
    }
  };

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
          </Button>,
        ]}
      ></PageHeader>
      {mode ? (
        <div style={{ display: 'flex', overflow: 'auto', justifyContent: 'stretch', flex: 1 }}>
          <Card
            title="data"
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            bodyStyle={{ flex: 1 }}
          >
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
                  enabled: true,
                },
              }}
            />
          </Card>
          <Card
            title="schema"
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            bodyStyle={{ flex: 1 }}
          >
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
                  enabled: true,
                },
              }}
            />
          </Card>
        </div>
      ) : (
        <JsonSchemaEditor data={data} schema={schema as any} onChange={changeData} />
      )}
      <ModalSelect cb={changeExample} cancelCb={handleCancel} visible={isModalVisible} />
    </div>
  );
};
