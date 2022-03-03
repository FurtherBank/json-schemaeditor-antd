import itemSchema from "../../schema-example/Items.json";
import itemData from "../../json-example/Items.json";
import { ValidateFunction } from "ajv";
import { ajvInstance } from "../../reducer";
import { toOfName } from "../../FieldOptions";
import { findKeyRefs, getPathVal, addRef, getRefSchemaMap, extractSchema, iterToArray, deepReplace, deepCollect } from "../../utils";

const ajvValidate = (
  schema: any,
  data: any
): [boolean | PromiseLike<any>, ValidateFunction] => {
  const validate = ajvInstance.compile(schema);

  const valid = validate(data);
  return [valid, validate];
};
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
  expect(newData.$ref).toBe('str1');
  expect(newData.arr[1].$ref).toBe('str2');
  expect(newData.obj.nec.$ref).toBe('str3');
  expect(deepCollect(newData, '$ref').length).toBe(3)
  expect(deepCollect(newData, '$ref')).toStrictEqual(['str1','str2','str3'])
});
