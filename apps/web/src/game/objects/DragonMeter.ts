import Phaser from 'phaser';
import { DRAGON_METER_MAX } from '@mahjong/shared';
import { tweenAsync } from '../animations/tweens';
import { COLOR, CSS_COLOR, FONT_DISPLAY, TEXTURE } from '../config';

const WIDTH = 480;
const HEIGHT = 16;

/** Dragon head icon + progress bar + percentage. Glows from 80% and pulses gold at 100%. */
export class DragonMeter extends Phaser.GameObjects.Container {
  private readonly track: Phaser.GameObjects.Graphics;
  private readonly fill: Phaser.GameObjects.Graphics;
  private readonly flashLayer: Phaser.GameObjects.Graphics;
  private readonly glow: Phaser.GameObjects.Graphics;
  private readonly percent: Phaser.GameObjects.Text;
  private readonly label: Phaser.GameObjects.Text;
  private readonly icon: Phaser.GameObjects.Image;
  private readonly shown = { value: 0 };
  private glowTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    this.setDepth(20);

    this.track = scene.add.graphics();
    this.track
      .fillStyle(COLOR.jadeDark, 0.92)
      .fillRoundedRect(-WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT, HEIGHT / 2);
    this.track
      .lineStyle(1.2, COLOR.gold, 0.7)
      .strokeRoundedRect(-WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT, HEIGHT / 2);

    this.fill = scene.add.graphics();
    this.flashLayer = scene.add.graphics().setAlpha(0);
    this.glow = scene.add.graphics().setAlpha(0);
    this.glow
      .lineStyle(6, COLOR.goldLight, 0.35)
      .strokeRoundedRect(-WIDTH / 2 - 3, -HEIGHT / 2 - 3, WIDTH + 6, HEIGHT + 6, HEIGHT / 2 + 3);
    this.glow
      .lineStyle(2, COLOR.goldLight, 0.95)
      .strokeRoundedRect(-WIDTH / 2 - 1, -HEIGHT / 2 - 1, WIDTH + 2, HEIGHT + 2, HEIGHT / 2 + 1);

    this.icon = scene.add.image(-WIDTH / 2 - 34, 0, TEXTURE.dragonIcon).setDisplaySize(44, 44);
    this.label = scene.add
      .text(-WIDTH / 2, -HEIGHT / 2 - 15, 'DRAGON FORTUNE', {
        fontFamily: FONT_DISPLAY,
        fontSize: '12px',
        fontStyle: '600',
        color: CSS_COLOR.gold,
      })
      .setOrigin(0, 0.5);
    this.percent = scene.add
      .text(WIDTH / 2 + 14, 0, '0%', {
        fontFamily: FONT_DISPLAY,
        fontSize: '19px',
        fontStyle: 'bold',
        color: CSS_COLOR.ivory,
      })
      .setOrigin(0, 0.5);

    this.add([
      this.track,
      this.fill,
      this.flashLayer,
      this.glow,
      this.icon,
      this.label,
      this.percent,
    ]);
    scene.add.existing(this);
    this.redraw();
  }

  get value(): number {
    return this.shown.value;
  }

  private redraw(): void {
    const value = Phaser.Math.Clamp(this.shown.value, 0, DRAGON_METER_MAX);
    const width = Math.max(0, (WIDTH - 4) * (value / DRAGON_METER_MAX));

    this.fill.clear();
    if (width > 0) {
      const hot = value >= 80;
      this.fill.fillStyle(hot ? COLOR.goldLight : COLOR.gold, hot ? 0.95 : 0.78);
      this.fill.fillRoundedRect(
        -WIDTH / 2 + 2,
        -HEIGHT / 2 + 2,
        width,
        HEIGHT - 4,
        (HEIGHT - 4) / 2,
      );
      this.fill
        .fillStyle(0xffffff, 0.2)
        .fillRoundedRect(-WIDTH / 2 + 2, -HEIGHT / 2 + 3, width, 4, 2);
    }
    // Segment ticks every 10%.
    this.fill.lineStyle(1, COLOR.jadeDark, 0.55);
    for (let i = 1; i < 10; i++) {
      const tx = -WIDTH / 2 + 2 + ((WIDTH - 4) * i) / 10;
      if (tx < -WIDTH / 2 + 2 + width)
        this.fill.lineBetween(tx, -HEIGHT / 2 + 3, tx, HEIGHT / 2 - 3);
    }
    this.percent.setText(`${Math.round(value)}%`);
  }

  private updateGlow(): void {
    const value = this.shown.value;
    this.glowTween?.remove();
    this.glowTween = null;
    if (value >= DRAGON_METER_MAX) {
      this.glow.setAlpha(1);
      this.glowTween = this.scene.tweens.add({
        targets: this.glow,
        alpha: 0.25,
        duration: 260,
        yoyo: true,
        repeat: -1,
      });
    } else if (value >= 80) {
      this.glow.setAlpha(0.35);
      this.glowTween = this.scene.tweens.add({
        targets: this.glow,
        alpha: 0.9,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else {
      this.glow.setAlpha(0);
    }
  }

  /** Smoothly moves the bar to `target` (0-100). */
  async setValue(target: number, animate = true): Promise<void> {
    const clamped = Phaser.Math.Clamp(target, 0, DRAGON_METER_MAX);
    if (!animate) {
      this.shown.value = clamped;
      this.redraw();
      this.updateGlow();
      return;
    }
    await tweenAsync(this.scene, {
      targets: this.shown,
      value: clamped,
      duration: Math.min(900, 250 + Math.abs(clamped - this.shown.value) * 12),
      ease: 'Cubic.easeOut',
      onUpdate: () => this.redraw(),
    });
    this.shown.value = clamped;
    this.redraw();
    this.updateGlow();
  }

  /** The gold flash that announces Dragon Fortune. */
  async flash(): Promise<void> {
    this.flashLayer.clear();
    this.flashLayer
      .fillStyle(0xfff4c2, 1)
      .fillRoundedRect(-WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT, HEIGHT / 2);
    this.scene.tweens.add({
      targets: this.icon,
      scale: { from: 1.7, to: 1 },
      duration: 420,
      ease: 'Back.easeOut',
    });
    this.scene.tweens.add({
      targets: this.percent,
      scale: { from: 1.5, to: 1 },
      duration: 420,
      ease: 'Back.easeOut',
    });
    await tweenAsync(this.scene, {
      targets: this.flashLayer,
      alpha: { from: 1, to: 0 },
      duration: 240,
      yoyo: true,
      repeat: 2,
    });
    this.flashLayer.setAlpha(0);
  }
}
