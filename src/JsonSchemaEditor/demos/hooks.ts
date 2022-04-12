import { useEffect, useCallback } from 'react';

/**
 * 节流：设置 func 在 interval 时间内只执行一次。
 * 函数会随依赖改变，且保证组件卸载等情况下，函数可以跟进执行最后一次。
 * @param func
 * @param interval
 * @param deps
 * @returns
 */
export const useCooldown = <T extends (...args: any[]) => void>(
  func: T,
  interval = 1,
  deps: React.DependencyList,
): T => {
  let cd = 0;
  let newArgs = undefined as undefined | any[];
  const rf = (...args: any[]) => {
    if (cd === 0) {
      func(...args);
      cd = setTimeout(() => {
        if (newArgs) func(...newArgs);
        newArgs = undefined;
        cd = 0;
      }, interval);
    } else {
      newArgs = args;
    }
  };
  // 在组件卸载时，清除计时器
  useEffect(() => {
    // 不加载，只清除
    return () => {
      if (cd) {
        clearTimeout(cd);
        if (newArgs) func(...newArgs);
      }
    };
  }, deps);

  return useCallback(rf as T, deps);
};
