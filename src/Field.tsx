import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';

import 'antd/dist/antd.compact.css';
import Button from 'antd/lib/button';
import Card from 'antd/lib/card';
import Collapse from 'antd/lib/collapse';
import Empty from 'antd/lib/empty';
import Input from 'antd/lib/input';
import InputNumber from 'antd/lib/input-number';
import List from 'antd/lib/list';
import Select from 'antd/lib/select';
import Space from 'antd/lib/space';
import Tooltip from 'antd/lib/tooltip';
import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import cacheInput from './utils/cacheInput';
import { maxCollapseLayer } from './FieldOptions';
import { doAction, JsonTypes } from './reducer';
import { concatAccess, jsonDataType } from './utils';
const { Panel } = Collapse

interface FieldProps {
  route: string[]; // 只有这个属性是节点传的
  field: string | null; // route的最后
  fatherInfo?: FatherInfo,
  // redux props
  editionName?: string;
  data?: any,
  reRender?: any
}
interface FatherInfo {
  type?: string; // 是父亲的实际类型，非要求类型
  length?: number; // 如果是数组，给出长度
  keys?: string[]
}

interface ChildData {
  key: string;
  value: any;
  end?: boolean;
}

const CInput = cacheInput(Input), CInputNumber = cacheInput(InputNumber)

const JsonTypeOptions = JsonTypes.map((value) => {
  return { value: value, label: value };
});

/**
 * 动作空间函数，理应有。
 * 注意：该函数输出的顺序影响侧栏动作按钮的顺序！
 */
const actionSpace = (props: FieldProps) => {
  const { fatherInfo, field, data } = props;
  const result = [];
  // 对象和数组 在schema允许的情况下可以 create
  if (data instanceof Array || data instanceof Object) {
    // todo: schema是否允许
    result.push('create');
  }


  // 父亲是对象，且属性名所在的schema判断名称可变时，加入 rename
  if (fatherInfo && fatherInfo.type === 'object') {
    // todo: 判断名称是否可以变
    result.push('rename');
  }

  // 父亲是数组，且自己的索引不超限的情况下，加入 move
  if (fatherInfo && fatherInfo.type === 'array') {
    const index = parseInt(field!);
    if (index - 1 >= 0) result.push('moveup');
    if (index + 1 < fatherInfo.length!) result.push('movedown');
  }
  // oneOf 可用时，加入oneOf

  // 如果类型可能性有多种，或者oneof，一定为卡片。
  // 如果类型可能性有多种，使用 'type' 切换属性
  result.push('type');

  // 如果父亲是对象/数组，且属性可删除，加入删除功能
  if (fatherInfo && fatherInfo.type) {
    // todo: 属性可删除判断
    result.push('delete');
  }

  return result;
};

const defaultTypeValue: any = {
  string: '',
  number: 0,
  object: {},
  array: [],
  null: null,
  boolean: false,
};

const stopBubble = (e: React.SyntheticEvent) => {
  e.stopPropagation()
}

const FieldBase = (props: FieldProps) => {
  const { data, route, field, editionName, doAction, fatherInfo } = props as any;
  const fieldName = field !== null ? field : editionName;
  const dataType = jsonDataType(data)
  const space = actionSpace(props);
  const access = concatAccess(route, field)
  if (dataType === 'undefined') {
    console.log('错误的渲染:', props);
    return null
  }
  console.log('渲染', route.join('/'), field, data);

  // 1. 设置标题组件
  const titleCom = (
    <Space onClick={stopBubble}>
      <Tooltip title="If has error show this haha" placement="topLeft">
        <CheckCircleOutlined
          className="site-result-demo-right-icon"
          style={{ color: 'green' }}
        />
      </Tooltip>

      <Tooltip title="The description of the schema." placement="topLeft">
        {space.indexOf('rename') >= 0 ? (
          <CInput
            size="small"
            bordered={false}
            style={{ textDecoration: 'underline' }}
            value={field}
            key={field} // 动态修改key，防止无法修改问题
            validate={(v) => { return fatherInfo.keys.indexOf(v) === -1 }}
            onPressEnter={(e: any) => {
              e.currentTarget.blur()
            }}
            onValueChange={(value) => {
              doAction('rename', route, field, value)
            }}
          />) : (
          <span>{fieldName}</span>
        )}
      </Tooltip>
    </Space>
  );

  // 2. 设置右上动作组件
  const sideActions = ['oneOf', 'moveup', 'movedown', 'delete', 'type'];
  const sideActionComSpace = (action: string) => {
    switch (action) {
      case 'oneOf':
        return <Select
          key="oneOf"
          size="small"
          options={[]} // todo
          onChange={(value, options) => { doAction('change', route, field, []) }} // todo
          value={'oneof'}
          allowClear={false}
        />
      case 'moveup':
        return <Button
          key="up"
          icon={<ArrowUpOutlined />}
          size="small"
          shape="circle"
          onClick={(e) => { doAction('moveup', route, field) }}
        />
      case 'movedown':
        return <Button
          key="down"
          icon={<ArrowDownOutlined />}
          size="small"
          shape="circle"
          onClick={(e) => { doAction('movedown', route, field) }}
        />
      case 'delete':
        return <Button
          key="delete"
          icon={<DeleteOutlined />}
          size="small"
          shape="circle"
          onClick={(e) => {
            doAction('delete', route, fieldName);
          }}
        />
      case 'type':
        return <Select
          key="type"
          size="small"
          options={JsonTypeOptions}
          onChange={(value, options) => {
            doAction('change', route, fieldName, defaultTypeValue[value]);
          }}
          value={dataType}
          allowClear={false}
          style={{ width: '80px' }}
        />
      default:
        break;
    }
  };
  const actionComKeys = space.filter((value) => {
    return sideActions.indexOf(value) >= 0;
  });
  const actionComs = actionComKeys.map((value) => sideActionComSpace(value));

  // 3. 设置标题内嵌值组件
  const getValueCom = (dataType: string) => {
    switch (dataType) {
      case 'string':
        return (
          <CInput
            size="small"
            key="value"
            value={data}
            validate
            onValueChange={(value) => {
              doAction('change', route, field, value);
            }}
            onPressEnter={(e: any) => {
              e.currentTarget.blur()
            }}
          />
        );
      case 'number':
        return (
          <CInputNumber
            size="small"
            key="value"
            value={data}
            validate
            onValueChange={(value) => {
              doAction('change', route, field, value);
            }}
            onPressEnter={(e: any) => {
              e.currentTarget.blur()
            }}
          />
        );
      case 'boolean':
        // todo
        break;
      case 'null':
        return <span>null</span>;
      default:
        return null
    }
  }
  const valueCom = getValueCom(dataType);

  // 4. 为 object/array 设置子组件
  let children: ChildData[] = [];
  let childFatherInfo: FatherInfo = {};
  if (dataType === 'array') {
    // todo: 短优化筛查并给出子组件
    childFatherInfo.type = 'array';
    childFatherInfo.length = data.length;

    children = data.map((value: any, i: number) => {
      return { key: i.toString(), value };
    });
  } else if (dataType === 'object') {
    childFatherInfo.type = 'object';
    childFatherInfo.keys = Object.keys(data)

    // todo: 分开查找可优化的项，然后按顺序排列
    for (let key in data) {
      const value = data[key];
      children.push({ key, value });
    }
  }
  // todo: 查验是否满足加属性条件
  if (childFatherInfo.type && space.indexOf('create') >= 0) {
    children.push({ end: true, key: '', value: '' });
  }
  const attributes = (
    <List
      key="row"
      size='small'
      split={false}
      dataSource={children}
      grid={{ gutter: 4, column: 1 }}
      pagination={children.length > 15 ? {
        simple: true,
        pageSize: 15,
      } : undefined}
      renderItem={(item) => {
        const { key, end } = item;
        if (!end)
          return (
            <List.Item key={key}>
              <Field
                route={access}
                field={key}
                key={key}
                fatherInfo={childFatherInfo.type ? childFatherInfo : undefined}
              />
            </List.Item>
          );
        else
          return (
            <List.Item key="一个不能作为对象索引的文字?">
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                size="small"
                block
                onClick={() => {
                  doAction('create', access); // todo
                }}
              >
                {dataType === 'array' ? 'Item' : 'Property'}
              </Button>
            </List.Item>
          );
      }}
    />
  );

  return dataType === 'object' || dataType === 'array' ? (
    <Collapse defaultActiveKey={access.length < maxCollapseLayer ? ['theoneandtheonly'] : undefined}>
      <Panel key='theoneandtheonly' header={titleCom} extra={
        <Space onClick={stopBubble}>
          {valueCom}
          {actionComs}
        </Space>
      }>
        {children.length > 0 ? attributes : null}
      </Panel>
    </Collapse>
  ) : (
    <Card
      title={titleCom}
      size="small"
      extra={
        <Space>
          {valueCom}
          {actionComs}
        </Space>
      }
      bodyStyle={children.length > 0 ? {} : { display: 'none' }}
    >
      {children.length > 0 ? attributes : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
    </Card>
  );
};

/**
 * 注意，如果一个组件使用自己且使用 react-redux 链接，请注意不要重名！
 */

const Field = React.memo(connect(
  (state: State, props: FieldProps) => {
    const { route, field } = props;
    const { data, editionName, lastChangedRoute, lastChangedField } = state;

    // 得到确切访问路径，取得数据
    const access = field != null ? route.concat([field]) : route;
    let targetData = data
    access.forEach((key) => {
      targetData = targetData[key];
    });

    // 根据上次动作给出的渲染路径 判断
    const reRender = lastChangedRoute !== null && (_.isEqual(access, lastChangedRoute) || (_.isEqual(route, lastChangedRoute) && lastChangedField.indexOf(field!) > -1))
    if (reRender) {
      console.log(access)
    };

    return {
      data: targetData,
      editionName,
      reRender: reRender ? {} : null  // 本来在 areEqual 之前还有一个浅比较：相等一定不渲染。这里true用一个空对象(变引用)就可以解决这一个问题
    };
  },
  { doAction }
)(FieldBase), (prevProps, nextProps) => {
  return !nextProps.reRender
});
export default Field


