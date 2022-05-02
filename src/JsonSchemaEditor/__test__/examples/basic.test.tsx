import '@testing-library/jest-dom';
import React, { useRef } from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import JsonSchemaEditor, { metaSchema } from '../../..';
import examples from '../../demos/examples';

// json 配置

// describe('<JsonSchemaEditor />', () => {
//   // life hooks
//   afterEach(cleanup);
//   // used vars
//   const examples = [
//     ['基础', basic, $basic],
//     ['一系列测试', general, $general],
//     ['小型示例', Default, $default],
//     ['简单示例', simple, $simple],
//     ['模式编辑', $default, metaSchema],
//     ['元模式自编辑', metaSchema, metaSchema],
//     ['《星际探索者》设施配置示例', dataFacility, $dataFacility],
//     ['《星际探索者》设施配置模式编辑', $dataFacility, metaSchema],
//     ['《星际探索者》科技树示例', dataTechTree, $dataTechTree],
//     ['《星际探索者》科技树配置模式编辑', $dataTechTree, metaSchema],
//     ['RMMZ 物品数据示例', items, $items],
//   ];

//   it('basic: should not crash', async () => {
//     render(<JsonSchemaEditor data={'hello world'} schema={$basic as any} />);
//     // await new Promise((resolve, reject) => {
//     //   setTimeout(resolve, 100)
//     // })
//     expect(screen.queryByText("hello world")).toBeInTheDocument();
//   });

//   // it('general: should not crash', () => {
//   //   const wrapper = render(<JsonSchemaEditor data={general} schema={$general as any} />);
//   //   const textCanSeen = ['一系列测试', '如果你不喜欢现在的生活，那么你快去考研吧！', '该项目是一个使用antd写的',
//   //     '类型错误', 'pattern567', 'Property', 'balabala', 'Array[5]', 'Object[2]', 'minItems']
//   //   textCanSeen.forEach((text) => {
//   //     expect(screen.queryByText(text)).toBeInTheDocument();
//   //   })
//   //   expect(screen.queryByText('a basic string')).toBeInTheDocument();
//   // });

//   // it('$meta: should not crash', () => {
//   //   const wrapper = render(<JsonSchemaEditor data={metaSchema} schema={metaSchema as any} />);
//   //   const textCanSeen = ['Schema', 'anyOf', 'definitions', 'Schema[]', 'Property', 'schemaArray', 'type', 'title', 'minItems']
//   //   textCanSeen.forEach((text) => {
//   //     expect(screen.queryByText(text)).toBeInTheDocument();
//   //   })
//   // });
// });

test('basic', () => {
  const exampleJson = examples(metaSchema)
  const [name, data, schema] = exampleJson[0];
  const { asFragment } = render(<JsonSchemaEditor data={data} schema={schema} />);
  expect(name).toBe('基础')
  // 
});

