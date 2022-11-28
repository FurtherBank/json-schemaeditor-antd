import { CloseCircleOutlined } from '@ant-design/icons'
import { Tooltip } from 'antd'
import React from 'react'
import { canSchemaRename, isFieldRequired } from '../definition'
import { doAction, ShortOpt } from '../definition/reducer'
import { CInput } from './base/cacheInput'
import { EditionProps } from './types'

const stopBubble = (e: React.SyntheticEvent) => {
  e.stopPropagation()
}

export const FieldTitle = (props: EditionProps) => {
  const { route, field, short, canNotRename, fatherInfo, fieldInfo } = props
  const { errors, mergedEntrySchema } = fieldInfo
  const { description } = mergedEntrySchema || {}

  const fieldNameRange = canSchemaRename(props, fieldInfo)
  const titleName = fieldNameRange === '' || fieldNameRange instanceof RegExp ? field : fieldNameRange

  const isRequired = isFieldRequired(field, fatherInfo)

  const spaceStyle =
    short === ShortOpt.short
      ? {
          width: '9.5em',
          display: 'flex',
          alignItems: 'center'
        }
      : {}
  return (
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
}
