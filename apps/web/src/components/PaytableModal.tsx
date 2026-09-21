import type { PublicGameConfig } from '@mahjong/shared';
import { useT } from '../i18n';
import { Paytable } from './Paytable';
import styles from './SettingsPanel.module.css';

interface Props {
  open: boolean;
  paytable: PublicGameConfig['paytable'];
  bets: readonly number[];
  /** The bet currently selected in the game. */
  bet: number;
  onClose: () => void;
}

/** In-game paytable: shows the credits each symbol pays at the chosen bet. */
export function PaytableModal({ open, paytable, bets, bet, onClose }: Props) {
  const t = useT();
  if (!open) return null;
  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.panel}
        style={{ width: 'min(560px, 100%)', maxHeight: '90dvh', overflowY: 'auto' }}
        role="dialog"
        aria-modal="true"
        aria-label={t('paytable.title')}
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <h2>{t('paytable.title')}</h2>
          <button
            type="button"
            className={styles.close}
            aria-label={t('common.close')}
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <Paytable paytable={paytable} bets={bets} initialBet={bet} />
      </div>
    </div>
  );
}
