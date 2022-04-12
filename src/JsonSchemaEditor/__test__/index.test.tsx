import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import JsonSchemaEditor from '..';

describe('<JsonSchemaEditor />', () => {
  it('should not crash', () => {
    const schema = {
      type: 'string',
      format: 'multiline',
    };
    render(<JsonSchemaEditor data={'hello world'} schema={schema as any} />);
    expect(screen.queryByText('hello world')).toBeInTheDocument();
  });
});
