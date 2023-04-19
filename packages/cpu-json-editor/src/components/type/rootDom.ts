import { HTMLProps } from 'react'

export interface RootDomProps<T extends Element> {
  rootDomProps: HTMLProps<T>
}

export interface RootDomRef<T extends Element> {
  rootDom: T
}
