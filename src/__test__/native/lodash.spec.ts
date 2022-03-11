import _ from "lodash"

test("数组方法", () => {
  const a = [1, [2, []]]
  expect(_.flattenDeep(a).length).toBe(2)
  expect(_.min([1, 2, 3, 4, 5, +Infinity])).toBe(1)
})

test("集合方法", () => {
  expect(_.isEqual(null, null)).toBe(true)
  expect(_.isEqual([1, 2, 3], [1,2,3])).toBe(true)
})
