// json 配置
import general from './json-example/general.json';
import $general from './json-example/$schema.general.json';
import $default from './json-example/$schema.default.json';
import Default from './json-example/default.json'; // 注意 小写 default 保留字

import $dataFacility from './json-example/$schema.dataFacility.json';
import dataFacility from './json-example/dataFacility.json';

import $dataTechTree from './json-example/$schema.dataTechTree.json';
import dataTechTree from './json-example/dataTechTree.json';

import $items from './json-example/$schema.items.json';
import items from './json-example/items.json';

import $basic from './json-example/$schema.basic.json';
import basic from './json-example/basic.json';

import $simple from './json-example/$schema.simple.json';
import simple from './json-example/simple.json';

import { metaSchema } from 'json-schemaeditor-antd';

type TestExample = [string, any, any];

export default [
  ['基础', basic, $basic],
  ['一系列测试', general, $general],
  ['小型示例', Default, $default],
  ['简单示例', simple, $simple],
  ['模式编辑', $default, metaSchema],
  ['元模式自编辑', metaSchema, metaSchema],
  ['《星际探索者》设施配置示例', dataFacility, $dataFacility],
  ['《星际探索者》设施配置模式编辑', $dataFacility, metaSchema],
  ['《星际探索者》科技树示例', dataTechTree, $dataTechTree],
  ['《星际探索者》科技树配置模式编辑', $dataTechTree, metaSchema],
  ['RMMZ 物品数据示例', items, $items],
] as TestExample[];
