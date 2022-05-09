/* eslint-disable @typescript-eslint/no-shadow */
import React, { useContext, useMemo } from 'react'
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EllipsisOutlined,
  RedoOutlined,
  UndoOutlined
} from '@ant-design/icons'

import {
  Button,
  Card,
  Collapse,
  Input,
  InputNumber,
  TreeSelect,
  Space,
  Tooltip,
  Select,
  Switch,
  Menu,
  Dropdown
} from 'antd'
const { TextArea } = Input
import _ from 'lodash'
import { connect, useSelector } from 'react-redux'
import cacheInput from './utils/cacheInput'
import {
  canDelete,
  canSchemaCreate,
  canSchemaRename,
  defaultTypeValue,
  getDefaultValue,
  getFormatType,
  isFieldRequired,
  maxCollapseLayer,
  toConstName
} from './FieldOptions'
import { doAction, JsonTypes, ShortOpt, State } from './reducer'
import {
  absorbProperties,
  concatAccess,
  exactIndexOf,
  getRefSchemaMap,
  jsonDataType,
  getError,
  getAccessRef
} from './utils'
import FieldList, { FatherInfo } from './FieldList'
import { InfoContext, SchemaCache } from '.'
import { StateWithHistory } from 'redux-undo'
import { getOfOption, getRefByOfChain, ofSchemaCache, setOfCache } from './info/ofInfo'
import { setPropertyCache, setItemCache } from './info/valueInfo'
import { Act } from './reducer'
const { Panel } = Collapse

export interface FieldProps {
  route: string[] // 只有这个属性是节点传的
  field: string | null // route的最后
  fatherInfo?: FatherInfo
  schemaEntry?: string | undefined
  short?: ShortOpt // 可允许短字段等级
  setDrawer?: (...args: any[]) => void
  canNotRename?: boolean | undefined
  // redux props
  doAction?: (type: string, route?: string[], field?: any, value?: any) => Act
  data?: any
  reRender?: any
}

const CInput = cacheInput(Input),
  CInputNumber = cacheInput(InputNumber),
  CTextArea = cacheInput(TextArea)

const sideActions = ['detail', 'undo', 'redo', 'moveup', 'movedown', 'oneOf', 'type', 'delete']
/**
 * 动作空间函数，理应有。
 * 注意：该函数输出的顺序影响侧栏动作按钮的顺序！
 */
const actionSpace = (props: FieldProps, schemaCache: SchemaCache, errors: any | undefined) => {
  const { fatherInfo, field, data, schemaEntry, short } = props
  const { ofCache, entrySchemaMap, valueSchemaMap } = schemaCache
  const dataType = jsonDataType(data)
  const schemas = []
  for (const iterator of entrySchemaMap!.values()) {
    schemas.push(iterator)
  }
  const hasFalse = schemas.includes(false)
  const result = new Map()
  // 对象和数组 在 schema 允许的情况下可以 create
  if (dataType === 'array' || dataType === 'object') {
    const autoCompleteFields = canSchemaCreate(props, schemaCache)
    if (autoCompleteFields) result.set('create', autoCompleteFields)
  }

  // 父亲是数组，且自己的索引不超限的情况下，加入 move
  if (fatherInfo && fatherInfo.type === 'array') {
    const index = parseInt(field!)
    if (index - 1 >= 0) result.set('moveup', true)
    if (index + 1 < fatherInfo.length!) result.set('movedown', true)
  }

  // 先看有没有 Of
  const ofCacheValue = schemaEntry ? ofCache.get(schemaEntry) : undefined
  if (ofCacheValue) {
    result.set('oneOf', ofCacheValue)
  }

  // 然后根据 valueEntry 看情况
  const constSchema = absorbProperties(valueSchemaMap, 'const') as any | undefined
  const enums = absorbProperties(valueSchemaMap, 'enum') as any[] | undefined
  if (constSchema !== undefined) {
    result.set('const', constSchema)
  } else if (enums !== undefined) {
    result.set('enum', enums)
  } else {
    // 如果类型可能性有多种，使用 'type' 切换属性
    const types = absorbProperties(valueSchemaMap, 'type')
    if (hasFalse || types.length !== 1) {
      result.set('type', types.length > 0 ? types : JsonTypes)
    }
  }

  // 短优化时，如果有 const/enum 或者类型错误，加入detail
  if (short && (result.has('const') || result.has('enum') || errors.length > 0)) result.set('detail', true)

  // 如果父亲是对象/数组，且属性可删除，加入删除功能
  if (fatherInfo && fatherInfo.type) {
    if (canDelete(props, schemaCache)) result.set('delete', true)
  }

  // 如果是根节点，那么加入撤销和恢复
  if (field === null) {
    result.set('undo', true)
    result.set('redo', true)
  }
  return result
}

const stopBubble = (e: React.SyntheticEvent) => {
  e.stopPropagation()
}

const FieldBase = (props: FieldProps) => {
  const { data, route, field, schemaEntry, short, canNotRename, fatherInfo, setDrawer } = props

  const caches = useContext(InfoContext),
    { ofCache, propertyCache, itemCache, rootSchema, id } = caches

  // 读取路径上的 schemaMap
  const entrySchemaMap = useMemo(() => {
    return getRefSchemaMap(schemaEntry, rootSchema)
  }, [schemaEntry, caches])

  let valueEntry = undefined as undefined | string
  let ofOption: string | false | null | undefined = undefined
  if (schemaEntry) {
    // 设置 ofCache (use Entry map ,root)
    if (!ofCache.has(schemaEntry)) {
      setOfCache(ofCache, schemaEntry, entrySchemaMap, rootSchema)
    }
    // 确定 valueEntry
    ofOption = getOfOption(data, schemaEntry, caches)
    valueEntry =
      ofOption === null ? schemaEntry : ofOption === false ? undefined : getRefByOfChain(ofCache, schemaEntry, ofOption)
  }

  const valueSchemaMap = useMemo(() => {
    return getRefSchemaMap(valueEntry, rootSchema)
  }, [valueEntry, caches])

  if (valueEntry) {
    // 设置 propertyCache
    if (!propertyCache.has(valueEntry)) {
      setPropertyCache(propertyCache, valueEntry, valueSchemaMap, rootSchema)
    }
    // 设置 itemCache
    if (!itemCache.has(valueEntry)) {
      setItemCache(itemCache, valueEntry, valueSchemaMap, rootSchema)
    }
  }

  const schemaCache = {
    ofCache,
    propertyCache,
    itemCache,
    rootSchema,
    valueEntry,
    valueSchemaMap,
    entrySchemaMap
  }
  // 这里单独拿出来是为防止 ts 认为是 undefined
  const doAction = props.doAction!

  const dataType = jsonDataType(data)
  const access = concatAccess(route, field)

  const dataErrors = useSelector<StateWithHistory<State>, any[]>((state: StateWithHistory<State>) => {
    return state.present.dataErrors
  })

  const errors = getError(dataErrors, access)

  const space = actionSpace(props, schemaCache, errors)
  const valueType = space.has('const') ? 'const' : space.has('enum') ? 'enum' : dataType

  const description = absorbProperties(entrySchemaMap!, 'description')
  const fieldNameRange = canSchemaRename(props, schemaCache)
  const itemCacheValue = itemCache.get(valueEntry!)

  const format = absorbProperties(valueSchemaMap!, 'format')
  const formatType = getFormatType(format)
  const entryTypes = absorbProperties(entrySchemaMap!, 'type')

  // 渲染排错
  if (dataType === 'undefined') {
    return null
  }
  // console.log("渲染", access.join('/'), data)

  // 1. 设置标题组件
  const spaceStyle =
    short === ShortOpt.short
      ? {
          width: '9.5em',
          display: 'flex',
          alignItems: 'center'
        }
      : {}
  const titleName = fieldNameRange === '' || fieldNameRange instanceof RegExp ? field : fieldNameRange
  const isRequired = isFieldRequired(field, fatherInfo)
  const titleCom = (
    <div onClick={stopBubble} style={spaceStyle}>
      {errors.length > 0 ? (
        <Tooltip
          title={errors.map((error: { message: string }) => error.message).join('\n')}
          placement="topLeft"
          key="valid"
        >
          <CloseCircleOutlined style={{ color: 'red', marginRight: '0.25em' }} />
        </Tooltip>
      ) : null}

      {short !== ShortOpt.extra ? (
        <Tooltip title={description} placement="topLeft" key="name">
          {!canNotRename && (fieldNameRange === '' || fieldNameRange instanceof RegExp) ? (
            <CInput
              size="small"
              bordered={false}
              className="prop-name"
              title={field}
              value={field} // todo: validate the propertyName
              validate={(v) => {
                return fieldNameRange instanceof RegExp ? fieldNameRange.test(v) : true
              }}
              onPressEnter={(e: any) => {
                e.currentTarget.blur()
              }}
              onValueChange={(value) => {
                doAction('rename', route, field, value)
              }}
            />
          ) : (
            <span style={{ width: '100px' }} title={titleName!}>
              {isRequired ? <span style={{ color: 'orange', width: '0.75em', display: 'inline-block' }}>*</span> : null}
              {titleName}
            </span>
          )}
        </Tooltip>
      ) : null}
    </div>
  )

  const valueChangeAction = (value: any) => {
    doAction('change', route, field, value)
  }

  // 2. 设置值组件

  const getStringFormatCom = (format: string) => {
    const allUsedProps = {
      size: 'small',
      key: 'value',
      value: data,
      onValueChange: valueChangeAction,
      validate: true,
      onPressEnter: (e: any) => {
        e.currentTarget.blur()
      }
    }
    switch (format) {
      case 'multiline':
        // 所有需要使用 textarea 输入的格式用这个
        return (
          <CTextArea
            {...allUsedProps}
            style={{ flex: 1 }}
            autoSize={{ minRows: 3, maxRows: 5 }}
            onPressEnter={undefined}
          />
        )
      case 'row':
      case 'uri':
      case 'uri-reference':
        // 所有使用 row 输入的格式，用这个
        return <CInput {...allUsedProps} style={{ flex: 1, minWidth: '400px' }} />
      default:
        return <CInput {...allUsedProps} style={{ flex: 1 }} />
    }
  }
  const getValueCom = (valueType: string) => {
    switch (valueType) {
      case 'const':
        // const equalConst = _.isEqual(data, space.get('const'));
        return (
          <Space style={{ flex: 1 }}>
            <Input key="const" size="small" value={toConstName(data)} disabled allowClear={false} />
          </Space>
        )
      case 'enum':
        const enumIndex = exactIndexOf(space.get('enum'), data)
        return (
          <Input.Group compact style={{ display: 'flex', flex: 1 }}>
            <Select
              key="enum"
              size="small"
              options={space.get('enum').map((value: any, i: number) => {
                return {
                  value: i,
                  label: toConstName(value)
                }
              })}
              className="resolve-flex"
              style={{ flex: 1 }}
              onChange={(value) => {
                doAction('change', route, field, space.get('enum')[value])
              }}
              value={enumIndex === -1 ? '' : enumIndex}
              allowClear={false}
            />
          </Input.Group>
        )
      case 'string':
        return getStringFormatCom(format)
      case 'number':
        return (
          <CInputNumber
            size="small"
            key="value"
            value={data}
            validate
            onValueChange={valueChangeAction}
            onPressEnter={(e: any) => {
              e.target.blur()
            }}
            style={{ flex: 1 }}
          />
        )
      case 'boolean':
        return (
          <Switch
            checkedChildren="true"
            unCheckedChildren="false"
            checked={data}
            onChange={valueChangeAction}
            size="small"
          />
        )
      case 'null':
        return <span>null</span>
      default:
        return null
    }
  }
  const valueCom = getValueCom(valueType)

  const actionEvents = {
    detail: () => {
      if (setDrawer) setDrawer(route, field)
    },
    moveup: () => {
      doAction('moveup', route, field)
    },
    movedown: () => {
      doAction('movedown', route, field)
    },
    delete: () => {
      doAction('delete', route, field)
    },
    type: (value: string) => {
      doAction('change', route, field, defaultTypeValue[value])
    },
    undo: () => {
      doAction('undo')
    },
    redo: () => {
      doAction('redo')
    },
    copy: () => {
      // todo
    },
    paste: (value: string) => {
      doAction('change', route, field, defaultTypeValue[value])
    }
  } as any

  if (!short) {
    // 3. 设置右上动作栏组件(短优化后改为动作菜单)
    const sideActionComSpace = (action: string) => {
      const actionIcon = {
        moveup: <ArrowUpOutlined />,
        movedown: <ArrowDownOutlined />,
        delete: <DeleteOutlined />,
        undo: <UndoOutlined />,
        redo: <RedoOutlined />
      }
      switch (action) {
        case 'oneOf':
          const { options } = space.get('oneOf') as ofSchemaCache
          const ofIndex = ofOption || ' '
          return (
            <TreeSelect
              key="oneOf"
              size="small"
              treeData={options}
              onChange={(value) => {
                const schemaRef = getRefByOfChain(ofCache, schemaEntry!, value)
                const defaultValue = getDefaultValue(schemaCache, schemaRef, data)
                doAction('change', route, field, defaultValue)
              }}
              style={{ minWidth: '90px' }}
              dropdownMatchSelectWidth={180}
              value={ofIndex}
              allowClear={false}
            />
          )
        case 'type':
          return (
            <Select
              key="type"
              size="small"
              options={space.get('type').map((value: string) => {
                return { value: value, label: value }
              })}
              onChange={actionEvents.type}
              value={dataType}
              allowClear={false}
              style={{ width: '80px' }}
            />
          )
        case 'moveup':
        case 'movedown':
        case 'delete':
        case 'undo':
        case 'redo':
          return (
            <Button
              key={action}
              icon={actionIcon[action]}
              size="small"
              shape="circle"
              onClick={actionEvents[action]}
              title={action}
            />
          )
        default:
          return null
      }
    }
    const actionComKeys = sideActions.filter((value) => {
      return space.has(value)
    })
    const actionComs = actionComKeys.map((value) => sideActionComSpace(value))

    // 4. 为 object/array 设置子组件
    return access.length === 0 && dataType === 'array' && _.isEqual(entryTypes, ['array']) ? (
      <FieldList
        fieldProps={props}
        fieldCache={schemaCache}
        short={ShortOpt.no}
        canCreate={space.has('create')}
        view={'list'}
        id={getAccessRef(access) || id}
      />
    ) : dataType === 'object' || dataType === 'array' ? (
      <Collapse defaultActiveKey={access.length < maxCollapseLayer ? ['theoneandtheonly'] : undefined}>
        <Panel key="theoneandtheonly" header={titleCom} extra={<Space onClick={stopBubble}>{actionComs}</Space>}>
          <FieldList
            fieldProps={props}
            fieldCache={schemaCache}
            short={dataType === 'array' && itemCacheValue ? itemCacheValue.shortOpt : ShortOpt.no}
            canCreate={space.has('create')}
            id={getAccessRef(access) || id}
          />
        </Panel>
      </Collapse>
    ) : (
      <Card
        title={titleCom}
        size="small"
        extra={
          <Space>
            {formatType !== 2 ? valueCom : null}
            {actionComs}
          </Space>
        }
        bodyStyle={formatType !== 2 ? { display: 'none' } : {}}
        id={getAccessRef(access) || id}
      >
        {formatType === 2 ? valueCom : null}
      </Card>
    )
  } else {
    // 3. 设置动作菜单
    const menuAction = (e: { key: string }) => {
      const { key } = e
      if (typeof actionEvents[key] === 'function') actionEvents[key](e)
    }

    const items = sideActions
      .filter((v) => {
        return space.has(v)
      })
      .map((a) => {
        return <Menu.Item key={a}>{a}</Menu.Item>
      })
    const menu = <Menu onClick={menuAction}>{items}</Menu>

    const compact = valueType !== 'boolean'
    return (
      <div style={{ display: 'flex' }} id={getAccessRef(access) || id}>
        {titleCom}
        <Input.Group
          compact={compact}
          size="small"
          style={{
            display: 'flex',
            flex: 1,
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          {valueCom ? (
            valueCom
          ) : (
            <span
              style={{
                flex: 1,
                textAlign: 'center',
                textOverflow: 'ellipsis'
              }}
            >
              类型错误
            </span>
          )}
          {items.length !== 0 ? (
            <Dropdown overlay={menu} placement="bottomRight" key="actions">
              <Button icon={<EllipsisOutlined />} size="small" shape="circle" />
            </Dropdown>
          ) : null}
        </Input.Group>
      </div>
    )
  }
}

/**
 * 注意，如果一个组件使用自己且使用 react-redux 链接，请注意使用connect后的名字！
 */

// const checkMemoChange = (prevProps: any, nextProps: any) => {
//   // 这个函数可以用来 debug 渲染是否有问题
//   const { route, field } = nextProps;
//   const access = concatAccess(route, field).join('/');
//   let changed = false;
//   for (const key in prevProps) {
//     if (Object.prototype.hasOwnProperty.call(prevProps, key)) {
//       if (prevProps[key] !== nextProps[key]) {
//         changed = true;
//         console.log(
//           key,
//           '改变',
//           access ? access : '<root>',
//           isEqual(prevProps[key], nextProps[key]),
//         );
//       }
//     }
//   }
//   return !changed;
// };

const Field = connect(
  (state: StateWithHistory<State>, props: FieldProps) => {
    const { route, field } = props
    const {
      present: { data }
    } = state

    // 得到确切访问路径，取得数据
    const access = field !== null ? route.concat(field) : route
    let targetData = data
    access.forEach((key) => {
      targetData = targetData[key]
    })

    return {
      data: targetData
    }
  },
  { doAction }
)(React.memo(FieldBase))

export default Field
