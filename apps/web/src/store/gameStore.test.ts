import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameStore } from './gameStore';

beforeEach(() => localStorage.clear());

describe('gameStore play and sound settings', () => {
  it('remembers turbo and the auto spin count', () => {
    const store = useGameStore.getState();
    store.setTurbo(true);
    store.setAutoLimit(50);
    expect(JSON.parse(localStorage.getItem('mjd.play') ?? '{}')).toMatchObject({
      turbo: true,
      autoLimit: 50,
    });
  });

  it('keeps music and effects levels separate from the master volume', () => {
    const store = useGameStore.getState();
    store.setVolume(0.5);
    store.setMusicVolume(0.2);
    store.setSfxVolume(0.9);
    expect(JSON.parse(localStorage.getItem('mjd.sound') ?? '{}')).toMatchObject({
      volume: 0.5,
      musicVolume: 0.2,
      sfxVolume: 0.9,
    });
  });

  it('starts auto spin off with no spins counted and no stop limits set', () => {
    const { auto, autoLeft, autoStartBalance, autoStopOnWin, autoStopWinOver, autoStopLossOver } =
      useGameStore.getState();
    expect(auto).toBe(false);
    expect(autoLeft).toBeNull();
    expect(autoStartBalance).toBeNull();
    expect(autoStopOnWin).toBe(false);
    expect(autoStopWinOver).toBeNull();
    expect(autoStopLossOver).toBeNull();
  });

  it('remembers the auto spin stop limits and persists them', () => {
    const store = useGameStore.getState();
    store.setAutoStopOnWin(true);
    store.setAutoStopWinOver(500);
    store.setAutoStopLossOver(1000);

    const after = useGameStore.getState();
    expect(after.autoStopOnWin).toBe(true);
    expect(after.autoStopWinOver).toBe(500);
    expect(after.autoStopLossOver).toBe(1000);
    expect(JSON.parse(localStorage.getItem('mjd.play') ?? '{}')).toMatchObject({
      autoStopOnWin: true,
      autoStopWinOver: 500,
      autoStopLossOver: 1000,
    });
  });

  it('rejects a stop limit that is not a positive whole number, falling back to "no limit"', () => {
    const store = useGameStore.getState();
    store.setAutoStopWinOver(0);
    expect(useGameStore.getState().autoStopWinOver).toBeNull();
    store.setAutoStopLossOver(-5);
    expect(useGameStore.getState().autoStopLossOver).toBeNull();
    store.setAutoStopWinOver(NaN);
    expect(useGameStore.getState().autoStopWinOver).toBeNull();
  });

  it('rounds a fractional stop limit to a whole number of credits', () => {
    const store = useGameStore.getState();
    store.setAutoStopLossOver(249.6);
    expect(useGameStore.getState().autoStopLossOver).toBe(250);
  });

  it('clearing a stop limit back to null is remembered too', () => {
    const store = useGameStore.getState();
    store.setAutoStopWinOver(500);
    store.setAutoStopWinOver(null);
    expect(useGameStore.getState().autoStopWinOver).toBeNull();
    expect(JSON.parse(localStorage.getItem('mjd.play') ?? '{}')).toMatchObject({
      autoStopWinOver: null,
    });
  });

  it('ignores corrupted stop-limit values already saved in storage, on a cold start', async () => {
    localStorage.setItem(
      'mjd.play',
      JSON.stringify({ turbo: true, autoStopWinOver: 'not-a-number', autoStopLossOver: -10 }),
    );
    // loadPlay() only runs once, when the module is first imported, so re-import it fresh.
    vi.resetModules();
    const { useGameStore: freshStore } = await import('./gameStore');
    const state = freshStore.getState();
    expect(state.turbo).toBe(true); // the one valid field still comes through
    expect(state.autoStopWinOver).toBeNull();
    expect(state.autoStopLossOver).toBeNull();
  });

  it('snapshots the balance when auto spin starts, for the loss limit to measure against', () => {
    const store = useGameStore.getState();
    store.setBalance(7_000);
    store.setAutoStartBalance(useGameStore.getState().balance);
    expect(useGameStore.getState().autoStartBalance).toBe(7_000);
    store.setAutoStartBalance(null);
    expect(useGameStore.getState().autoStartBalance).toBeNull();
  });
});
