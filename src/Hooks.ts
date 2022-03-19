import React, { useCallback, useEffect } from "react"

export const useCooldown = <T extends (...args: any[]) => void>(
  func: T,
  interval = 1,
  deps: React.DependencyList
): T => {
  let cd = 0 as 0 | NodeJS.Timeout
  let newArgs = undefined as undefined | any[]
  const rf = (...args: any[]) => {
    if (cd === 0) {
      func(...args)
      cd = setTimeout(() => {
        if (newArgs) func(...newArgs)
        newArgs = undefined, cd = 0
      }, interval)
    } else {
      newArgs = args
    }
  }
  // 在组件卸载时，清除计时器
  useEffect(() => {
    // 不加载，只清除
    return () => {
      if (cd) {
        clearTimeout(cd)
        if (newArgs) func(...newArgs)
      }
    }
  }, deps)

  return useCallback(rf as T, deps)
}
