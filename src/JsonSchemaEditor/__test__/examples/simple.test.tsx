import '@testing-library/jest-dom';
import React, { useRef } from 'react';
import { render, screen } from '@testing-library/react';
import JsonSchemaEditor, { metaSchema } from '../../..';
import examples from '../../demos/examples';

test('simple', () => {
  const exampleJson = examples(metaSchema);
  const [name, data, schema] = exampleJson[3];
  const { asFragment } = render(<JsonSchemaEditor data={data} schema={schema} />);
  expect(name).toBe('简单示例');
});
