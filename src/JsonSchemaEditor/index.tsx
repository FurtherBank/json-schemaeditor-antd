import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import Field from './Field';
import {
  ajvInstance,
  itemSchemaCache,
  ofSchemaCache,
  propertySchemaCache,
  reducer,
} from './reducer';
import FieldDrawer from './FieldDrawer';
import { Alert } from 'antd';

import './css/index.less';
import _ from 'lodash';
import { JSONSchema6 } from 'json-schema';

interface EditorProps {
  onChange?: (data: any) => void | null;
  data?: any;
  schema: JSONSchema6 | true;
}
export const CacheContext = React.createContext({
  ofCache: new Map(),
  propertyCache: new Map(),
  itemCache: new Map(),
  rootSchema: {},
} as ContextContent);

export interface ContextContent {
  ofCache: Map<string, ofSchemaCache | null>;
  propertyCache: Map<string, propertySchemaCache | null>;
  itemCache: Map<string, itemSchemaCache | null>;
  rootSchema: JSONSchema6;
}

export interface SchemaCache extends ContextContent {
  entrySchemaMap: Map<string, boolean | JSONSchema6>;
  valueEntry: string | undefined;
  valueSchemaMap: Map<string, boolean | JSONSchema6>;
}

const emptyArray: never[] = [];

const Editor = (props: EditorProps, ref: React.ForwardedRef<any>) => {
  const { schema, data, onChange } = props;

  // useMemo 编译 schema
  const validate = useMemo(() => {
    let validate = undefined;
    let schemaErrors = null;

    console.time('compile schema');
    try {
      validate = ajvInstance.compile(schema);
    } catch (error) {
      schemaErrors = error;
    }
    console.timeEnd('compile schema');

    return validate ? validate : schemaErrors;
  }, [schema]) as Function | any;

  // useMemo 初始化 store
  const store = useMemo(() => {
    const initialState = {
      data: data,
      dataErrors: [],
      validate: typeof validate === 'function' ? validate : undefined,
    };

    const store = createStore(reducer, {
      past: [],
      present: initialState,
      future: [],
    });

    const change = () => {
      const changedData = store.getState().present.data;
      if (onChange && typeof onChange == 'function') {
        onChange(changedData);
      }
    };
    store.subscribe(change);

    return store;
  }, [schema]);

  // 暴露一下 api
  useImperativeHandle(
    ref,
    () => {
      return store;
    },
    [store],
  );

  const caches = useMemo(() => {
    console.log('caches变化');
    return {
      ofCache: new Map(),
      propertyCache: new Map(),
      itemCache: new Map(),
      rootSchema: validate instanceof Function ? (typeof schema !== 'boolean' ? schema : {}) : {},
    };
  }, [schema]);

  // 如果 data 更新来自外部，通过 setData 与 store 同步
  const presentData = store.getState().present.data;
  if (data !== presentData) {
    console.log('检测到外部更新：', data, presentData);
    store.dispatch({
      type: 'setData',
      value: data,
    });
  }

  // 详细抽屉功能
  const drawerRef = useRef(null) as React.RefObject<any>;
  const setDrawer = useCallback(
    (...args: any[]) => {
      console.log('setDrawer', drawerRef.current);
      if (drawerRef.current) drawerRef.current.setDrawer(...args);
    },
    [drawerRef],
  );

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
  );
};

export default React.memo(forwardRef(Editor));
