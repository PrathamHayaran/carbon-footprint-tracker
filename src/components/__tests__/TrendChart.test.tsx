/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import TrendChart from '@/components/TrendChart';

describe('TrendChart', () => {
  it('renders without crashing with an empty data array', () => {
    const { container } = render(<TrendChart data={[]} />);
    // ResponsiveContainer should mount
    expect(container.firstChild).not.toBeNull();
  });

  it('renders without crashing with 7 data points (area mode)', () => {
    const data = [1.2, 3.4, 5.1, 2.8, 4.0, 6.3, 3.9];
    expect(() => render(<TrendChart data={data} type="area" />)).not.toThrow();
  });

  it('renders without crashing with 30 data points (bar mode)', () => {
    const data = Array.from({ length: 30 }, (_, i) => i * 0.3);
    expect(() => render(<TrendChart data={data} type="bar" />)).not.toThrow();
  });

  it('renders without crashing with all-zero data', () => {
    const data = Array.from({ length: 7 }, () => 0);
    expect(() => render(<TrendChart data={data} />)).not.toThrow();
  });

  it('accepts a custom height prop without throwing', () => {
    expect(() =>
      render(<TrendChart data={[1, 2, 3]} height={300} />)
    ).not.toThrow();
  });

  it('accepts a custom target prop without throwing', () => {
    expect(() =>
      render(<TrendChart data={[1, 2, 3]} target={10} />)
    ).not.toThrow();
  });
});
