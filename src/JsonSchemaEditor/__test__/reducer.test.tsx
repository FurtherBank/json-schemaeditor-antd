import '@testing-library/jest-dom';
import React, { useRef } from 'react';
import { render, screen, within } from '@testing-library/react';
import JsonSchemaEditor, { metaSchema } from '../../..';
import examples from '../demos/examples';

test('simple', () => {
  const exampleJson = examples(metaSchema);
  const [data, schema] = exampleJson[3];
  const { asFragment } = render(<JsonSchemaEditor data={data} schema={schema} />);
  const button = screen.getByRole('button', {
    name: /right reducertest undo redo/i,
  });

  const undo = within(button).getByRole('button', {
    name: /undo/i,
  });
  const redo = within(button).getByRole('button', {
    name: /redo/i,
  });

});
