import styles from './Logo.module.css';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  /** Use "h1" on pages where the logo is the main heading. */
  as?: 'div' | 'h1';
}

/** Original HTML/CSS logo: antique-gold type, subtle jade glow, small dragon ornament. */
export function Logo({ size = 'md', as: Tag = 'div' }: Props) {
  return (
    <Tag className={`${styles.logo} ${styles[size]}`} aria-label="Mahjong Dynasty: Dragon Fortune">
      <span className={styles.ornament} aria-hidden="true">
        <i />
        <img src="/assets/ui/dragon-icon.svg" alt="" draggable={false} />
        <i />
      </span>
      <span className={styles.title} aria-hidden="true">
        MAHJONG DYNASTY
      </span>
      <span className={styles.sub} aria-hidden="true">
        <b />
        DRAGON FORTUNE
        <b />
      </span>
    </Tag>
  );
}
