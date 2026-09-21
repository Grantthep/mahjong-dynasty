import Phaser from 'phaser';
import type { WildReelRespin } from '@mahjong/shared';
import { delay, tweenAsync } from '../animations/tweens';
import type { AudioManager } from '../audio/AudioManager';
import {
  BOARD_H,
  BOARD_Y,
  CELL_H,
  CELL_W,
  COLOR,
  COLS,
  CSS_COLOR,
  FONT_DISPLAY,
  GAME_W,
  TEXTURE,
  tileX,
} from '../config';
import type { GameBoard } from '../objects/GameBoard';
import type { WinEffect } from './WinEffect';

/**
 * Wild Reel Respin: the reels the server locked turn fully Golden Wild (gold outline, flash and a
 * burst per tile), then every other reel drops away and the server's new symbols drop in.
 */
export class WildReelEffect {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly board: GameBoard,
    private readonly audio: AudioManager,
    private readonly winEffect: WinEffect,
  ) {}

  async play(respin: WildReelRespin, label: string): Promise<void> {
    const { scene } = this;
    const locked = new Set(respin.reels);
    const others = Array.from({ length: COLS }, (_, col) => col).filter((col) => !locked.has(col));

    void this.audio.play('wild');
    const banner = this.showBanner(label);
    const frames = respin.reels.map((col) => this.frame(col));

    // The locked reels turn into Wilds, top to bottom.
    const transforms: Promise<void>[] = [];
    respin.reels.forEach((col, reelIndex) => {
      const rows = respin.board[col]?.length ?? 0;
      for (let row = 0; row < rows; row++) {
        const tile = this.board.getTile(col, row);
        if (!tile) continue;
        transforms.push(
          delay(scene, reelIndex * 90 + row * 70).then(async () => {
            if (tile.symbol === 'wild-dragon') return;
            tile.flash(COLOR.white);
            await delay(scene, 80);
            tile.clearFlash();
            tile.setSymbol('wild-dragon');
            tile.setScale(1.25);
            this.winEffect.burst(tile.x, tile.y, 10);
            await tweenAsync(scene, {
              targets: tile,
              scale: 1,
              duration: 240,
              ease: 'Back.easeOut',
            });
          }),
        );
      }
    });
    await Promise.all(transforms);
    await delay(scene, 260);

    // Everything else respins with the server's new symbols.
    await this.board.dropOutReels(others);
    await this.board.dropInReels(respin.board, others);
    await delay(scene, 180);

    const overlays = [banner, ...frames];
    scene.tweens.add({
      targets: overlays,
      alpha: 0,
      duration: 320,
      onComplete: () => overlays.forEach((item) => item.destroy()),
    });
  }

  private frame(col: number): Phaser.GameObjects.Graphics {
    const frame = this.scene.add.graphics().setDepth(20).setAlpha(0);
    const x = tileX(col) - CELL_W / 2 + 2;
    frame
      .lineStyle(9, COLOR.gold, 0.3)
      .strokeRoundedRect(x - 2, BOARD_Y - 2, CELL_W - 2, BOARD_H + 4, 14);
    frame.lineStyle(3, COLOR.goldLight, 1).strokeRoundedRect(x, BOARD_Y, CELL_W - 6, BOARD_H, 12);
    this.scene.tweens.add({ targets: frame, alpha: 1, duration: 220 });
    return frame;
  }

  private showBanner(label: string): Phaser.GameObjects.Container {
    const { scene } = this;
    const banner = scene.add
      .container(GAME_W / 2, BOARD_Y + CELL_H * 0.5)
      .setDepth(60)
      .setAlpha(0)
      .setScale(0.7);
    const glow = scene.add
      .image(0, 0, TEXTURE.glow)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDisplaySize(620, 150)
      .setAlpha(0.7);
    const text = scene.add
      .text(0, 0, label, {
        fontFamily: FONT_DISPLAY,
        fontSize: '44px',
        fontStyle: 'bold',
        color: CSS_COLOR.goldLight,
        stroke: CSS_COLOR.dark,
        strokeThickness: 7,
      })
      .setOrigin(0.5)
      .setShadow(0, 0, CSS_COLOR.gold, 18, true, true);
    banner.add([glow, text]);
    scene.tweens.add({ targets: banner, alpha: 1, scale: 1, duration: 320, ease: 'Back.easeOut' });
    return banner;
  }
}
