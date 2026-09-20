import Phaser from 'phaser';
import { formatMultiplier } from '../../utils/format';
import { CSS_COLOR, FONT_DISPLAY } from '../config';

/** "×3 / MULTIPLIER". Values slide down into place: ×1 ↓ ×2 ↓ ×3 ↓ ×5 ↓ ×8. */
export class MultiplierDisplay extends Phaser.GameObjects.Container {
  private current: Phaser.GameObjects.Text;
  private readonly label: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    this.setDepth(20);
    this.current = this.makeValueText('×1');
    this.label = scene.add
      .text(0, 34, 'MULTIPLIER', {
        fontFamily: FONT_DISPLAY,
        fontSize: '15px',
        fontStyle: '600',
        color: CSS_COLOR.muted,
      })
      .setOrigin(0.5);
    this.add([this.current, this.label]);
    scene.add.existing(this);
    this.setIdle(1);
  }

  private makeValueText(text: string): Phaser.GameObjects.Text {
    const value = this.scene.add
      .text(0, 0, text, {
        fontFamily: FONT_DISPLAY,
        fontSize: '54px',
        fontStyle: 'bold',
        color: CSS_COLOR.goldLight,
        stroke: CSS_COLOR.dark,
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    value.setShadow(0, 0, CSS_COLOR.gold, 12, true, true);
    return value;
  }

  /** Resting state between spins (dim). */
  setIdle(value: number): void {
    this.scene.tweens.killTweensOf([this.current, this.label]);
    this.current.setText(formatMultiplier(value)).setAlpha(0.45).setScale(0.86).setY(0);
    this.label.setAlpha(0.5);
  }

  /** Shows a new multiplier with a slide-down + punch animation. */
  show(value: number): Promise<void> {
    return new Promise((resolve) => {
      const previous = this.current;
      const next = this.makeValueText(formatMultiplier(value)).setY(-38).setAlpha(0).setScale(0.8);
      this.add(next);
      this.current = next;
      this.label.setAlpha(1).setColor(CSS_COLOR.gold);

      this.scene.tweens.add({
        targets: previous,
        y: 38,
        alpha: 0,
        duration: 260,
        ease: 'Sine.easeIn',
        onComplete: () => previous.destroy(),
      });
      this.scene.tweens.add({
        targets: next,
        y: 0,
        alpha: 1,
        scale: { from: 1.5, to: 1 },
        duration: 380,
        ease: 'Back.easeOut',
        onComplete: () => resolve(),
      });
    });
  }
}
