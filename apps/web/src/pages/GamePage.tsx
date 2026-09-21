import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { gameApi } from '../api/endpoints';
import { GearIcon, PaytableIcon, SoundIcon } from '../components/Icons';
import { HUD } from '../components/HUD';
import { LanguageSwitch } from '../components/LanguageSwitch';
import { Logo } from '../components/Logo';
import { PalaceBackground } from '../components/PalaceBackground';
import { PaytableModal } from '../components/PaytableModal';
import { SettingsPanel } from '../components/SettingsPanel';
import { ErrorScreen, LoadingScreen } from '../components/StatusScreens';
import { WinOverlay } from '../components/WinOverlay';
import { GameController } from '../game/GameController';
import { useLogout, useMe } from '../hooks/useAuth';
import { useGameConfig, useGameState } from '../hooks/useGameData';
import { translate, useLanguage, useT, type TranslationKey } from '../i18n';
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

const TIER_TITLE: Record<'big' | 'mega' | 'epic', TranslationKey> = {
  big: 'win.big',
  mega: 'win.mega',
  epic: 'win.epic',
};

/** Translates outside React render (spin callbacks), always using the language chosen right now. */
const tr = (key: TranslationKey, params?: Record<string, string | number>) =>
  translate(useLanguage.getState().lang, key, params);
const NEXT_FREE_SPIN_DELAY_MS = 900;
const TURBO_NEXT_SPIN_DELAY_MS = 300;

export default function GamePage() {
  const t = useT();
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
  const [paytableOpen, setPaytableOpen] = useState(false);
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
          setEngineError(cause instanceof Error ? cause.message : tr('status.startFailed'));
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
      useGameStore.getState().setAuto(false);
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
        useGameStore.getState().setError(tr('status.unexpected'));
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
        labels: {
          wildReel: tr('wild.reelBanner'),
          freeSpins: tr('canvas.freeSpins'),
          awarded: (spins, retrigger) =>
            tr(retrigger ? 'canvas.retrigger' : 'canvas.awarded', { count: spins }),
        },
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
          title: tr(TIER_TITLE[result.bigWinTier]),
          amount: result.totalWin,
          tone: result.bigWinTier,
        });
      }

      if (result.freeSpinsCompleted) {
        await present({
          title: tr('win.freeComplete'),
          subtitle: tr('win.freeTotal'),
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
        if (latest.auto && !result.isFreeSpin && latest.autoLeft !== null) {
          const left = latest.autoLeft - 1;
          latest.setAutoLeft(left);
          if (left <= 0) latest.setAuto(false);
        }

        // Free Spins already play one after another; auto spin also continues normal spins.
        const wantsNext = useGameStore.getState().auto || freeSpinsLeft;
        if (wantsNext && !freeSpinsLeft && result.balanceAfter < latest.bet) {
          latest.setAuto(false);
          latest.setError(tr('hud.autoStopped'));
        } else if (wantsNext) {
          nextSpinTimer.current = window.setTimeout(
            () => void spinRef.current(),
            useGameStore.getState().turbo ? TURBO_NEXT_SPIN_DELAY_MS : NEXT_FREE_SPIN_DELAY_MS,
          );
        }
      }
    } catch (cause) {
      useGameStore.getState().setAuto(false);
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

  /** One button: starts auto spin when it is off, stops it when it is running. */
  const toggleAuto = () => {
    const store = useGameStore.getState();
    if (store.auto) {
      store.setAuto(false);
      // Free Spins that are already running keep their own automatic chain.
      if (store.session.freeSpinsRemaining === 0) clearNextSpin();
      return;
    }
    store.setAutoLeft(store.autoLimit);
    store.setAuto(true);
    void spinRef.current(); // no-op if a spin is already in progress; that spin will chain the next
  };

  const skipSpin = () => {
    skippedRef.current = true;
    controllerRef.current?.skip();
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
        message={cause instanceof Error ? cause.message : t('status.loadFailed')}
        onRetry={() => {
          void config.refetch();
          void gameState.refetch();
        }}
      />
    );
  }
  if (!booted || !config.data) return <LoadingScreen label={t('status.enterPalace')} />;

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
            aria-label={t('game.settings')}
            onClick={() => setSettingsOpen(true)}
          >
            <GearIcon />
          </button>
          <button
            type="button"
            className={styles.iconButton}
            aria-label={muted ? t('game.unmute') : t('game.mute')}
            aria-pressed={muted}
            onClick={() => useGameStore.getState().setMuted(!muted)}
          >
            <SoundIcon muted={muted} />
          </button>
          <button
            type="button"
            className={styles.iconButton}
            aria-label={t('game.paytable')}
            onClick={() => setPaytableOpen(true)}
          >
            <PaytableIcon />
          </button>
        </div>
        <div className={styles.logoSlot}>
          <Logo size="md" />
        </div>
        <div className={`${styles.side} ${styles.sideRight}`}>
          <LanguageSwitch />
          <span className="demo-badge">{t('common.demoMode')}</span>
        </div>
      </header>

      <main className={styles.stage}>
        <div ref={hostRef} className={styles.host} data-testid="game-canvas-host" />
        {!engineReady && !engineError ? (
          <div className={styles.stageMessage} role="status">
            {t('status.preparing')}
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
        onAutoToggle={toggleAuto}
        autoLimit={autoLimit}
        autoLeft={autoLeft}
        onAutoLimitChange={(limit) => useGameStore.getState().setAutoLimit(limit)}
        turbo={turbo}
        onTurboChange={(next) => useGameStore.getState().setTurbo(next)}
        onSkip={skipSpin}
      />

      <PaytableModal
        open={paytableOpen}
        paytable={config.data.paytable}
        bets={config.data.bets}
        bet={displayBet}
        onClose={() => setPaytableOpen(false)}
      />

      <SettingsPanel
        isAdmin={me.data?.role === 'ADMIN'}
        onOpenPaytable={() => {
          setSettingsOpen(false);
          setPaytableOpen(true);
        }}
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
