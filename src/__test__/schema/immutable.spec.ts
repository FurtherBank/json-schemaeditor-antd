

import { fromJS } from "immutable"
import meta from "../../json-example/$meta.json"

test('immutable-speed', () => {
  const s = Date.now()
  const immutableMeta = fromJS(meta)
  const e = Date.now()
  const backMeta = immutableMeta.toJS()
  const e2 = Date.now()
  expect(e-s).toBeLessThan(1)
  expect(e2-e).toBeLessThan(1)
})