import { Link } from 'react-router-dom';
import styles from './SettingsPanel.module.css';

interface Props {
  open: boolean;
  muted: boolean;
  volume: number;
  musicVolume: number;
  sfxVolume: number;
  username?: string;
  onClose: () => void;
  onMutedChange: (muted: boolean) => void;
  onVolumeChange: (volume: number) => void;
  onMusicVolumeChange: (volume: number) => void;
  onSfxVolumeChange: (volume: number) => void;
  onLogout: () => void;
}

export function SettingsPanel({
  open,
  muted,
  volume,
  musicVolume,
  sfxVolume,
  username,
  onClose,
  onMutedChange,
  onVolumeChange,
  onMusicVolumeChange,
  onSfxVolumeChange,
  onLogout,
}: Props) {
  if (!open) return null;
  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <h2>Settings</h2>
          <button
            type="button"
            className={styles.close}
            aria-label="Close settings"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        {username ? <p className={styles.user}>Playing as {username}</p> : null}

        <label className={styles.row}>
          <span>Sound</span>
          <input
            type="checkbox"
            checked={!muted}
            onChange={(event) => onMutedChange(!event.target.checked)}
            aria-label="Sound on"
          />
        </label>
        <label className={styles.row}>
          <span>Master volume</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(volume * 100)}
            disabled={muted}
            onChange={(event) => onVolumeChange(Number(event.target.value) / 100)}
            aria-label="Volume"
          />
        </label>
        <label className={styles.row}>
          <span>Music</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(musicVolume * 100)}
            disabled={muted}
            onChange={(event) => onMusicVolumeChange(Number(event.target.value) / 100)}
            aria-label="Music volume"
          />
        </label>
        <label className={styles.row}>
          <span>Effects</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(sfxVolume * 100)}
            disabled={muted}
            onChange={(event) => onSfxVolumeChange(Number(event.target.value) / 100)}
            aria-label="Effects volume"
          />
        </label>

        <nav className={styles.links}>
          <Link to="/profile">Profile &amp; history</Link>
          <Link to="/about">About &amp; paytable</Link>
          <Link to="/">Home</Link>
          <button type="button" className={styles.logout} onClick={onLogout}>
            Log out
          </button>
        </nav>

        <p className={styles.note}>
          Virtual DEMO CREDITS only. No deposits, withdrawals or real-money wagering.
        </p>
      </div>
    </div>
  );
}
