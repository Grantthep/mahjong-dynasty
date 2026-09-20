import Phaser from 'phaser';
import { CSS_COLOR, FONT_DISPLAY } from '../config';
import { formatCredits } from '../../utils/format';

/** "+250" that pops up over winning tiles, drifts upward and fades. */
export class FloatingWinText extends Phaser.GameObjects.Text {
  static spawn(scene: Phaser.Scene, x: number, y: number, amount: number): FloatingWinText {
    const text = new FloatingWinText(scene, x, y, `+${formatCredits(amount)}`);
    scene.add.existing(text);
    text.play(y);
    return text;
  }

  private constructor(scene: Phaser.Scene, x: number, y: number, label: string) {
    super(scene, x, y, label, {
      fontFamily: FONT_DISPLAY,
      fontSize: '44px',
      fontStyle: 'bold',
      color: CSS_COLOR.goldLight,
      stroke: CSS_COLOR.dark,
      strokeThickness: 7,
    });
    this.setOrigin(0.5).setDepth(40).setScale(0.5).setAlpha(0);
    this.setShadow(0, 0, CSS_COLOR.gold, 14, true, true);
  }

  private play(startY: number): void {
    this.scene.tweens.add({
      targets: this,
      scale: 1,
      alpha: 1,
      duration: 200,
      ease: 'Back.easeOut',
    });
    this.scene.tweens.add({
      targets: this,
      y: startY - 64,
      alpha: 0,
      delay: 640,
      duration: 520,
      ease: 'Sine.easeIn',
      onComplete: () => this.destroy(),
    });
  }
}
