import React, { useState, useReducer, useEffect, useMemo, Dispatch, SetStateAction } from "react"
import { enAbort } from "./SuperPromise"

export interface AsyncState {
  error: any | undefined
  loading: ((reason: any) => void) | undefined
  result: any | undefined
}

/**
 * 渲染时随依赖改变异步加载数据，支持未加载完成中断
 * @param loader 加载函数，参数自动拓展赋值为依赖数组
 * @param deps 依赖数组
 * @param clearNowResult 重新加载是否清空现有结果，默认覆盖
 * @returns 异步状态
 */
export function useAsync(
  loader: (...args: any[]) => Promise<any>,
  deps: React.DependencyList,
  clearNowResult = true
) {
  const [asyncObj, setAsyncObj] = useState({
    error: undefined,
    loading: undefined,
    result: undefined,
  } as AsyncState)

  useEffect(() => {
    const [promise, abort] = enAbort(loader(...deps))
    setAsyncObj({
      loading: abort,
      error: undefined,
      result: clearNowResult ? undefined : asyncObj.result,
    })
    promise.then(
      (result) => {
        setAsyncObj({ result, error: undefined, loading: undefined })
      },
      (reason) => {
        if (reason !== "覆盖中断")
          setAsyncObj(
            Object.assign({}, asyncObj, {
              result: asyncObj.result,
              error: reason,
              loading: undefined,
            })
          )
      }
    )
    return () => {
      abort("覆盖中断")
    }
  }, deps)

  return [asyncObj, setAsyncObj] as [AsyncState, Dispatch<SetStateAction<AsyncState>>]
}

/**
 * 触发时随依赖改变异步加载数据，支持未加载完成中断
 * @param loader 加载函数，参数自动拓展赋值为依赖数组
 * @param deps 依赖数组
 * @param clearNowResult 重新加载是否清空现有结果，默认覆盖
 * @returns [异步状态, 加载触发函数]
 */
export function useAsyncTrigger(
  loader: (...args: any[]) => Promise<any>,
  deps: React.DependencyList,
  clearNowResult = true
) {
  const [asyncObj, setAsyncObj] = useState({
    error: undefined,
    loading: undefined,
    result: undefined,
  } as AsyncState)

  useEffect(() => {
    // 这个effect不建立只清除，防止卸载时还在加载
    return () => {
      if (asyncObj.loading) asyncObj.loading("覆盖中断")
    }
  }, deps)

  const cb = useMemo(() => {
    return (...args: any[]) => {
      const [promise, abort] = enAbort(loader(...args))
      // 中断旧加载，处理新加载
      if (asyncObj.loading) asyncObj.loading("覆盖中断")
      setAsyncObj({
        loading: abort,
        error: undefined,
        result: clearNowResult ? undefined : asyncObj.result,
      })

      promise.then(
        (result) => {
          setAsyncObj({ result, error: undefined, loading: undefined })
        },
        (reason) => {
          if (reason !== "覆盖中断")
            setAsyncObj(
              Object.assign({}, asyncObj, {
                result: asyncObj.result,
                error: reason,
                loading: undefined,
              })
            )
        }
      )
    }
  }, deps)

  return [asyncObj, cb]
}

/**
 * 通过监听器触发的，随依赖改变异步加载数据，支持未加载完成中断
 * @param onFunc 监听器挂载函数
 * @param offFunc 监听器卸载函数
 * @param listener 监听器需要挂载的函数，也就是加载函数
 * @param deps 依赖数组
 * @param clearNowResult 重新加载是否清空现有结果，默认覆盖
 * @param firstArgs 如果有，依赖改变时会默认调用
 * @returns 异步状态
 */
export function useAsyncListener(
  onFunc: (listener: (...args: any[]) => void) => void,
  offFunc: (listener: (...args: any[]) => void) => void,
  listener: (...args: any[]) => Promise<any>,
  deps: React.DependencyList,
  clearNowResult = true,
  firstArgs: any[] | undefined = undefined
) {
  // 这是一个 memo 返回实际触发的监听器函数
  const realListener = useMemo(() => {
    return (...args: any[]) => {
      const [promise, abort] = enAbort(listener(...args))

      // 中断旧加载，处理新加载
      if (asyncObj.loading) asyncObj.loading("覆盖中断")
      setAsyncObj({
        loading: abort,
        error: undefined,
        result: clearNowResult ? undefined : asyncObj.result,
      })

      // 加载完成或中断或出错
      promise.then(
        (result) => {
          setAsyncObj({ result, error: undefined, loading: undefined })
        },
        (reason) => {
          if (reason !== "覆盖中断")
            setAsyncObj(
              Object.assign({}, asyncObj, {
                result: asyncObj.result,
                error: reason,
                loading: undefined,
              })
            )
        }
      )
    }
  }, deps)

  const [asyncObj, setAsyncObj] = useState({
    error: undefined,
    loading: undefined,
    result: undefined,
  } as AsyncState)

  // 首次加载
  useMemo(() => {if (firstArgs) realListener(...firstArgs)}, deps)

  // 持续挂载
  useEffect(() => {
    onFunc(realListener)
    // 这个effect不建立只清除，防止卸载时还在加载
    return () => {
      if (asyncObj.loading) asyncObj.loading("覆盖中断")
      offFunc(realListener)
    }
  }, deps)

  return asyncObj
}
