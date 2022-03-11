import _ from "lodash"


test("Map迭代顺序测试", () => {
  const map = new Map()
  map.set(0, 'zero')
  map.set(1, 'one')
  map.set(2, 'two')

  map.set(1, '一')
  let str = ''
  for (const [key, value] of map) {
    str = str + key + '=' + value + ','
  }
  expect(str).toBe('0=zero,1=一,2=two,')
})
