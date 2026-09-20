import Phaser from 'phaser';
import { isScatter, isWild, type SymbolId } from '@mahjong/shared';
import { COLOR, TEXTURE, TILE_H, TILE_W } from '../config';

/**
 * One Mahjong tile: ivory ceramic artwork + gold win outline + soft glow. Every regular symbol
 * shares the exact same construction; only the texture changes. Wilds and Scatters idle-glow.
 */
export class MahjongTile extends Phaser.GameObjects.Container {
  symbol: SymbolId;
  private readonly sprite: Phaser.GameObjects.Image;
  private readonly glow: Phaser.GameObjects.Image;
  private readonly outline: Phaser.GameObjects.Graphics;
  private idleTween: Phaser.Tweens.Tween | null = null;
  private shakeTween: Phaser.Tweens.Tween | null = null;
  private shakeBaseX = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, symbol: SymbolId) {
    super(scene, x, y);
    this.symbol = symbol;

    this.glow = scene.add
      .image(0, 0, TEXTURE.glow)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDisplaySize(TILE_W * 1.9, TILE_H * 1.7)
      .setAlpha(0);
    this.sprite = scene.add.image(0, 0, symbol).setDisplaySize(TILE_W, TILE_H);
    this.outline = scene.add.graphics().setAlpha(0);
    this.outline.lineStyle(3.5, COLOR.goldLight, 1);
    this.outline.strokeRoundedRect(-TILE_W / 2 + 3, -TILE_H / 2 + 3, TILE_W - 6, TILE_H - 14, 15);
    this.outline.lineStyle(9, COLOR.gold, 0.28);
    this.outline.strokeRoundedRect(-TILE_W / 2 + 1, -TILE_H / 2 + 1, TILE_W - 2, TILE_H - 10, 17);

    this.add([this.glow, this.sprite, this.outline]);
    this.setSize(TILE_W, TILE_H);
    scene.add.existing(this);
    this.refreshIdle();
  }

  setSymbol(symbol: SymbolId): void {
    this.symbol = symbol;
    this.sprite.setTexture(symbol).setDisplaySize(TILE_W, TILE_H);
    this.refreshIdle();
  }

  /** Wilds glow gold and Scatters glow warm red, even when nothing is happening. */
  private refreshIdle(): void {
    this.idleTween?.remove();
    this.idleTween = null;
    this.glow.clearTint();

    if (isWild(this.symbol) || isScatter(this.symbol)) {
      if (isScatter(this.symbol)) this.glow.setTint(0xff8a70);
      this.glow.setAlpha(0.3);
      this.idleTween = this.scene.tweens.add({
        targets: this.glow,
        alpha: isWild(this.symbol) ? 0.62 : 0.5,
        duration: 1100 + Math.random() * 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else {
      this.glow.setAlpha(0);
    }
  }

  setWinHighlight(on: boolean): void {
    this.outline.setAlpha(on ? 1 : 0);
    if (on) {
      this.idleTween?.pause();
      this.glow.clearTint();
      this.glow.setAlpha(isWild(this.symbol) ? 0.95 : 0.4);
    } else {
      this.idleTween?.resume();
      this.refreshIdle();
    }
  }

  /** Bright white/gold flash used when the Dragon transforms a tile. */
  flash(color: number): void {
    this.sprite.setTintFill(color);
  }

  clearFlash(): void {
    this.sprite.clearTint();
  }

  startShake(): void {
    if (this.shakeTween) return;
    this.shakeBaseX = this.x;
    this.shakeTween = this.scene.tweens.add({
      targets: this,
      x: { from: this.shakeBaseX - 3.5, to: this.shakeBaseX + 3.5 },
      angle: { from: -1.6, to: 1.6 },
      duration: 42,
      yoyo: true,
      repeat: -1,
    });
  }

  stopShake(): void {
    this.shakeTween?.remove();
    this.shakeTween = null;
    this.x = this.shakeBaseX || this.x;
    this.setAngle(0);
  }

  override destroy(fromScene?: boolean): void {
    this.idleTween?.remove();
    this.shakeTween?.remove();
    this.scene?.tweens.killTweensOf(this);
    super.destroy(fromScene);
  }
}
