import { create } from 'zustand';
import { DEFAULT_BET, type SessionSnapshot } from '@mahjong/shared';

export type GamePhase = 'loading' | 'idle' | 'spinning';
export type GameMode = 'base' | 'free';

interface SoundSettings {
  muted: boolean;
  volume: number;
}

const SOUND_KEY = 'mjd.sound';

function loadSound(): SoundSettings {
  try {
    const raw = localStorage.getItem(SOUND_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SoundSettings>;
      return {
        muted: Boolean(parsed.muted),
        volume: typeof parsed.volume === 'number' ? Math.min(1, Math.max(0, parsed.volume)) : 0.7,
      };
    }
  } catch {
    // storage unavailable - use defaults
  }
  return { muted: false, volume: 0.7 };
}

function saveSound(settings: SoundSettings) {
  try {
    localStorage.setItem(SOUND_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

interface GameUiState extends SoundSettings {
  phase: GamePhase;
  mode: GameMode;
  bet: number;
  /** Balance as currently DISPLAYED (server value, animated with the spin). */
  balance: number;
  /** Win of the spin currently being presented. */
  win: number;
  session: SessionSnapshot;
  error: string | null;

  hydrate: (args: { balance: number; session: SessionSnapshot; defaultBet: number }) => void;
  setPhase: (phase: GamePhase) => void;
  setMode: (mode: GameMode) => void;
  setBet: (bet: number) => void;
  setBalance: (balance: number) => void;
  setWin: (win: number) => void;
  setSession: (session: SessionSnapshot) => void;
  setError: (error: string | null) => void;
  setMuted: (muted: boolean) => void;
  setVolume: (volume: number) => void;
}

const EMPTY_SESSION: SessionSnapshot = {
  dragonMeter: 0,
  freeSpinsRemaining: 0,
  freeSpinsTotal: 0,
  freeSpinBet: 0,
  freeSpinsWin: 0,
};

/** UI state only. Authoritative values (balance, wins, Free Spins...) always come from the server. */
export const useGameStore = create<GameUiState>((set, get) => ({
  ...loadSound(),
  phase: 'loading',
  mode: 'base',
  bet: DEFAULT_BET,
  balance: 0,
  win: 0,
  session: EMPTY_SESSION,
  error: null,

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
  setMuted: (muted) => {
    set({ muted });
    saveSound({ muted, volume: get().volume });
  },
  setVolume: (volume) => {
    set({ volume });
    saveSound({ muted: get().muted, volume });
  },
}));
