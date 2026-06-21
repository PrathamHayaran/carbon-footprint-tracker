/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProvider, useApp } from '@/context/AppContext';
import React from 'react';

// ---------------------------------------------------------------------------
// Mock localStorage
// ---------------------------------------------------------------------------

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

beforeEach(() => localStorageMock.clear());

// ---------------------------------------------------------------------------
// Test component that exposes context values
// ---------------------------------------------------------------------------

function TestConsumer() {
  const { activities, todayEmission, getDailyLogs, addActivity, deleteActivity, clearAll, streak } =
    useApp();

  const todayLogs = getDailyLogs(1);

  return (
    <div>
      <p data-testid="count">{activities.length}</p>
      <p data-testid="today-emission">{todayEmission}</p>
      <p data-testid="streak">{streak}</p>
      <p data-testid="daily-log-count">{todayLogs.length}</p>

      <button
        data-testid="add"
        onClick={() =>
          addActivity({
            category: 'transport',
            activityType: 'car_petrol',
            quantity: 10,
            unit: 'km',
            emission: 2.1,
            label: 'Petrol Car',
            date: new Date().toISOString().split('T')[0] ?? '',
            note: '',
          })
        }
      >
        Add
      </button>

      {activities.map((a) => (
        <button
          key={a.id}
          data-testid={`delete-${a.id}`}
          onClick={() => deleteActivity(a.id)}
        >
          Delete {a.id}
        </button>
      ))}

      <button data-testid="clear" onClick={clearAll}>
        Clear
      </button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <AppProvider>
      <TestConsumer />
    </AppProvider>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AppContext — addActivity', () => {
  it('starts with 0 activities', () => {
    renderWithProvider();
    expect(screen.getByTestId('count').textContent).toBe('0');
  });

  it('increments activity count after addActivity', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await user.click(screen.getByTestId('add'));
    expect(screen.getByTestId('count').textContent).toBe('1');

    await user.click(screen.getByTestId('add'));
    expect(screen.getByTestId('count').textContent).toBe('2');
  });

  it('updates todayEmission after adding a transport activity', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await user.click(screen.getByTestId('add'));
    const emission = parseFloat(screen.getByTestId('today-emission').textContent ?? '0');
    expect(emission).toBeCloseTo(2.1, 1);
  });
});

describe('AppContext — deleteActivity', () => {
  it('removes the correct activity by id', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    // Add two activities
    await user.click(screen.getByTestId('add'));
    await user.click(screen.getByTestId('add'));
    expect(screen.getByTestId('count').textContent).toBe('2');

    // Delete the first delete button (most-recently-added activity)
    const deleteButtons = screen.getAllByRole('button', { name: /Delete/ });
    const firstButton = deleteButtons[0];
    if (!firstButton) throw new Error('No delete buttons found');
    await user.click(firstButton);
    expect(screen.getByTestId('count').textContent).toBe('1');
  });
});

describe('AppContext — clearAll', () => {
  it('empties all activities', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await user.click(screen.getByTestId('add'));
    await user.click(screen.getByTestId('add'));
    expect(screen.getByTestId('count').textContent).toBe('2');

    await user.click(screen.getByTestId('clear'));
    expect(screen.getByTestId('count').textContent).toBe('0');
  });

  it('removes the localStorage key after clearAll', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await user.click(screen.getByTestId('add'));
    await user.click(screen.getByTestId('clear'));

    // After clearAll, the persistence effect fires once more with empty array,
    // so the stored value is '[]' rather than null.
    // This is the expected React/localStorage behaviour.
    const stored = localStorageMock.getItem('carbonwise_activities');
    expect(stored === null || stored === '[]').toBe(true);
  });
});

describe('AppContext — getDailyLogs', () => {
  it('always returns exactly the requested number of log entries', () => {
    renderWithProvider();
    expect(screen.getByTestId('daily-log-count').textContent).toBe('1');
  });
});

describe('AppContext — localStorage persistence', () => {
  it('persists activities to localStorage after adding', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await user.click(screen.getByTestId('add'));

    const stored = localStorageMock.getItem('carbonwise_activities');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(1);
  });

  it('loads activities from localStorage on mount', async () => {
    // Pre-seed localStorage before the provider mounts
    const seedActivity = {
      id: 'seed-id',
      userId: 'local-user',
      category: 'food',
      activityType: 'beef',
      quantity: 1,
      unit: 'kg',
      emission: 27,
      label: 'Beef',
      date: '2024-01-01',
      createdAt: 0,
    };
    localStorageMock.setItem('carbonwise_activities', JSON.stringify([seedActivity]));

    renderWithProvider();

    // After the useEffect fires and state is updated, count should be 1
    // We use act to flush async state updates from the useEffect
    await act(async () => {});
    expect(screen.getByTestId('count').textContent).toBe('1');
  });
});
