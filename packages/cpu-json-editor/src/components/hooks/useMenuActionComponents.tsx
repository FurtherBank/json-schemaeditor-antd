import React from 'react'
import { ContainerProps } from '../type/props'
import { getRefByOfChain } from '../../context/ofInfo'
import { getDefaultValue, defaultTypeValue } from '../../definition/defaultValue'
import { JsonTypes } from '../../definition/reducer'
import { jsonDataType } from '../../utils'

/**
 * [业务]通过 Field 的属性得到使用的 菜单栏 和 操作栏 组件
 * @param props
 */
export const useMenuActionComponents = (props: ContainerProps) => {
  const { data, route, field, schemaEntry, fieldInfo, availableMenuActions, menuActionHandlers } = props
  const { mergedValueSchema, ofOption, ctx } = fieldInfo

  const dataType = jsonDataType(data)
  const { const: constValue, enum: enumValue, type: allowedTypes } = mergedValueSchema || {}
  const valueType = constValue !== undefined ? 'const' : enumValue !== undefined ? 'enum' : dataType
  const directActionComs: JSX.Element[] = []
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
          ctx.executeAction('change', { route, field, value: defaultValue, schemaEntry })
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
          ctx.executeAction('change', { route, field, value: defaultTypeValue[value], schemaEntry })
        }}
        key={'type'}
      />
    )
  }
  // 4. 设置菜单动作栏组件
  const menuActionComs = availableMenuActions.map((actType) => {
    const MenuActionComponent = ctx.getComponent(null, ['menuAction'])
    return <MenuActionComponent key={actType} opType={actType} opHandler={menuActionHandlers[actType]} />
  })

  return [directActionComs, menuActionComs] as const
}
