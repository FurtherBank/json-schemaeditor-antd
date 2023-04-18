import { CloseCircleOutlined } from '@ant-design/icons'
import { Tooltip } from 'antd'
import React from 'react'
import { ShortLevel } from '@cpu-studio/json-editor/definition'
import { canFieldRename, isFieldRequired } from '@cpu-studio/json-editor/definition/schema'

import { CInput } from './base/cacheInput'
import { EditionProps } from '@cpu-studio/json-editor/type/props'

import './css/title.less'

const stopBubble = (e: React.SyntheticEvent) => {
  e.stopPropagation()
}

export const FieldTitle = (props: EditionProps) => {
  const { route, field, short, canNotRename, fatherInfo, fieldInfo } = props
  const { errors, mergedEntrySchema, ctx } = fieldInfo
  const { schemaEntry: parentSchemaEntry } = fatherInfo ?? {}
  const { description } = mergedEntrySchema || ({} as MergedSchema)

  const fieldNameRange = canFieldRename(props, fieldInfo)
  const titleName = fieldNameRange === '' || fieldNameRange instanceof RegExp ? field : fieldNameRange

  const isRequired = isFieldRequired(field, fatherInfo)

  const spaceStyle =
    short === ShortLevel.short
      ? {
          width: '9.5em'
        }
      : {}
  return (
    <div onClick={stopBubble} style={spaceStyle} className="flex-center">
      {errors.length > 0 ? (
        <Tooltip
          title={errors.map((error: { message: string }) => error.message).join('\n')}
          placement="topLeft"
          key="valid"
        >
          <CloseCircleOutlined style={{ color: 'red', marginRight: '0.25em', display: 'inline-block' }} />
        </Tooltip>
      ) : null}

      {short !== ShortLevel.extra ? (
        <Tooltip title={description} placement="topLeft" key="name">
          {!canNotRename && (fieldNameRange === '' || fieldNameRange instanceof RegExp) ? (
            <CInput
              size="small"
              bordered={false}
              className="prop-name-editable"
              title={field}
              value={field} // todo: validate the propertyName
              validate={(v) => {
                return fieldNameRange instanceof RegExp ? fieldNameRange.test(v) : true
              }}
              onPressEnter={(e: any) => {
                e.currentTarget.blur()
              }}
              onValueChange={(value) => {
                ctx.executeAction('rename', { route, field, value, schemaEntry: parentSchemaEntry })
              }}
            />
          ) : (
            <span className="prop-name inline-text-block" title={titleName!}>
              {isRequired ? <span style={{ color: 'orange', width: '0.75em', display: 'inline-block' }}>*</span> : null}
              {titleName}
            </span>
          )}
        </Tooltip>
      ) : null}
    </div>
  )
}
