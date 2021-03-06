import { Input, InputNumber, AutoComplete, AutoCompleteProps } from 'antd'
import React, { useState } from 'react'
const { TextArea } = Input

interface InputComProps {
  value?: any
  onChange?: (e: React.SyntheticEvent | any) => void
  onBlur?: (e: any) => void
  [k: string]: any
}

interface CachedComProps
  extends Pick<AutoCompleteProps, 'backfill' | 'defaultActiveFirstOption' | 'options' | 'filterOption' | 'open'> {
  onValueChange?: (e: any) => void
  validate: boolean | ((v: any) => boolean)
  [k: string]: any
}

/**
 * 构建缓存式 input 组件的 HOC。
 * 传入 input 组件，输出后，得到缓存式的 input 组件。
 * 缓存式组件在失去焦点(onBlur)后才会发出状态更新请求。
 * 这时可以对输入进行验证，不通过可以阻止其更新，回到之前的输入。
 * @param InputComponent Input 组件。可以是普通的 input，也可以是封装的 input React.ComponentType<InputComProps>
 * @returns
 */
const cacheInput = (InputComponent: React.ComponentType<InputComProps>): React.FC<CachedComProps> => {
  return ({
    value,
    onValueChange,
    validate,
    onBlur,
    // autoComplete props
    backfill,
    defaultActiveFirstOption,
    options,
    filterOption,
    open,
    ...props
  }) => {
    const [cache, setCache] = useState(value) // cache总是input的属性
    const [prev, setPrev] = useState(value)

    // onChange 更新 cache。支持 onChange 事件拿到的是 value 或 DOM事件两种情况
    const onChange = (e: any) => {
      if (e !== null) {
        const value = typeof e === 'object' && e.hasOwnProperty('currentTarget') ? e.currentTarget.value : e
        setCache(value)
      }
    }

    const newOnBlur = (e: { currentTarget: { value: any } }) => {
      const valid = typeof validate === 'boolean' ? validate : validate(cache)
      if (valid) {
        setPrev(cache)
        // 调用 onValueChange，告诉父组件可以改 value 属性了
        if (onValueChange && typeof onValueChange === 'function') onValueChange(cache)
      } else {
        setCache(value)
      }
      // 如果有 onBlur 一并执行
      if (onBlur && typeof onBlur === 'function') onBlur(e)
    }

    // 如果之前的value不同于现在的value，就是外部属性引起的value更新，此时同步cache
    if (prev !== value) {
      setPrev(value)
      setCache(value)
    }

    const autoCompleteFields = {
      backfill,
      defaultActiveFirstOption,
      options,
      open,
      filterOption
    }
    return options ? (
      <AutoComplete {...autoCompleteFields} onChange={onChange} value={cache}>
        <InputComponent onBlur={newOnBlur} {...props} />
      </AutoComplete>
    ) : (
      <InputComponent onBlur={newOnBlur} {...props} onChange={onChange} value={cache} />
    )
  }
}

export const CInput = cacheInput(Input),
  CInputNumber = cacheInput(InputNumber),
  CTextArea = cacheInput(TextArea)

export default cacheInput
