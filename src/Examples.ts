// import formdata from "./json-example/formdata.json"
import ClassesSchema from "./json-example/$schema.Classes.json"
import Classes from "./json-example/Classes.json"
import general from "./json-example/general.json"
import $general from "./json-example/$schema.general.json"
import $default from "./json-example/$schema.default.json"
import Default from "./json-example/default.json"

import $dataFacility from "./json-example/$schema.dataFacility.json"
import dataFacility from "./json-example/dataFacility.json"

import $dataTechTree from "./json-example/$schema.dataTechTree.json"
import dataTechTree from "./json-example/dataTechTree.json"

import $items from "./json-example/$schema.items.json"
import items from "./json-example/items.json"

import $basic from "./json-example/$schema.basic.json"
import basic from "./json-example/basic.json"

import $simple from "./json-example/$schema.simple.json"
import simple from "./json-example/simple.json"

import meta from "./json-example/$meta.json"
import _ from "lodash"

export default [
  ['基础', basic, $basic],
  ['一系列测试', general, $general],
  ['小型示例', Default, $default],
  ['简单示例', simple, $simple],
  ['模式编辑', $default, meta],
  ['元模式自编辑', meta, meta],
  ['《星际探索者》设施配置示例', dataFacility, $dataFacility],
  ['《星际探索者》设施配置模式编辑', $dataFacility, meta],
  ['《星际探索者》科技树示例', dataTechTree, $dataTechTree],
  ['《星际探索者》科技树配置模式编辑', $dataTechTree, meta],
  ['RMMZ 物品数据示例', items, $items],
]