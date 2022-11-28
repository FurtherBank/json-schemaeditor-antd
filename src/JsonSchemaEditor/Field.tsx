/* eslint-disable @typescript-eslint/no-shadow */
import React, { useContext, useMemo } from 'react'
import { EllipsisOutlined } from '@ant-design/icons'

import { Button, Card, Collapse, Input, Space, Menu, Dropdown } from 'antd'
import { connect, useSelector } from 'react-redux'
import {
  canDelete,
  defaultTypeValue,
  getDefaultValue,
  getFormatType,
  getValueEntry,
  maxCollapseLayer
} from './definition'
import { doAction, JsonTypes, ShortOpt, State } from './definition/reducer'
import { concatAccess, jsonDataType, getError, getAccessRef, pathGet } from './utils'
import { FatherInfo } from './components/edition/ListEdition'
import { InfoContext } from '.'
import { StateWithHistory } from 'redux-undo'
import { getRefByOfChain } from './context/ofInfo'
import { Act } from './definition/reducer'
import CpuEditorContext from './context'
import { MergedSchema } from './context/mergeSchema'
import { MenuActionType } from './menu/MenuActions'
const { Panel } = Collapse

export interface FieldProps {
  route: string[] // 只有这个属性是节点传的
  field?: string // route的最后
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

export interface IField {
  ctx: CpuEditorContext
  valueEntry: string | undefined
  mergedEntrySchema: MergedSchema | false
  mergedValueSchema: MergedSchema | false
  ofOption: string | false | null
  errors: any[]
  doAction: (type: string, route?: string[], field?: any, value?: any) => Act
}

/**
 * 求得该 Field 允许的动作空间。
 * 注意：输出动作的顺序要满足 MenuActions 中数组定义的顺序
 * @param props
 * @param fieldInfo
 * @returns
 */
const menuActionSpace = (props: FieldProps, fieldInfo: IField) => {
  const { fatherInfo, field, short } = props
  const { ctx, mergedValueSchema, errors } = fieldInfo
  const { const: constValue, enum: enumValue } = mergedValueSchema || {}

  const result: MenuActionType[] = []

  // 如果是根节点，那么加入撤销和恢复
  if (field === undefined) {
    result.push('undo')
    result.push('redo')
  }

  // 短优化时，如果有 const/enum 或者类型错误，加入detail
  const hasEnumOrConst = constValue !== undefined || enumValue !== undefined
  if (short && (hasEnumOrConst || errors.length > 0)) result.push('detail')

  // 父亲是数组，且自己的索引不超限的情况下，加入 move
  if (fatherInfo && fatherInfo.type === 'array') {
    const { items } = ctx.getMergedSchema(fatherInfo.valueEntry) || {}
    const length = typeof items === 'object' ? items.length : 0
    const index = parseInt(field!)
    if (index - 1 >= 0 && index !== length) result.push('moveup')
    if (index + 1 < fatherInfo.length! && index + 1 !== length) result.push('movedown')
  }

  // 如果父亲是对象/数组，且属性可删除，加入删除功能
  if (fatherInfo && fatherInfo.type) {
    if (canDelete(props, fieldInfo)) result.push('delete')
  }

  return result
}

const stopBubble = (e: React.SyntheticEvent) => {
  e.stopPropagation()
}

const FieldBase = (props: FieldProps) => {
  const { data, route, field, schemaEntry, short, setDrawer } = props

  // 这里单独拿出来是为防止 ts 认为是 undefined
  const doAction = props.doAction!

  const dataType = jsonDataType(data)
  const access = concatAccess(route, field)

  const ctx = useContext(InfoContext),
    { id } = ctx

  // 取 entrySchema、取 valueEntry 和 ofOption、取 valueSchema、取该 Field 下错误
  const mergedEntrySchema = useMemo(() => ctx.getMergedSchema(schemaEntry), [ctx, schemaEntry])

  const { valueEntry, ofOption } = useMemo(() => getValueEntry(data, schemaEntry, ctx), [data, schemaEntry, ctx])

  const mergedValueSchema = useMemo(() => ctx.getMergedSchema(valueEntry), [ctx, valueEntry])

  const dataErrors = useSelector<StateWithHistory<State>, any[]>((state: StateWithHistory<State>) => {
    return state.present.dataErrors
  })

  const errors = getError(dataErrors, access)

  // 整合 IField 信息
  const fieldInfo: IField = {
    ctx,
    mergedEntrySchema,
    valueEntry,
    mergedValueSchema,
    ofOption,
    errors,
    doAction
  }

  const space = menuActionSpace(props, fieldInfo)
  const { const: constValue, enum: enumValue, type: allowedTypes } = mergedValueSchema || {}
  const valueType = constValue !== undefined ? 'const' : enumValue !== undefined ? 'enum' : dataType

  const { format } = mergedValueSchema || {}

  const formatType = getFormatType(format)

  // 渲染排错
  if (dataType === 'undefined') {
    throw new Error(`undefined data error\n${access}\n${schemaEntry}\n${valueEntry}`)
  }
  // console.log("渲染", access.join('/'), data)

  // 1. 设置标题组件
  const TitleComponent = ctx.getComponent(null, ['title'])
  const titleCom = <TitleComponent {...props} fieldInfo={fieldInfo} />

  // 2. 设置值组件
  const EditionComponent =
    valueType === 'string' && format
      ? ctx.getFormatComponent(null, format)
      : ctx.getComponent(null, ['edition', valueType])
  const valueComponent = <EditionComponent {...props} fieldInfo={fieldInfo} key={'edition'} />

  const menuActionHandlers = useMemo(
    () => ({
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
      undo: () => {
        doAction('undo')
      },
      redo: () => {
        doAction('redo')
      },
      paste: () => {
        doAction('change', route, field, 0)
      }
    }),
    [route, field, doAction, setDrawer]
  )

  if (!short) {
    // 3. 先设置直属动作组件
    const directActionComs = []
    // a. 如果存在 oneOfOption，加入 oneOf 调整组件
    if (schemaEntry && ofOption !== null) {
      const ofInfo = ctx.getOfInfo(schemaEntry)!
      const OneOfOperation = ctx.getComponent(null, ['operation', 'oneOf'])
      directActionComs.push(
        <OneOfOperation
          opValue={ofOption ? ofOption : ''}
          opParam={ofInfo}
          opHandler={(value: string) => {
            const schemaRef = getRefByOfChain(ctx, schemaEntry!, value)
            const defaultValue = getDefaultValue(ctx, schemaRef, data)
            doAction('change', route, field, defaultValue)
          }}
          key={'oneOf'}
        />
      )
    }

    // b. 如果不是 const/enum，且允许多种 type，加入 type 调整组件
    if (
      valueType !== 'const' &&
      valueType !== 'enum' &&
      (mergedValueSchema === false || !allowedTypes || allowedTypes.length !== 1)
    ) {
      const typeOptions = allowedTypes && allowedTypes.length > 0 ? allowedTypes : JsonTypes
      const TypeOperation = ctx.getComponent(null, ['operation', 'type'])
      directActionComs.push(
        <TypeOperation
          opValue={dataType}
          opParam={typeOptions}
          opHandler={(value: string) => {
            doAction('change', route, field, defaultTypeValue[value])
          }}
          key={'type'}
        />
      )
    }
    // 4. 设置菜单动作栏组件
    const menuActionComs = space.map((actType) => {
      const MenuActionComponent = ctx.getComponent(null, ['menuAction'])
      return <MenuActionComponent key={actType} opType={actType} opHandler={menuActionHandlers[actType]} />
    })

    // 5. 为 object/array 设置子组件
    return dataType === 'object' || dataType === 'array' ? (
      <Collapse
        defaultActiveKey={access.length < maxCollapseLayer ? ['theoneandtheonly'] : undefined}
        className="cpu-field"
      >
        <Panel
          key="theoneandtheonly"
          header={titleCom}
          extra={<Space onClick={stopBubble}>{directActionComs.concat(menuActionComs)}</Space>}
          id={getAccessRef(access) || id}
        >
          {valueComponent}
        </Panel>
      </Collapse>
    ) : (
      <Card
        title={titleCom}
        size="small"
        extra={
          <Space>
            {formatType !== 2 ? valueComponent : null}
            {directActionComs.concat(menuActionComs)}
          </Space>
        }
        bodyStyle={formatType !== 2 ? { display: 'none' } : {}}
        id={getAccessRef(access) || id}
        className="cpu-field"
      >
        {formatType === 2 ? valueComponent : null}
      </Card>
    )
  } else {
    // 3. 设置动作菜单
    const menuAction = (e: { key: string }) => {
      const key = e.key as keyof typeof menuActionHandlers
      if (menuActionHandlers[key]) menuActionHandlers[key]()
    }

    const items = space.map((a) => {
      return <Menu.Item key={a}>{a}</Menu.Item>
    })
    const menu = <Menu onClick={menuAction}>{items}</Menu>

    const compact = valueType !== 'boolean'
    return (
      <div className="cpu-field" style={{ display: 'flex' }} id={getAccessRef(access) || id}>
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
          {valueComponent ? (
            valueComponent
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
    const path = field ? route.concat(field) : route

    return {
      data: pathGet(data, path)
    }
  },
  { doAction }
)(React.memo(FieldBase))

export default Field
