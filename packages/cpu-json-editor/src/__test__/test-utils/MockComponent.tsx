import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React, { ForwardRefExoticComponent, ForwardRefRenderFunction, useRef } from 'react'

interface MockProps {
  refHook: any
  component: ForwardRefExoticComponent<any>
  [k: string]: any
}

export class RefMockerHook {
  constructor(public current: any = {}) {}
}

/**
 * mock 包装组件，可以提取出 ref
 * @param props
 * @returns
 */
export const RefMocker = (props: MockProps) => {
  const { refHook, component: RenderComponent, ...restProps } = props
  const ref = useRef<any>(null)

  refHook.current = ref

  return <RenderComponent ref={ref} {...restProps} />
}

export const MockRender = <T extends any>(component: ForwardRefRenderFunction<T, any>, props: any = {}) => {
  const user = userEvent.setup()
  const refMockerHook = new RefMockerHook()
  const renderResult = render(<RefMocker {...props} component={component} refHook={refMockerHook} />)

  const current = refMockerHook.current.current as T

  return { current, refMockerHook, renderResult, user }
}
