import '@testing-library/jest-dom'
import React from 'react'
import { render, screen } from '@testing-library/react'
import JsonSchemaEditor from '../..'
import { countNullId, getExample } from '../test-utils'

test('general', () => {
  const [data, schema] = getExample('一系列测试')
  // const { asFragment } =
  render(<JsonSchemaEditor data={data} schema={schema} />)
  // asserts
  const textCanSeen = [
    '一系列测试',
    'enumValue',
    'constValue',
    'typeError',
    'Array[5]',
    '又臭又长',
    '变量创建-命名测试',
    'pro1',
    'pro3',
    '混乱',
    '格式测试',
    // oneOf 套娃可看到的字符
    'oneOf套娃 0',
    'oneOf套娃 6',
    'number[]',
    'string[]',
    '类型为其它'
  ]
  // 这个地方必须加类型注解泛化这个对象的 keys，不然下面for in for of都会出错
  const multipleTextsCanSeen: { [text: string]: number } = {
    类型为对象: 2,
    color: 2,
    date: 2
  }
  textCanSeen.forEach((text) => {
    expect(screen.getByText(text)).toBeTruthy()
  })
  // 这个地方必须这样写。for in需要加hasOwnProperty判断然后导致test文件的avoid conditional expect规则违反
  for (const key of Object.keys(multipleTextsCanSeen)) {
    const length = multipleTextsCanSeen[key]
    expect(screen.getAllByText(key).length).toBe(length)
  }
  const displayValueCanSeen = ['如果你不喜欢现在的生活，那么你快去考研吧！', 'pattern567', 'balabala', '#ffffff']
  displayValueCanSeen.forEach((text) => {
    expect(screen.getByDisplayValue(text)).toBeTruthy()
  })
  expect(countNullId(data)).toBe(9) // enumValue(Array[5]) + constValue(Object[2]) + typeError(Object[2]) = 9
})
