/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CarbonGauge from '@/components/CarbonGauge';

describe('CarbonGauge', () => {
  it('renders without crashing with value=0', () => {
    render(<CarbonGauge value={0} max={20} />);
    // The SVG and centre text should appear
    expect(document.querySelector('svg')).not.toBeNull();
  });

  it('displays the value with one decimal place', () => {
    render(<CarbonGauge value={3.5} max={20} />);
    expect(screen.getByText('3.5')).toBeTruthy();
  });

  it('shows "Excellent" status when value is well below target', () => {
    // target defaults to 5.2; value=1 → 1 < 5.2*0.5=2.6 → "Excellent"
    render(<CarbonGauge value={1} max={20} target={5.2} />);
    expect(screen.getByText('Excellent')).toBeTruthy();
  });

  it('shows "Good" status when value is below target but above 50% of it', () => {
    // value=3, target=5.2 → 2.6 ≤ 3 < 5.2 → "Good"
    render(<CarbonGauge value={3} max={20} target={5.2} />);
    expect(screen.getByText('Good')).toBeTruthy();
  });

  it('shows "Moderate" status when value is between 1x and 1.5x target', () => {
    // value=6, target=5.2 → 5.2 ≤ 6 < 7.8 → "Moderate"
    render(<CarbonGauge value={6} max={20} target={5.2} />);
    expect(screen.getByText('Moderate')).toBeTruthy();
  });

  it('shows "High" status when value is between 1.5x and 2x target', () => {
    // value=9, target=5.2 → 7.8 ≤ 9 < 10.4 → "High"
    render(<CarbonGauge value={9} max={20} target={5.2} />);
    expect(screen.getByText('High')).toBeTruthy();
  });

  it('shows "Critical" status when value exceeds 2x the target', () => {
    // value=15, target=5.2 → 15 ≥ 10.4 → "Critical"
    render(<CarbonGauge value={15} max={20} target={5.2} />);
    expect(screen.getByText('Critical')).toBeTruthy();
  });

  it('accepts a custom size prop', () => {
    const { container } = render(<CarbonGauge value={5} max={20} size={100} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('100');
    expect(svg?.getAttribute('height')).toBe('100');
  });
});
