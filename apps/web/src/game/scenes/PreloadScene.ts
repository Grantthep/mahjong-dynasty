import Phaser from 'phaser';
import { SYMBOL_IDS, SYMBOL_META } from '@mahjong/shared';
import {
  ASSET_PATHS,
  COLOR,
  CSS_COLOR,
  FONT_DISPLAY,
  GAME_H,
  GAME_W,
  TEXTURE,
  TILE_H,
  TILE_W,
} from '../config';
import { isVectorAsset, symbolAssetUrl } from '../assets';

const SYMBOL_TEXTURE_W = TILE_W * 2;
const SYMBOL_TEXTURE_H = TILE_H * 2;

/** Loads all artwork. A missing file never breaks the game: a simple fallback is generated. */
export class PreloadScene extends Phaser.Scene {
  private readonly missing = new Set<string>();

  constructor() {
    super('Preload');
  }

  preload(): void {
    const barW = 360;
    const bg = this.add.graphics();
    const bar = this.add.graphics();
    bg.fillStyle(COLOR.jadeDark, 0.9).fillRoundedRect((GAME_W - barW) / 2, GAME_H / 2, barW, 10, 5);
    bg.lineStyle(1, COLOR.gold, 0.7).strokeRoundedRect(
      (GAME_W - barW) / 2,
      GAME_H / 2,
      barW,
      10,
      5,
    );
    this.add
      .text(GAME_W / 2, GAME_H / 2 - 30, 'Preparing the palace…', {
        fontFamily: FONT_DISPLAY,
        fontSize: '20px',
        color: CSS_COLOR.gold,
      })
      .setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      bar
        .clear()
        .fillStyle(COLOR.gold, 1)
        .fillRoundedRect((GAME_W - barW) / 2, GAME_H / 2, barW * value, 10, 5);
    });
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      this.missing.add(file.key);
      console.warn(
        `[game] Could not load "${file.key}" (${file.url as string}). Using a fallback.`,
      );
    });

    for (const id of SYMBOL_IDS) {
      const url = symbolAssetUrl(id);
      if (isVectorAsset(url))
        this.load.svg(id, url, { width: SYMBOL_TEXTURE_W, height: SYMBOL_TEXTURE_H });
      else this.load.image(id, url);
    }
    this.load.svg(TEXTURE.dragon, ASSET_PATHS.dragon, { width: 1400, height: 360 });
    this.load.svg(TEXTURE.dragonIcon, ASSET_PATHS.dragonIcon, { width: 128, height: 128 });
    this.load.svg(TEXTURE.glow, ASSET_PATHS.glow, { width: 256, height: 256 });
    this.load.svg(TEXTURE.particle, ASSET_PATHS.particle, { width: 64, height: 64 });
  }

  create(): void {
    this.missing.forEach((key) => this.createFallback(key));
    this.scene.start('Game');
  }

  /** Simple generated stand-ins so gameplay continues even if artwork is missing. */
  private createFallback(key: string): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const isSymbol = (SYMBOL_IDS as readonly string[]).includes(key);

    if (isSymbol) {
      const tier = SYMBOL_META[key as (typeof SYMBOL_IDS)[number]].tier;
      const fill = tier === 'special' ? COLOR.jade : 0xf4ebd7;
      g.fillStyle(COLOR.jade, 1).fillRoundedRect(
        12,
        24,
        SYMBOL_TEXTURE_W - 24,
        SYMBOL_TEXTURE_H - 30,
        30,
      );
      g.fillStyle(fill, 1).fillRoundedRect(
        12,
        12,
        SYMBOL_TEXTURE_W - 24,
        SYMBOL_TEXTURE_H - 36,
        30,
      );
      g.lineStyle(4, COLOR.gold, 1).strokeRoundedRect(
        12,
        12,
        SYMBOL_TEXTURE_W - 24,
        SYMBOL_TEXTURE_H - 36,
        30,
      );
      g.generateTexture(key, SYMBOL_TEXTURE_W, SYMBOL_TEXTURE_H);
    } else if (key === TEXTURE.glow || key === TEXTURE.particle) {
      g.fillStyle(COLOR.goldLight, 0.35).fillCircle(32, 32, 32);
      g.fillStyle(COLOR.goldLight, 0.9).fillCircle(32, 32, 12);
      g.generateTexture(key, 64, 64);
    } else if (key === TEXTURE.dragon) {
      g.fillStyle(COLOR.gold, 1).fillRoundedRect(0, 150, 1200, 50, 25);
      g.generateTexture(key, 1400, 360);
    } else {
      g.fillStyle(COLOR.gold, 1).fillCircle(32, 32, 30);
      g.generateTexture(key, 64, 64);
    }
    g.destroy();
  }
}
