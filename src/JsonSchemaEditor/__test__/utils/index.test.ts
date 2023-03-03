import '@testing-library/jest-dom'
import {
  addRef,
  concatAccess,
  deepCollect,
  deepGet,
  deepReplace,
  deepSet,
  getValueByPattern,
  jsonDataType
} from '../../utils'
import _ from 'lodash'
import { uri2strArray } from '../../utils/path/uri'

describe('utils', () => {
  it('concatAccess: ok', () => {
    const route = ['abc', 'def', 'ghi']
    expect(concatAccess(route, null)).toEqual(['abc', 'def', 'ghi'])
    expect(concatAccess(route, 'a')).toEqual(['abc', 'def', 'ghi', 'a'])
    expect(concatAccess(route, '')).toEqual(['abc', 'def', 'ghi'])

    // expect(screen.queryByText(basic)).toBeInTheDocument();
  })

  it('addRef', () => {
    expect(addRef('#/title', 'foo', 'bar')).toBe('#/title/foo/bar')
    expect(addRef('#/title/', 'foo', 'bar')).toBe('#/title/foo/bar')
    expect(addRef(undefined, '#/title/aabc')).toBe(undefined)
  })

  it('getRefSchemaMap', () => {
    expect(addRef('#/title', 'foo', 'bar')).toBe('#/title/foo/bar')
    expect(addRef('#/title/', 'foo', 'bar')).toBe('#/title/foo/bar')
    expect(addRef(undefined, '#/title/aabc')).toBe(undefined)
  })

  it('deepGet', () => {
    const json = {
      title: 'Default Schema',
      description: 'a simple object schema by default',
      type: 'object',
      properties: {
        key: {
          type: 'string',
          format: 'row'
        }
      },
      additionalProperties: false
    }
    expect(deepGet(json, uri2strArray('#/title'))).toBe(json.title)
    expect(deepGet(json, uri2strArray('#/title/aabc'))).toBe(undefined)
    expect(deepGet(json, uri2strArray('#/properties'))).toBe(json.properties)
    expect(deepGet(json, uri2strArray('#/properties/key/'))).toBe(json.properties.key)
    expect(deepGet(json, uri2strArray('#/'))).toBe(json)
  })

  it('deepCollect', () => {
    const obj = {
      a: {
        a: 5,
        b: 3,
        c: []
      },
      b: {
        a: [
          1,
          2,
          {
            a: 5,
            b: 3
          }
        ],
        b: 4
      }
    }
    expect(deepCollect(obj, 'a')).toEqual([
      {
        a: 5,
        b: 3,
        c: []
      },
      [
        1,
        2,
        {
          a: 5,
          b: 3
        }
      ]
    ])
    expect(deepCollect(obj, 'b')).toEqual([
      3,
      {
        a: [
          1,
          2,
          {
            a: 5,
            b: 3
          }
        ],
        b: 4
      }
    ])
    expect(deepCollect(obj, 'c')).toEqual([[]])
    expect(deepCollect(obj, 'd')).toEqual([])
  })

  it('deepReplace', () => {
    const obj = {
      a: {
        a: 5,
        b: 3,
        c: []
      },
      b: {
        a: [
          1,
          2,
          {
            a: 5,
            b: 3
          }
        ],
        b: 4
      }
    }
    const obj2 = _.cloneDeep(obj)
    const replace = (value: any) => {
      switch (jsonDataType(value)) {
        case 'object':
          return null
        case 'array':
          return value.concat(66)
        case 'number':
          return value + 1
        case 'string':
          return value + 'balabala'
        default:
          return value
      }
    }
    expect(deepReplace(_.cloneDeep(obj), 'a', replace)).toEqual({
      a: null,
      b: {
        a: [
          1,
          2,
          {
            a: 5,
            b: 3
          },
          66
        ],
        b: 4
      }
    })
    expect(deepReplace(_.cloneDeep(obj), 'b', replace)).toEqual({
      a: {
        a: 5,
        b: 4,
        c: []
      },
      b: null
    })
    expect(deepReplace(_.cloneDeep(obj), 'c', replace)).toEqual({
      a: {
        a: 5,
        b: 3,
        c: [66]
      },
      b: {
        a: [
          1,
          2,
          {
            a: 5,
            b: 3
          }
        ],
        b: 4
      }
    })
    expect(deepReplace(_.cloneDeep(obj), 'd', replace)).toEqual(obj2)
  })

  it('deepSet', () => {
    const json = {
      title: 'Default Schema',
      description: 'a simple object schema by default',
      type: 'object',
      properties: {
        key: {
          type: 'string',
          format: 'row'
        }
      },
      additionalProperties: false
    } as any
    const json0 = _.cloneDeep(json)
    const json1 = _.cloneDeep(json)
    json1.title = 'Schema'
    const json2 = _.cloneDeep(json)
    json2.properties.key.maxLength = 20
    const json3 = _.cloneDeep(json)
    json3.properties.key = null
    const json4 = _.cloneDeep(json)
    json4.properties.a = {
      b: {
        c: {
          d: null
        }
      }
    }
    expect(deepSet(_.cloneDeep(json), '#/title', 'Schema')).toEqual(json1)
    expect(deepSet(_.cloneDeep(json), '#/title/aabc', 5)).toEqual(json0)
    expect(deepSet(_.cloneDeep(json), '#/properties/key/maxLength', 20)).toEqual(json2)
    expect(deepSet(_.cloneDeep(json), '#/properties/key/', null)).toEqual(json3)
    expect(deepSet(_.cloneDeep(json), '#/properties/a/b/c/d', null)).toEqual(json4)
  })

  it('getValueByPattern', () => {
    const obj = {
      'pattern[0-9]+': 1
    }
    expect(getValueByPattern(obj, 'pattern[0-9]+')).toBeUndefined()
    expect(getValueByPattern(obj, 'pattern1233')).toBe(1)
    expect(getValueByPattern(obj, 'patter1233')).toBeUndefined()
  })
})
