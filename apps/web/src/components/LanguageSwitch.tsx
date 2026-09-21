import { LANGUAGE_CODES, useLanguage, useT, type Language } from '../i18n';
import { LANGUAGES } from '../i18n/translations';
import styles from './LanguageSwitch.module.css';

/** Small language picker (English / 中文). The choice is remembered in the browser. */
export function LanguageSwitch() {
  const t = useT();
  const lang = useLanguage((state) => state.lang);
  const setLang = useLanguage((state) => state.setLang);

  return (
    <select
      className={styles.select}
      aria-label={t('lang.label')}
      value={lang}
      onChange={(event) => setLang(event.target.value as Language)}
    >
      {LANGUAGE_CODES.map((code) => (
        <option key={code} value={code}>
          {LANGUAGES[code]['lang.name']}
        </option>
      ))}
    </select>
  );
}
