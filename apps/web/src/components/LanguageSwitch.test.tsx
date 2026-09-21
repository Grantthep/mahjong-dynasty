import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { BET_OPTIONS } from '@mahjong/shared';
import { useLanguage } from '../i18n';
import { HUD } from './HUD';
import { LanguageSwitch } from './LanguageSwitch';

afterEach(() => {
  useLanguage.getState().setLang('en');
  localStorage.clear();
});

describe('LanguageSwitch', () => {
  it('switches the game controls to Chinese and remembers the choice', async () => {
    render(
      <>
        <LanguageSwitch />
        <HUD
          balance={10_000}
          win={0}
          bet={20}
          bets={BET_OPTIONS}
          spinning={false}
          onBetChange={() => undefined}
          onSpin={() => undefined}
        />
      </>,
    );
    expect(screen.getByText('DEMO BALANCE')).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Language' }), 'zh');

    expect(screen.getByText('演示余额')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '旋转' })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('zh-CN');
    expect(localStorage.getItem('mjd.lang')).toBe('zh');
  });

  it('lists both languages by their own name', () => {
    render(<LanguageSwitch />);
    const options = screen.getAllByRole('option').map((option) => option.textContent);
    expect(options).toEqual(['English', '中文']);
  });
});
