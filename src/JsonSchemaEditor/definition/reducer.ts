/* eslint-disable @typescript-eslint/no-shadow */
import { ErrorObject } from 'ajv'
import localize from 'ajv-i18n/localize/zh'

import _ from 'lodash'
import produce from 'immer'
import undoable from 'redux-undo'
import CpuEditorContext from '../context'
import { processValidateErrors } from '../helper/validate-errors/processValidateErrors'

export interface CpuEditorAction {
  type: string
  route: string[]
  field?: string
  value?: any
  schemaEntry?: string
}

export interface CpuEditorState {
  data: any
  dataErrors: Record<string, ErrorObject<string, Record<string, any>, unknown>[]>
}

export const doAction = (
  type: string,
  schemaEntry: string | undefined,
  route: string[] = [],
  field: string | undefined = undefined,
  value: any = undefined
) => ({
  schemaEntry,
  type,
  route,
  field,
  value
})

export type CpuEditorActionDispatcher = typeof doAction

export const JsonTypes = ['object', 'array', 'string', 'number', 'boolean', 'null']

/**
 * 导出 editor 的 reducer 方法，其中可使用 ctx 闭包上下文
 * @param ctx
 * @returns
 */
export const getReducer = (ctx: CpuEditorContext) => {
  return undoable(
    produce(
      (s: CpuEditorState, a: CpuEditorAction) => {
        const { type, route, field, value, schemaEntry } = a
        const reValidate = (fieldValue: any, dataPath: string[] = []) => {
          const uri = ctx.schemaId + (schemaEntry || '')
          const validate = ctx.ajvInstance.getSchema(uri)
          if (typeof validate === 'function') {
            console.time('ajv 验证')

            validate(fieldValue)
            localize(validate.errors)

            // process errors into Instance path
            s.dataErrors = processValidateErrors(s.dataErrors, validate.errors || [], dataPath, schemaEntry)

            // if (validate.errors) {
            //   console.warn('not valid', validate.errors)
            // }
            console.timeEnd('ajv 验证')
          }
        }

        // 特殊接口：setData 强制设置数据，且不深拷贝
        if (type === 'setData') {
          s.data = value
          // revalidate
          reValidate(s.data)
          return
        }

        // 初始化
        if (!route) {
          // console.log('初始化验证', a);
          reValidate(s.data)
          return
        }

        let data = s.data // 注意这个变量一直是 s 子节点的一个引用
        for (const key of route) {
          data = data[key]
        }
        const fieldData = data

        const logError = (error: string) => {
          console.error(error, route.join('/') + '+' + field, value, fieldData)
        }

        // 初始化动作修改路径

        switch (type) {
          case 'create':
            if (!field) {
              logError('未指定field')
              return
            }
            if (fieldData instanceof Array) {
              // 给array push 一个新东西
              const index = parseInt(field!)
              fieldData[index] = value
            } else if (fieldData instanceof Object) {
              // 给对象创建新的属性
              if (!fieldData.hasOwnProperty(field)) {
                fieldData[field] = value
              }
            } else {
              logError('对非对象/数组的错误创建请求')
            }
            break
          case 'change': // change 是对非对象值的改变
            if (field === undefined) {
              s.data = _.cloneDeep(value)
            } else if (fieldData instanceof Array || fieldData instanceof Object) fieldData[field] = _.cloneDeep(value)
            else logError('对非对象/数组的字段修改请求')

            break
          case 'delete':
            if (!field) return

            if (fieldData instanceof Array) {
              // 注意数组删除，后面元素是要前移的
              const index = parseInt(field)
              _.remove(fieldData, (value: any, i: number) => i === index)
            } else if (fieldData instanceof Object) delete fieldData[field]
            else {
              logError('对非对象/数组的字段删除请求')
            }
            break
          case 'rename':
            if (!field || !value || field === value) break

            if (fieldData instanceof Object) {
              // todo: 严查value类型
              if (!fieldData.hasOwnProperty(value)) {
                fieldData[value!] = fieldData[field]
                delete fieldData[field]
              }
            } else {
              logError('对非对象的字段重命名请求')
            }
            break
          case 'moveup':
          case 'movedown':
            if (fieldData instanceof Array) {
              if (!field) return
              const index = parseInt(field)
              const swapIndex = type === 'moveup' ? index - 1 : index + 1
              if (swapIndex >= 0 && swapIndex < fieldData.length) {
                const temp = fieldData[index]
                fieldData[index] = fieldData[swapIndex]
                fieldData[swapIndex] = temp
              } else {
                logError('数组项越界移动')
              }
            } else logError('对非数组的移动请求')
            break
          default:
            logError('错误的动作请求')
        }
        // 重新验证
        const reValidateValue = type === 'change' && field !== undefined ? fieldData[field] : fieldData
        const reValidatePath = type === 'change' && field !== undefined ? route.concat(field) : route
        reValidate(reValidateValue, reValidatePath)
        return
      },
      {
        data: {},
        dataErrors: {}
      } as CpuEditorState
    ),
    {
      undoType: 'undo',
      redoType: 'redo',
      limit: 35
    }
  )
}
