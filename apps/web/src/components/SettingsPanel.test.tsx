import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { SettingsPanel } from './SettingsPanel';

const baseProps = {
  open: true,
  muted: false,
  volume: 0.7,
  musicVolume: 1,
  sfxVolume: 1,
  onClose: vi.fn(),
  onMutedChange: vi.fn(),
  onVolumeChange: vi.fn(),
  onMusicVolumeChange: vi.fn(),
  onSfxVolumeChange: vi.fn(),
};

const renderPanel = (overrides: Partial<React.ComponentProps<typeof SettingsPanel>> = {}) =>
  render(
    <MemoryRouter>
      <SettingsPanel {...baseProps} {...overrides} />
    </MemoryRouter>,
  );

describe('SettingsPanel', () => {
  it('renders nothing when closed', () => {
    renderPanel({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('hides the auto spin stop-limit controls unless all three handlers are given', () => {
    renderPanel();
    expect(screen.queryByText('Auto spin stop limits')).not.toBeInTheDocument();
  });

  it('shows and wires up the auto spin stop-limit controls', async () => {
    const onAutoStopOnWinChange = vi.fn();
    const onAutoStopWinOverChange = vi.fn();
    const onAutoStopLossOverChange = vi.fn();
    renderPanel({
      autoStopOnWin: false,
      autoStopWinOver: null,
      autoStopLossOver: 500,
      onAutoStopOnWinChange,
      onAutoStopWinOverChange,
      onAutoStopLossOverChange,
    });

    expect(screen.getByText('Auto spin stop limits')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Stop on any win' }));
    expect(onAutoStopOnWinChange).toHaveBeenCalledWith(true);

    const winOverInput = screen.getByRole('spinbutton', { name: 'Stop if a single win reaches' });
    expect(winOverInput).toHaveValue(null); // "no limit": empty
    // This is a controlled input with a static prop in the test, so one fireEvent (the final
    // value, as a paste or a browser number-input commit would send) rather than per-keystroke
    // userEvent.type, which would otherwise keep resetting to the unchanged prop each keystroke.
    fireEvent.change(winOverInput, { target: { value: '250' } });
    expect(onAutoStopWinOverChange).toHaveBeenLastCalledWith(250);

    const lossOverInput = screen.getByRole('spinbutton', { name: 'Stop if the loss reaches' });
    expect(lossOverInput).toHaveValue(500); // the limit already set is shown
  });

  it('shows the playing-as name only when a username is given', () => {
    const { rerender } = renderPanel();
    expect(screen.queryByText(/Playing as/)).not.toBeInTheDocument();
    rerender(
      <MemoryRouter>
        <SettingsPanel {...baseProps} username="Guest4821" />
      </MemoryRouter>,
    );
    expect(screen.getByText('Playing as Guest4821')).toBeInTheDocument();
  });

  it('calls onClose for the backdrop and the close button, but a click inside the panel does not', async () => {
    const onClose = vi.fn();
    renderPanel({ onClose });
    await userEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Close settings' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows a paytable link only when onOpenPaytable is given', async () => {
    const onOpenPaytable = vi.fn();
    renderPanel({ onOpenPaytable });
    await userEvent.click(screen.getByRole('button', { name: 'Paytable' }));
    expect(onOpenPaytable).toHaveBeenCalledTimes(1);
  });
});
