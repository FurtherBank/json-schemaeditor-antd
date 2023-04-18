import { Input, Select } from 'antd'
import isEqual from 'lodash/isEqual'
import React, { useCallback } from 'react'
import { toConstName } from '@cpu-studio/json-editor/src/definition'
import { EditionProps } from '@cpu-studio/json-editor/src/components/type/props'

export const EnumEdition = (props: EditionProps) => {
  const {
    data,
    route,
    field,
    fieldInfo: { ctx, mergedValueSchema },
    schemaEntry
  } = props
  const { enum: enumValue = [] } = mergedValueSchema || {}

  const handleValueChange = useCallback(
    (key: string) => {
      const i = parseInt(key)
      const value = enumValue[i]

      if (value !== undefined) ctx.executeAction('change', { schemaEntry, route, field, value })
    },
    [ctx]
  )

  const enumIndex = enumValue.findIndex((v) => isEqual(v, data))

  return (
    <Input.Group compact style={{ display: 'flex', flex: 1 }}>
      <Select
        key="enum"
        size="small"
        options={enumValue.map((value: any, i: number) => {
          return {
            value: i,
            label: toConstName(value)
          }
        })}
        className="resolve-flex"
        style={{ flex: 1 }}
        onChange={handleValueChange}
        value={enumIndex === -1 ? '' : toConstName(enumValue[enumIndex])}
        allowClear={false}
      />
    </Input.Group>
  )
}
