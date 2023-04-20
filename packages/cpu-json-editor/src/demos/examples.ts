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

import $stringData from './integrate/$schema.string.json'
import stringData from './integrate/string.json'

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

import { DefaultOptionType } from 'antd/lib/select'
import { metaSchema } from '@cpu-studio/json-editor'

export type TestExample = [any, any] | [any, any, string]
export type TestExamples = {
  [key: string]: TestExample
}

class ExampleData {
  /**
   *
   */
  constructor(public data: DefaultOptionType[] = [], public plainData: Record<string, TestExample> = {}) {}
  addExamples(categoryName: string, examples: TestExample[]) {
    let index = this.data.findIndex((node) => {
      return node.value === categoryName
    })
    if (index === -1) {
      index = this.data.length
      this.data.push({ value: categoryName, label: categoryName, children: [], disabled: true })
    }
    // 在种类中 push 子节点
    this.data[index].children?.push(
      ...examples.map((example) => {
        const title = example[2] ? example[2] : (example[1].title as string)
        this.plainData[title] = example
        return { value: title, label: title }
      })
    )
    return this
  }
}

export default new ExampleData()
  .addExamples('基础数据', [
    [stringData, $stringData],
    [stringArray, $stringArray]
  ])
  .addExamples('字符串格式', [])
  .addExamples('自定义视图', [[list, $list]])
  .addExamples('特性测试', [[alternative, $alternative]])
  .addExamples('集成测试', [
    [general, $general],
    [Default, $default],
    [simple, $simple],
    [$default, metaSchema, '模式编辑'],
    [metaSchema, metaSchema, '元模式自编辑'],
    [dataFacility, $dataFacility],
    [$dataFacility, metaSchema, '《星际探索者》设施配置模式编辑'],
    [dataTechTree, $dataTechTree],
    [$dataTechTree, metaSchema, '《星际探索者》科技树配置模式编辑'],
    [items, $items],
    [reducerTest, $reducerTest],
    [eslint, $eslint]
  ])
