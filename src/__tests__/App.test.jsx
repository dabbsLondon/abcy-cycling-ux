import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

function App() {
  return <h1>Hello World</h1>;
}

describe('App', () => {
  it('renders hello world', () => {
    render(<App />);
    expect(screen.getByText('Hello World')).toBeTruthy();
  });
});
