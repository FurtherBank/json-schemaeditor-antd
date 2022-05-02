import '@testing-library/jest-dom';
import React, { useRef } from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import JsonSchemaEditor, { metaSchema } from '../../..';
import examples from '../../demos/examples';

test('default', () => {
  const exampleJson = examples(metaSchema);
  const [name, data, schema] = exampleJson[2];
  const { asFragment } = render(<JsonSchemaEditor data={data} schema={schema} />);
  expect(name).toBe('小型示例');
});
