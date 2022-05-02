import '@testing-library/jest-dom';
import React, { useRef } from 'react';
import { render, screen } from '@testing-library/react';
import JsonSchemaEditor, { metaSchema } from '../../..';
import examples from '../../demos/examples';

test('simple', () => {
  const exampleJson = examples(metaSchema);
  const [data, schema] = exampleJson['简单示例'];
  const { asFragment } = render(<JsonSchemaEditor data={data} schema={schema} />);
});
