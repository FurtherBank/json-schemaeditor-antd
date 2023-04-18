/* eslint-disable @typescript-eslint/no-shadow */
import React, { ComponentType, useContext, useMemo } from 'react'

import { connect, useSelector } from 'react-redux'
import { getValueEntry, ShortLevel } from './definition'
import { canFieldDelete } from './definition/schema'
import { CpuEditorState } from './definition/reducer'
import { concatAccess, jsonDataType, getAccessRef, deepGet } from './utils'
import { InfoContext } from './JsonSchemaEditor'
import { StateWithHistory } from 'redux-undo'
import CpuEditorContext from './context'
import { MergedSchema } from './context/mergeSchema'
import { MenuActionType } from './menu/MenuActions'
import { ContainerProps } from './components/core/type/props'
import { FatherInfo } from './components/core/type/list'
import { useMenuActionHandlers } from './components/hooks/useMenuActionHandlers'
import { ErrorObject } from 'ajv'

export interface FieldProps {
  viewport: string
  route: string[] // 只有这个属性是节点传的
  field?: string // route的最后
  fatherInfo?: FatherInfo
  schemaEntry?: string | undefined
  short?: ShortLevel // 可允许短字段等级
  canNotRename?: boolean | undefined
  rootMenuItems?: JSX.Element[]
  // redux props
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
}

/**
 * 求得该 Field 允许的动作空间。
 *
 * 注意：
 * 1. 输出动作的顺序要满足 MenuActions 中数组定义的顺序
 * 2. 该函数不依赖`data`
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

  // 如果 data 不满足要求，加入 reset
  if (errors.length > 0) result.push('reset')

  // 短优化时，如果有 const/enum 或者类型错误，加入detail
  const hasEnumOrConst = constValue !== undefined || enumValue !== undefined
  if (short && (hasEnumOrConst || errors.length > 0)) result.push('detail')

  // 父亲是数组，且自己的索引不超限的情况下，加入 move
  if (fatherInfo && fatherInfo.type === 'array') {
    const { prefixItems } = ctx.getMergedSchema(fatherInfo.valueEntry) || {}
    const length = prefixItems ? prefixItems.length : 0
    const index = parseInt(field!)
    if (index - 1 >= 0 && index !== length) result.push('moveup')
    if (index + 1 < fatherInfo.length! && index + 1 !== length) result.push('movedown')
  }

  // 如果父亲是对象/数组，且属性可删除，加入删除功能
  if (fatherInfo && fatherInfo.type) {
    if (canFieldDelete(props, fieldInfo)) result.push('delete')
  }

  return result
}

const FieldBase = (props: FieldProps) => {
  const { data, route, field, schemaEntry, short, fatherInfo } = props

  const dataType = jsonDataType(data)
  const access = concatAccess(route, field)

  const ctx = useContext(InfoContext)

  // 取 entrySchema、取 valueEntry 和 ofOption、取 valueSchema、取该 Field 下错误
  const mergedEntrySchema = useMemo(() => ctx.getMergedSchema(schemaEntry), [ctx, schemaEntry])

  const { valueEntry, ofOption } = useMemo(() => getValueEntry(data, schemaEntry, ctx), [data, schemaEntry, ctx])

  const mergedValueSchema = useMemo(() => ctx.getMergedSchema(valueEntry), [ctx, valueEntry])

  const errors = useSelector<StateWithHistory<CpuEditorState>, ErrorObject<string, Record<string, any>, unknown>[]>(
    (state: StateWithHistory<CpuEditorState>) => {
      const accessPath = '/' + access.join('/') // todo: 转义
      return state.present.dataErrors[accessPath] ?? []
    }
  )

  const { view: { type: schemaEntryViewType = null } = {} } = mergedEntrySchema || {}
  const { const: constValue, enum: enumValue, view: { type: valueEntryViewType = null } = {} } = mergedValueSchema || {}
  const valueType = constValue !== undefined ? 'const' : enumValue !== undefined ? 'enum' : dataType

  const { format } = mergedValueSchema || {}

  // 渲染排错
  if (dataType === 'undefined') {
    throw new Error(`undefined data error\naccess: ${access}\nschemaEntry: ${schemaEntry}\nvalueEntry: ${valueEntry}`)
  }
  // console.log("渲染", access.join('/'), data)

  // 整合 IField 信息
  const fieldInfo: IField = useMemo(
    () => ({
      ctx,
      mergedEntrySchema,
      valueEntry,
      mergedValueSchema,
      ofOption,
      errors
    }),
    [schemaEntry, valueEntry, errors, ctx]
  )

  // 菜单动作空间以及动作执行函数
  const space = useMemo(() => menuActionSpace(props, fieldInfo), [props, fieldInfo])
  const menuActionHandlers = useMenuActionHandlers(ctx, route, field, fatherInfo, schemaEntry, valueEntry, data)

  // 1. 设置标题组件
  const TitleComponent = ctx.getComponent(schemaEntryViewType, ['title'])
  const titleCom = <TitleComponent {...props} fieldInfo={fieldInfo} />

  // 2. 设置值组件
  const EditionComponent =
    valueType === 'string' && format
      ? ctx.getFormatComponent(valueEntryViewType, format)
      : ctx.getComponent(valueEntryViewType, ['edition', valueType])
  const valueComponent = <EditionComponent {...props} fieldInfo={fieldInfo} key={'edition'} />

  // 3. 取得并应用 container 组件
  const Container = ctx.getComponent(schemaEntryViewType, [
    short ? 'containerShort' : 'containerNormal'
  ]) as ComponentType<ContainerProps>

  return (
    <Container
      {...props}
      fieldInfo={fieldInfo}
      availableMenuActions={space}
      menuActionHandlers={menuActionHandlers}
      titleComponent={titleCom}
      valueComponent={valueComponent}
      fieldDomId={getAccessRef(access)}
    />
  )
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

const Field = connect((state: StateWithHistory<CpuEditorState>, props: FieldProps) => {
  const { route, field } = props
  const {
    present: { data }
  } = state

  // 得到确切访问路径，取得数据
  const path = field ? route.concat(field) : route

  return {
    data: deepGet(data, path)
  }
}, {})(React.memo(FieldBase))

export default Field
