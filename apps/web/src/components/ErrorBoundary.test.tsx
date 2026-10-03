import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

function Bomb(): never {
  throw new Error('boom');
}

describe('ErrorBoundary', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    // React logs the error to the console too; keep the test output clean.
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => consoleError.mockRestore());

  it('renders children normally when nothing throws', () => {
    render(
      <ErrorBoundary>
        <p>All good</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  it('shows a fallback instead of a blank page when a child crashes', () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalled();
  });

  it('reloads the page when the button is clicked', async () => {
    const reload = vi.fn();
    const original = window.location;
    Object.defineProperty(window, 'location', { value: { ...original, reload }, writable: true });
    try {
      render(
        <ErrorBoundary>
          <Bomb />
        </ErrorBoundary>,
      );
      screen.getByRole('button', { name: 'Reload' }).click();
      expect(reload).toHaveBeenCalledTimes(1);
    } finally {
      Object.defineProperty(window, 'location', { value: original, writable: true });
    }
  });
});
