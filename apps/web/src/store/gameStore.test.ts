import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from './gameStore';

beforeEach(() => localStorage.clear());

describe('gameStore play and sound settings', () => {
  it('remembers turbo and the auto spin count', () => {
    const store = useGameStore.getState();
    store.setTurbo(true);
    store.setAutoLimit(50);
    expect(JSON.parse(localStorage.getItem('mjd.play') ?? '{}')).toEqual({
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

  it('starts auto spin off with no spins counted', () => {
    const { auto, autoLeft } = useGameStore.getState();
    expect(auto).toBe(false);
    expect(autoLeft).toBeNull();
  });
});
