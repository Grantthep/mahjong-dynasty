import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { gameApi } from '../api/endpoints';
import { GearIcon, SoundIcon } from '../components/Icons';
import { HUD } from '../components/HUD';
import { Logo } from '../components/Logo';
import { PalaceBackground } from '../components/PalaceBackground';
import { SettingsPanel } from '../components/SettingsPanel';
import { ErrorScreen, LoadingScreen } from '../components/StatusScreens';
import { WinOverlay } from '../components/WinOverlay';
import { GameController } from '../game/GameController';
import { useLogout, useMe } from '../hooks/useAuth';
import { useGameConfig, useGameState } from '../hooks/useGameData';
import { useGameStore } from '../store/gameStore';
import { uuid } from '../utils/format';
import styles from './GamePage.module.css';

interface OverlayInfo {
  title: string;
  subtitle?: string;
  amount: number;
  tone: 'big' | 'mega' | 'epic' | 'free';
  fast: boolean;
  resolve: () => void;
}

const TIER_TITLE = { big: 'BIG WIN', mega: 'MEGA WIN', epic: 'EPIC WIN' } as const;
const NEXT_FREE_SPIN_DELAY_MS = 900;
const TURBO_NEXT_SPIN_DELAY_MS = 300;

export default function GamePage() {
  const navigate = useNavigate();
  const config = useGameConfig();
  const gameState = useGameState();
  const me = useMe();
  const logout = useLogout();

  const {
    phase,
    mode,
    bet,
    balance,
    win,
    session,
    muted,
    volume,
    musicVolume,
    sfxVolume,
    error,
    auto,
    autoLeft,
    autoLimit,
    turbo,
  } = useGameStore();

  const hostRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<GameController | null>(null);
  const mountedRef = useRef(true);
  const nextSpinTimer = useRef<number | null>(null);
  const spinRef = useRef<() => Promise<void>>(async () => undefined);
  /** The player pressed Skip during the spin being shown. */
  const skippedRef = useRef(false);

  const [engineReady, setEngineReady] = useState(false);
  const [engineError, setEngineError] = useState<string | null>(null);
  const [dim, setDim] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [overlay, setOverlay] = useState<OverlayInfo | null>(null);

  const bootRef = useRef({ config: config.data, state: gameState.data });
  bootRef.current = { config: config.data, state: gameState.data };
  const booted = Boolean(config.data && gameState.data);

  /* ---------- start / stop the Phaser game ---------- */
  useEffect(() => {
    const { config: cfg, state } = bootRef.current;
    const host = hostRef.current;
    if (!booted || !cfg || !state || !host) return;

    let cancelled = false;
    let controller: GameController | null = null;
    useGameStore.getState().hydrate({
      balance: state.balance,
      session: state.session,
      defaultBet: cfg.defaultBet,
    });
    const ui = useGameStore.getState();

    GameController.create(host, {
      board: state.board,
      meter: state.session.dragonMeter,
      mode: state.session.freeSpinsRemaining > 0 ? 'free' : 'base',
      config: cfg,
      muted: ui.muted,
      volume: ui.volume,
    })
      .then((created) => {
        if (cancelled) {
          created.destroy();
          return;
        }
        controller = created;
        controllerRef.current = created;
        setEngineReady(true);
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setEngineError(cause instanceof Error ? cause.message : 'The game could not start.');
        }
      });

    return () => {
      cancelled = true;
      controller?.destroy();
      controllerRef.current = null;
      setEngineReady(false);
    };
  }, [booted]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (nextSpinTimer.current) window.clearTimeout(nextSpinTimer.current);
      useGameStore.getState().setAuto('off');
    };
  }, []);

  useEffect(() => {
    const audio = controllerRef.current?.audio;
    audio?.setMuted(muted);
    audio?.setVolume(volume);
  }, [muted, volume, engineReady]);

  useEffect(() => {
    controllerRef.current?.audio.setMix({ music: musicVolume, sfx: sfxVolume });
  }, [musicVolume, sfxVolume, engineReady]);

  useEffect(() => {
    controllerRef.current?.setTurbo(turbo);
  }, [turbo, engineReady]);

  /* ---------- helpers ---------- */
  const present = useCallback(
    (info: Omit<OverlayInfo, 'resolve' | 'fast'>) =>
      new Promise<void>((resolve) => {
        const fast = useGameStore.getState().turbo || skippedRef.current;
        setOverlay({ ...info, fast, resolve });
      }),
    [],
  );

  /** After an error, re-read the authoritative state from the server. */
  const resync = useCallback(async () => {
    const controller = controllerRef.current;
    const cfg = bootRef.current.config;
    if (!controller || !cfg) return;
    try {
      const fresh = await gameApi.state();
      useGameStore.getState().hydrate({
        balance: fresh.balance,
        session: fresh.session,
        defaultBet: cfg.defaultBet,
      });
      controller.showBoard(fresh.board);
      controller.setMeter(fresh.session.dragonMeter);
      controller.setMode(fresh.session.freeSpinsRemaining > 0 ? 'free' : 'base');
    } catch {
      // keep the current view; the next action will surface any persistent problem
    }
  }, []);

  const handleError = useCallback(
    async (cause: unknown) => {
      if (cause instanceof ApiError) {
        if (cause.status === 401) {
          navigate('/login', { replace: true });
          return;
        }
        if (cause.code === 'SPIN_IN_PROGRESS') return;
        useGameStore.getState().setError(cause.message);
      } else {
        useGameStore.getState().setError('Unexpected error. Please try again.');
      }
      await resync();
    },
    [navigate, resync],
  );

  /* ---------- the spin ---------- */
  const spin = useCallback(async () => {
    const controller = controllerRef.current;
    const store = useGameStore.getState();
    if (!controller || controller.isPlaying || store.phase !== 'idle') return;

    if (nextSpinTimer.current) window.clearTimeout(nextSpinTimer.current);
    skippedRef.current = false;
    store.setError(null);
    store.setWin(0);
    store.setPhase('spinning');
    void controller.audio.play('button');

    try {
      const inFreeSpins = store.session.freeSpinsRemaining > 0;
      // The server is authoritative: we only send the bet and an idempotency key.
      const result = await gameApi.spin({
        bet: inFreeSpins ? store.session.freeSpinBet : store.bet,
        requestId: uuid(),
      });
      if (!mountedRef.current) return;

      // The bet leaves the balance immediately; the win is added when the presentation ends.
      useGameStore
        .getState()
        .setBalance(result.balanceBefore - (result.isFreeSpin ? 0 : result.bet));

      await controller.playSpin(result, {
        onWin: (total) => useGameStore.getState().setWin(total),
        onDim: setDim,
        onEnterFreeSpins: () => {
          useGameStore.getState().setMode('free');
          controller.setMode('free');
        },
      });
      if (!mountedRef.current) return;

      const done = useGameStore.getState();
      done.setBalance(result.balanceAfter);
      done.setWin(result.totalWin);
      done.setSession(result.session);

      if (result.bigWinTier !== 'none') {
        void controller.audio.play('big-win');
        await present({
          title: TIER_TITLE[result.bigWinTier],
          amount: result.totalWin,
          tone: result.bigWinTier,
        });
      }

      if (result.freeSpinsCompleted) {
        await present({
          title: 'FREE SPINS COMPLETE',
          subtitle: 'Total won during Free Spins',
          amount: result.freeSpinsWinTotal,
          tone: 'free',
        });
        useGameStore.getState().setMode('base');
        controller.setMode('base');
      }

      if (mountedRef.current) {
        const latest = useGameStore.getState();
        const freeSpinsLeft = result.session.freeSpinsRemaining > 0;

        // Count this spin against the chosen number of auto spins (Free Spins are not counted).
        if (latest.auto !== 'off' && !result.isFreeSpin && latest.autoLeft !== null) {
          const left = latest.autoLeft - 1;
          latest.setAutoLeft(left);
          if (left <= 0) latest.setAuto('off');
        }

        // Free Spins already play one after another; auto spin also continues normal spins.
        // A paused auto spin holds back both until it is resumed.
        const autoNow = useGameStore.getState().auto;
        const wantsNext = autoNow === 'running' || (freeSpinsLeft && autoNow === 'off');
        if (wantsNext && !freeSpinsLeft && result.balanceAfter < latest.bet) {
          latest.setAuto('off');
          latest.setError('Auto spin stopped: not enough DEMO CREDITS for this bet.');
        } else if (wantsNext) {
          nextSpinTimer.current = window.setTimeout(
            () => void spinRef.current(),
            useGameStore.getState().turbo ? TURBO_NEXT_SPIN_DELAY_MS : NEXT_FREE_SPIN_DELAY_MS,
          );
        }
      }
    } catch (cause) {
      useGameStore.getState().setAuto('off');
      await handleError(cause);
    } finally {
      if (mountedRef.current) useGameStore.getState().setPhase('idle');
    }
  }, [handleError, present]);
  spinRef.current = spin;

  /* ---------- auto spin ---------- */
  const clearNextSpin = () => {
    if (nextSpinTimer.current) window.clearTimeout(nextSpinTimer.current);
    nextSpinTimer.current = null;
  };

  const startAuto = () => {
    const store = useGameStore.getState();
    store.setAutoLeft(store.autoLimit);
    store.setAuto('running');
    void spinRef.current(); // no-op if a spin is already in progress; that spin will chain the next
  };

  const stopAuto = () => {
    const store = useGameStore.getState();
    store.setAuto('off');
    // Free Spins that are already running keep their own automatic chain.
    if (store.session.freeSpinsRemaining === 0) clearNextSpin();
  };

  const pauseAuto = () => {
    useGameStore.getState().setAuto('paused');
    clearNextSpin();
  };

  const skipSpin = () => {
    skippedRef.current = true;
    controllerRef.current?.skip();
  };

  const resumeAuto = () => {
    useGameStore.getState().setAuto('running');
    void spinRef.current();
  };

  /* Space bar spins (unless a control has focus). */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        event.code !== 'Space' ||
        (target && /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(target.tagName))
      )
        return;
      event.preventDefault();
      // Space spins; while a spin is being shown it skips the animation instead.
      if (useGameStore.getState().phase === 'spinning') {
        skippedRef.current = true;
        controllerRef.current?.skip();
      } else {
        void spinRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* ---------- render ---------- */
  if (config.isError || gameState.isError) {
    const cause = config.error ?? gameState.error;
    return (
      <ErrorScreen
        message={cause instanceof Error ? cause.message : 'Could not load the game.'}
        onRetry={() => {
          void config.refetch();
          void gameState.refetch();
        }}
      />
    );
  }
  if (!booted || !config.data) return <LoadingScreen label="Entering the palace…" />;

  const inFreeSpins = session.freeSpinsRemaining > 0;
  const displayBet = inFreeSpins ? session.freeSpinBet : bet;
  const spinning = phase === 'spinning';

  return (
    <div className={styles.root}>
      <PalaceBackground mode={mode === 'free' ? 'free' : 'normal'} dim={dim} />

      <header className={styles.top}>
        <div className={`${styles.side} ${styles.sideLeft}`}>
          <button
            type="button"
            className={styles.iconButton}
            aria-label="Settings"
            onClick={() => setSettingsOpen(true)}
          >
            <GearIcon />
          </button>
          <button
            type="button"
            className={styles.iconButton}
            aria-label={muted ? 'Unmute sound' : 'Mute sound'}
            aria-pressed={muted}
            onClick={() => useGameStore.getState().setMuted(!muted)}
          >
            <SoundIcon muted={muted} />
          </button>
        </div>
        <div className={styles.logoSlot}>
          <Logo size="md" />
        </div>
        <div className={`${styles.side} ${styles.sideRight}`}>
          <span className="demo-badge">DEMO MODE</span>
        </div>
      </header>

      <main className={styles.stage}>
        <div ref={hostRef} className={styles.host} data-testid="game-canvas-host" />
        {!engineReady && !engineError ? (
          <div className={styles.stageMessage} role="status">
            Preparing the palace…
          </div>
        ) : null}
        {engineError ? (
          <div className={styles.stageMessage} role="alert">
            {engineError}
          </div>
        ) : null}
      </main>

      {error ? (
        <div className={styles.toast} role="alert">
          {error}
        </div>
      ) : null}

      <HUD
        balance={balance}
        win={win}
        bet={displayBet}
        bets={config.data.bets}
        spinning={spinning || !engineReady}
        freeSpins={
          inFreeSpins
            ? { remaining: session.freeSpinsRemaining, total: session.freeSpinsTotal }
            : null
        }
        onBetChange={(next) => {
          useGameStore.getState().setBet(next);
          void controllerRef.current?.audio.play('button');
        }}
        onSpin={() => void spin()}
        auto={auto}
        onAutoStart={startAuto}
        onAutoStop={stopAuto}
        onAutoPause={pauseAuto}
        onAutoResume={resumeAuto}
        autoLimit={autoLimit}
        autoLeft={autoLeft}
        onAutoLimitChange={(limit) => useGameStore.getState().setAutoLimit(limit)}
        turbo={turbo}
        onTurboChange={(next) => useGameStore.getState().setTurbo(next)}
        onSkip={skipSpin}
      />

      <SettingsPanel
        open={settingsOpen}
        muted={muted}
        volume={volume}
        musicVolume={musicVolume}
        sfxVolume={sfxVolume}
        username={me.data?.username}
        onClose={() => setSettingsOpen(false)}
        onMutedChange={(next) => useGameStore.getState().setMuted(next)}
        onVolumeChange={(next) => useGameStore.getState().setVolume(next)}
        onMusicVolumeChange={(next) => useGameStore.getState().setMusicVolume(next)}
        onSfxVolumeChange={(next) => useGameStore.getState().setSfxVolume(next)}
        onLogout={() => logout.mutate(undefined, { onSettled: () => navigate('/') })}
      />

      {overlay ? (
        <WinOverlay
          title={overlay.title}
          subtitle={overlay.subtitle}
          amount={overlay.amount}
          tone={overlay.tone}
          fast={overlay.fast}
          onDone={() => {
            overlay.resolve();
            setOverlay(null);
          }}
        />
      ) : null}
    </div>
  );
}
