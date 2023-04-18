import { EllipsisOutlined } from '@ant-design/icons'
import { Button, Dropdown, Input, Menu } from 'antd'
import React from 'react'
import { jsonDataType } from '../../../utils'
import { ContainerProps } from '../@cpu-studio/json-editor/type/props'

export const FieldContainerShort = (props: ContainerProps) => {
  const { data, fieldDomId, availableMenuActions, menuActionHandlers, titleComponent, valueComponent, fieldInfo } =
    props
  const { mergedValueSchema } = fieldInfo

  // 这里单独拿出来是为防止 ts 认为是 undefined

  const dataType = jsonDataType(data)
  const { const: constValue, enum: enumValue } = mergedValueSchema || {}

  const valueType = constValue !== undefined ? 'const' : enumValue !== undefined ? 'enum' : dataType

  const menuAction = (e: { key: string }) => {
    const key = e.key as keyof typeof menuActionHandlers
    if (menuActionHandlers[key]) menuActionHandlers[key]()
  }

  const items = availableMenuActions.map((a: string) => {
    return <Menu.Item key={a}>{a}</Menu.Item>
  })
  const menu = <Menu onClick={menuAction}>{items}</Menu>

  const compact = valueType !== 'boolean'
  return (
    <div className="cpu-field" style={{ display: 'flex' }} id={fieldDomId}>
      {titleComponent}
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
        {valueComponent}
        {items.length !== 0 ? (
          <Dropdown overlay={menu} placement="bottomRight" key="actions">
            <Button icon={<EllipsisOutlined />} size="small" shape="circle" />
          </Dropdown>
        ) : null}
      </Input.Group>
    </div>
  )
}
