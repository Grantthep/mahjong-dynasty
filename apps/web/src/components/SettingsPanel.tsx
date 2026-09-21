import { Link } from 'react-router-dom';
import { useT } from '../i18n';
import { LanguageSwitch } from './LanguageSwitch';
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
  onOpenPaytable?: () => void;
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
  onOpenPaytable,
}: Props) {
  const t = useT();
  if (!open) return null;

  const slider = (
    label: string,
    ariaLabel: string,
    value: number,
    onChange: (next: number) => void,
  ) => (
    <label className={styles.row}>
      <span>{label}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        disabled={muted}
        onChange={(event) => onChange(Number(event.target.value) / 100)}
        aria-label={ariaLabel}
      />
    </label>
  );

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={t('settings.title')}
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <h2>{t('settings.title')}</h2>
          <button
            type="button"
            className={styles.close}
            aria-label={t('settings.close')}
            onClick={onClose}
          >
            ×
          </button>
        </header>

        {username ? (
          <p className={styles.user}>{t('settings.playingAs', { name: username })}</p>
        ) : null}

        <label className={styles.row}>
          <span>{t('settings.sound')}</span>
          <input
            type="checkbox"
            checked={!muted}
            onChange={(event) => onMutedChange(!event.target.checked)}
            aria-label={t('settings.soundOn')}
          />
        </label>
        {slider(t('settings.master'), 'Volume', volume, onVolumeChange)}
        {slider(t('settings.music'), 'Music volume', musicVolume, onMusicVolumeChange)}
        {slider(t('settings.effects'), 'Effects volume', sfxVolume, onSfxVolumeChange)}
        <div className={styles.row}>
          <span>{t('lang.label')}</span>
          <LanguageSwitch />
        </div>

        <nav className={styles.links}>
          {onOpenPaytable ? (
            <button type="button" className={styles.linkButton} onClick={onOpenPaytable}>
              {t('settings.paytable')}
            </button>
          ) : null}
          <Link to="/profile">{t('settings.profile')}</Link>
          <Link to="/leaderboard">{t('nav.leaderboard')}</Link>
          <Link to="/about">{t('settings.about')}</Link>
        </nav>

        <p className={styles.note}>{t('settings.note')}</p>
      </div>
    </div>
  );
}
