import { Card, Collapse, Space } from 'antd'
import React from 'react'
import { getFormatType, maxCollapseLayer } from '../../../definition'
import { useMenuActionComponents } from '../../core/hooks/useMenuActionComponents'
import { jsonDataType, concatAccess, getAccessRef } from '../../../utils'
import { ContainerProps } from '../../core/type/props'

const { Panel } = Collapse

const stopBubble = (e: React.SyntheticEvent) => {
  e.stopPropagation()
}

export const FieldContainerNormal = (props: ContainerProps) => {
  const { data, route, field, fieldDomId, titleComponent, valueComponent, fieldInfo } = props
  const { mergedValueSchema } = fieldInfo

  const dataType = jsonDataType(data)
  const access = concatAccess(route, field)

  const [operationComponents, menuActionComponents] = useMenuActionComponents(props)

  const { format } = mergedValueSchema || {}
  const formatType = getFormatType(format)

  const dataIsObject = dataType === 'object' || dataType === 'array'
  const canCollapse = dataIsObject && access.length > 0
  const editionIsMultiline = dataIsObject || formatType === 2

  return canCollapse ? (
    <Collapse
      defaultActiveKey={access.length < maxCollapseLayer ? ['theoneandtheonly'] : undefined}
      className="cpu-field"
    >
      <Panel
        key="theoneandtheonly"
        header={titleComponent}
        extra={<Space onClick={stopBubble}>{operationComponents.concat(menuActionComponents)}</Space>}
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
          {operationComponents.concat(menuActionComponents)}
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
