import AutoComplete from "antd/lib/auto-complete"
import React, { useState } from "react"

interface InputComProps {
  value?: any
  onChange?: (e: React.SyntheticEvent | any) => void
  onBlur?: (e: any) => void
  [x: string]: any
}

interface CachedComProps {
  value: any
  onValueChange?: (e: any) => void
  validate: boolean | ((v: any) => boolean)
  [x: string]: any
}

/**
 * 构建缓存 input 组件。具有验证功能。使用
 * @param InputComponent Input 组件。可以是普通的 input，也可以是封装的 input
 * @returns
 */
const cacheInput = (
  InputComponent: React.ComponentType<InputComProps>
): React.FC<CachedComProps> => {
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
        const value =
          typeof e === "object" && e.hasOwnProperty("currentTarget")
            ? e.currentTarget.value
            : e
        setCache(value)
      }
    }

    const newOnBlur = (e: { currentTarget: { value: any } }) => {
      if (typeof validate === 'boolean' || validate(cache)) {
        setPrev(cache)
        // 调用 onValueChange，告诉父组件可以改 value 属性了
        if (onValueChange && typeof onValueChange === "function")
          onValueChange(cache)
      } else {
        setCache(value)
      }
      // 如果有 onBlur 一并执行
      if (onBlur && typeof onBlur === "function") onBlur(e)
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
        <InputComponent onBlur={newOnBlur} {...props}/>
      </AutoComplete>
    ) : (
      (
        <InputComponent onBlur={newOnBlur} {...props} onChange={onChange} value={cache}/>
      )
    )
  }
}

export default cacheInput
