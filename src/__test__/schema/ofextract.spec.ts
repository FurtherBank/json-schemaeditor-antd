import { ValidateFunction } from "ajv"
import { ajvInstance } from "../../Editor/reducer"
import { toOfName } from "../../Editor/FieldOptions"
import { findKeyRefs, getPathVal, addRef, getRefSchemaMap, extractSchema, iterToArray, deepReplace, deepCollect } from "../../Editor/utils"

test("deepReplace", () => {
  const data = {
    $ref: 1,
    arr: [
      {},{
        $ref: 2
      }
    ],
    obj: {
      nec: {
        $ref: 3
      }
    }
  }
  const newData = deepReplace(data, '$ref', (v) => {
    return 'str'+v
  })
  expect(newData.$ref).toBe('str1')
  expect(newData.arr[1].$ref).toBe('str2')
  expect(newData.obj.nec.$ref).toBe('str3')
  expect(deepCollect(newData, '$ref').length).toBe(3)
  expect(deepCollect(newData, '$ref')).toStrictEqual(['str1','str2','str3'])
})
