import styles from './HUD.module.css';

interface Props {
  spinning: boolean;
  disabled?: boolean;
  freeSpin?: boolean;
  onClick: () => void;
}

/** Large premium SPIN control: dark jade centre, thin gold border, rotating dragon ornament while spinning. */
export function SpinButton({ spinning, disabled = false, freeSpin = false, onClick }: Props) {
  return (
    <button
      type="button"
      className={`${styles.spin} ${spinning ? styles.spinning : ''} ${freeSpin ? styles.freeSpin : ''}`}
      aria-label={freeSpin ? 'Free spin' : 'Spin'}
      aria-busy={spinning}
      disabled={disabled || spinning}
      onClick={onClick}
    >
      <img
        className={styles.ornament}
        src="/assets/ui/spin-ornament.svg"
        alt=""
        draggable={false}
      />
      <span className={styles.spinLabel}>{freeSpin ? 'FREE SPIN' : 'SPIN'}</span>
    </button>
  );
}
