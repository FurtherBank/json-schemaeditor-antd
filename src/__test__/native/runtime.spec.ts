

import produce from "immer"
import { fromJS } from "immutable"
import _ from "lodash"
import { cloneDeep } from "lodash"
import { createStore } from "redux"
import { reducer } from "../../Editor/reducer"
import meta from "../../json-example/$meta.json"
import {newHistory} from 'redux-undo'
test('immutable-speed', () => {
  const s = Date.now()
  const immutableMeta = fromJS(meta)
  const e = Date.now()
  const backMeta = immutableMeta.toJS()
  const e2 = Date.now()
  expect(e-s).toBeLessThan(1)
  expect(e2-e).toBeLessThan(1)
  console.log('运行时间', e-s, e2-e)  // 3ms, 1ms
})

test("deepcopy-speed", () => {
  const s = Date.now()
  const newCopy = cloneDeep(meta)
  const e = Date.now()
  const isEqual = _.isEqual(meta, newCopy)
  const e2 = Date.now()
  expect(e-s).toBeLessThan(10)
  expect(e2-e).toBeLessThan(10)
  expect(isEqual).toBe(true)
  console.log('运行时间', e-s, e2-e)  // 3ms, 2ms
})

test("jsonparse-speed", () => {
  const s = Date.now()
  console.time('1')
  const json = JSON.stringify(meta, null, 2)
  const e = Date.now()
  console.timeEnd('1')
  console.time('1')
  const e1 = Date.now()
  const newCopy = JSON.parse(json)
  const e2 = Date.now()
  console.timeEnd('1')
  expect(e-s).toBeLessThan(10)
  expect(e2-e1).toBeLessThan(10)
  console.log('运行时间', e-s, e2-e1)  // 3ms, 2ms
})

test("immer-treeable", () => {
  let obj = {
    a: {
      aa: 1,
      ab: 2,
      ac: 5
    },
    b: {
      ba: 5,
      bb: 6
    },
    c: []
  }
  const newObj = produce(obj, (draft: any) => {
    draft.a.aa = 4
    const a = draft.a
    delete a['ac']
    obj.c = []
  })
  expect(obj.a).not.toBe(newObj.a)
  expect(newObj.a.hasOwnProperty('ac')).toBe(false)
  expect(obj.a.ab).toBe(newObj.a.ab)
  expect(obj.b).toBe(newObj.b)
  // expect(obj.c).toBe(newObj.c) // 直接改变数组不行，该节点还是会变
  
})


test("immer-reducer", () => {
  let obj = {
    a: {
      aa: 1,
      ab: 2
    },
    b: {
      ba: 5,
      bb: 6
    },
    c: []
  }
  const store = createStore(reducer, newHistory([], {data: obj, dataErrors: [], validate: undefined}, []))
  store.dispatch({
    type: 'change',
    route: ['a'],
    field: 'aa',
    value: 2
  })
  const newObj = store.getState().present.data
  expect(obj.a).not.toBe(newObj.a)
  expect(obj.a.ab).toBe(newObj.a.ab)
  expect(obj.b).toBe(newObj.b)

  const data = {
    a: 13,
    b: {
      ba: 8
    },
    c: 85
  }
  store.dispatch({
    type: 'setData',
    value: data
  })

  const newData = store.getState().present.data
  expect(newData).toBe(data)
})
