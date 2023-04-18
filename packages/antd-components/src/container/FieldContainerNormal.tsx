import { Card, Collapse, Space } from 'antd'
import React from 'react'
import { getFormatType } from '@cpu-studio/json-editor/src/definition/formats'
import { useMenuActionComponents } from '@cpu-studio/json-editor/src/components/hooks/useMenuActionComponents'
import { jsonDataType, concatAccess, getAccessRef } from '@cpu-studio/json-editor/src/utils'
import { ContainerProps } from '@cpu-studio/json-editor/src/components/type/props'
import { maxCollapseLayer } from '../config'

const { Panel } = Collapse

const stopBubble = (e: React.SyntheticEvent) => {
  e.stopPropagation()
}

export const FieldContainerNormal = (props: ContainerProps) => {
  const { data, route, field, fieldDomId, titleComponent, valueComponent, rootMenuItems = [], fieldInfo } = props
  const { mergedValueSchema } = fieldInfo

  const dataType = jsonDataType(data)
  const access = concatAccess(route, field)

  const [operationComponents, menuActionComponents] = useMenuActionComponents(props)

  const { format } = mergedValueSchema || {}
  const formatType = getFormatType(format)

  const dataIsObject = dataType === 'object' || dataType === 'array'
  const canCollapse = dataIsObject && access.length > 0
  const editionIsMultiline = dataIsObject || formatType === 2

  const extraComponents = operationComponents.concat(rootMenuItems).concat(menuActionComponents)

  return canCollapse ? (
    <Collapse
      defaultActiveKey={access.length < maxCollapseLayer ? ['theoneandtheonly'] : undefined}
      className="cpu-field"
    >
      <Panel
        key="theoneandtheonly"
        header={titleComponent}
        extra={<Space onClick={stopBubble}>{extraComponents}</Space>}
        id={getAccessRef(access) || fieldDomId}
      >
        {valueComponent}
      </Panel>
    </Collapse>
  ) : (
    <Card
      title={titleComponent}
      size="small"
      extra={
        <Space>
          {!editionIsMultiline ? valueComponent : null}
          {extraComponents}
        </Space>
      }
      bodyStyle={!editionIsMultiline ? { display: 'none' } : {}}
      id={getAccessRef(access) || fieldDomId}
      className="cpu-field"
    >
      {editionIsMultiline ? valueComponent : null}
    </Card>
  )
}
