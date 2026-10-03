import { create } from 'zustand';
import { DEFAULT_BET, type SessionSnapshot } from '@mahjong/shared';

export type GamePhase = 'loading' | 'idle' | 'spinning';
export type GameMode = 'base' | 'free';
/** Auto spin counts offered in the HUD; `null` means "until stopped". */
export const AUTO_SPIN_OPTIONS: readonly (number | null)[] = [10, 25, 50, 100, null];

interface SoundSettings {
  muted: boolean;
  /** Master volume; music and effects are scaled by it. */
  volume: number;
  musicVolume: number;
  sfxVolume: number;
}

interface PlaySettings {
  turbo: boolean;
  /** How many auto spins to play (`null` = until stopped). */
  autoLimit: number | null;
  /** Stop auto spin as soon as any spin wins something. */
  autoStopOnWin: boolean;
  /** Stop auto spin when one spin wins at least this many demo credits (`null` = no limit). */
  autoStopWinOver: number | null;
  /** Stop auto spin once the loss since it started reaches this many demo credits (`null` = no limit). */
  autoStopLossOver: number | null;
}

const SOUND_KEY = 'mjd.sound';
const PLAY_KEY = 'mjd.play';

const clamp01 = (value: unknown, fallback: number): number =>
  typeof value === 'number' ? Math.min(1, Math.max(0, value)) : fallback;

/** A positive whole number of demo credits, or `null` ("no limit"). Anything else falls back to `null`. */
const creditLimit = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.round(value) : null;

function loadSound(): SoundSettings {
  try {
    const raw = localStorage.getItem(SOUND_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SoundSettings>;
      return {
        muted: Boolean(parsed.muted),
        volume: clamp01(parsed.volume, 0.7),
        musicVolume: clamp01(parsed.musicVolume, 1),
        sfxVolume: clamp01(parsed.sfxVolume, 1),
      };
    }
  } catch {
    // storage unavailable - use defaults
  }
  return { muted: false, volume: 0.7, musicVolume: 1, sfxVolume: 1 };
}

function saveSound(settings: SoundSettings) {
  try {
    localStorage.setItem(SOUND_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

function loadPlay(): PlaySettings {
  try {
    const raw = localStorage.getItem(PLAY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PlaySettings>;
      const limit = parsed.autoLimit ?? null;
      return {
        turbo: Boolean(parsed.turbo),
        autoLimit: AUTO_SPIN_OPTIONS.includes(limit) ? limit : null,
        autoStopOnWin: Boolean(parsed.autoStopOnWin),
        autoStopWinOver: creditLimit(parsed.autoStopWinOver),
        autoStopLossOver: creditLimit(parsed.autoStopLossOver),
      };
    }
  } catch {
    // storage unavailable - use defaults
  }
  return {
    turbo: false,
    autoLimit: null,
    autoStopOnWin: false,
    autoStopWinOver: null,
    autoStopLossOver: null,
  };
}

function savePlay(settings: PlaySettings) {
  try {
    localStorage.setItem(PLAY_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

interface GameUiState extends SoundSettings, PlaySettings {
  phase: GamePhase;
  mode: GameMode;
  bet: number;
  /** Balance as currently DISPLAYED (server value, animated with the spin). */
  balance: number;
  /** Win of the spin currently being presented. */
  win: number;
  session: SessionSnapshot;
  error: string | null;
  /** Auto spin is running (one button starts and stops it). */
  auto: boolean;
  /** Auto spins still to play in this run (`null` = unlimited). */
  autoLeft: number | null;
  /** Balance when the current auto spin run started; used to measure the loss-limit. */
  autoStartBalance: number | null;

  hydrate: (args: { balance: number; session: SessionSnapshot; defaultBet: number }) => void;
  setPhase: (phase: GamePhase) => void;
  setMode: (mode: GameMode) => void;
  setBet: (bet: number) => void;
  setBalance: (balance: number) => void;
  setWin: (win: number) => void;
  setSession: (session: SessionSnapshot) => void;
  setError: (error: string | null) => void;
  setAuto: (auto: boolean) => void;
  setAutoLeft: (left: number | null) => void;
  setAutoStartBalance: (balance: number | null) => void;
  setAutoLimit: (limit: number | null) => void;
  setAutoStopOnWin: (on: boolean) => void;
  setAutoStopWinOver: (limit: number | null) => void;
  setAutoStopLossOver: (limit: number | null) => void;
  setTurbo: (turbo: boolean) => void;
  setMuted: (muted: boolean) => void;
  setVolume: (volume: number) => void;
  setMusicVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
}

const EMPTY_SESSION: SessionSnapshot = {
  dragonMeter: 0,
  freeSpinsRemaining: 0,
  freeSpinsTotal: 0,
  freeSpinBet: 0,
  freeSpinsWin: 0,
};

/** UI state only. Authoritative values (balance, wins, Free Spins...) always come from the server. */
export const useGameStore = create<GameUiState>((set, get) => {
  const sound = (): SoundSettings => {
    const { muted, volume, musicVolume, sfxVolume } = get();
    return { muted, volume, musicVolume, sfxVolume };
  };
  const play = (): PlaySettings => {
    const { turbo, autoLimit, autoStopOnWin, autoStopWinOver, autoStopLossOver } = get();
    return { turbo, autoLimit, autoStopOnWin, autoStopWinOver, autoStopLossOver };
  };

  return {
    ...loadSound(),
    ...loadPlay(),
    phase: 'loading',
    mode: 'base',
    bet: DEFAULT_BET,
    balance: 0,
    win: 0,
    session: EMPTY_SESSION,
    error: null,
    auto: false,
    autoLeft: null,
    autoStartBalance: null,

    hydrate: ({ balance, session, defaultBet }) =>
      set({
        balance,
        session,
        bet: session.freeSpinsRemaining > 0 ? session.freeSpinBet : get().bet || defaultBet,
        mode: session.freeSpinsRemaining > 0 ? 'free' : 'base',
        win: 0,
        phase: 'idle',
        error: null,
      }),
    setPhase: (phase) => set({ phase }),
    setMode: (mode) => set({ mode }),
    setBet: (bet) => set({ bet }),
    setBalance: (balance) => set({ balance }),
    setWin: (win) => set({ win }),
    setSession: (session) => set({ session }),
    setError: (error) => set({ error }),
    setAuto: (auto) => set({ auto }),
    setAutoLeft: (autoLeft) => set({ autoLeft }),
    setAutoStartBalance: (autoStartBalance) => set({ autoStartBalance }),
    setAutoLimit: (autoLimit) => {
      set({ autoLimit });
      savePlay(play());
    },
    setAutoStopOnWin: (autoStopOnWin) => {
      set({ autoStopOnWin });
      savePlay(play());
    },
    setAutoStopWinOver: (autoStopWinOver) => {
      set({ autoStopWinOver: creditLimit(autoStopWinOver) });
      savePlay(play());
    },
    setAutoStopLossOver: (autoStopLossOver) => {
      set({ autoStopLossOver: creditLimit(autoStopLossOver) });
      savePlay(play());
    },
    setTurbo: (turbo) => {
      set({ turbo });
      savePlay(play());
    },
    setMuted: (muted) => {
      set({ muted });
      saveSound(sound());
    },
    setVolume: (volume) => {
      set({ volume });
      saveSound(sound());
    },
    setMusicVolume: (musicVolume) => {
      set({ musicVolume });
      saveSound(sound());
    },
    setSfxVolume: (sfxVolume) => {
      set({ sfxVolume });
      saveSound(sound());
    },
  };
});
