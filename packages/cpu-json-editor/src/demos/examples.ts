// json 配置
import general from './integrate/general.json'
import $general from './integrate/$schema.general.json'
import $default from './integrate/$schema.default.json'
import Default from './integrate/default.json' // 注意 小写 default 保留字

import $dataFacility from './integrate/$schema.dataFacility.json'
import dataFacility from './integrate/dataFacility.json'

import $dataTechTree from './integrate/$schema.dataTechTree.json'
import dataTechTree from './integrate/dataTechTree.json'

import $items from './integrate/$schema.items.json'
import items from './integrate/items.json'

import $basic from './integrate/$schema.basic.json'
import basic from './integrate/basic.json'

import $simple from './integrate/$schema.simple.json'
import simple from './integrate/simple.json'

import $reducerTest from './integrate/$schema.reducerTest.json'
import reducerTest from './integrate/reducerTest.json'

import $eslint from './integrate/$schema.eslint.json'
import eslint from './integrate/eslint.json'

import $list from './integrate/$schema.test-list.json'
import list from './integrate/test-list.json'

import $alternative from './integrate/$schema.alternative.json'
import alternative from './integrate/alternative.json'

import stringArray from './basic-data/string-array.json'
import $stringArray from './basic-data/$schema.string-array.json'

import { JSONSchema } from '../type/Schema'

export type TestExample = [any, JSONSchema]
export type TestExamples = {
  [key: string]: TestExample
}

export default (metaSchema: any) => {
  return {
    基础: [basic, $basic],
    一系列测试: [general, $general],
    小型示例: [Default, $default],
    简单示例: [simple, $simple],
    模式编辑: [$default, metaSchema],
    元模式自编辑: [metaSchema, metaSchema],
    '《星际探索者》设施配置示例': [dataFacility, $dataFacility],
    '《星际探索者》设施配置模式编辑': [$dataFacility, metaSchema],
    '《星际探索者》科技树示例': [dataTechTree, $dataTechTree],
    '《星际探索者》科技树配置模式编辑': [$dataTechTree, metaSchema],
    'RMMZ 物品数据示例': [items, $items],
    'reducer 测试实例': [reducerTest, $reducerTest],
    'eslint(draft7)': [eslint, $eslint],
    'view: list': [list, $list],
    替代法则测试: [alternative, $alternative],
    'basic: string Array': [stringArray, $stringArray]
  } as TestExamples
}
