import Phaser from 'phaser';
import type { Position } from '@mahjong/shared';
import { delay, rand, tweenAsync } from '../animations/tweens';
import type { AudioManager } from '../audio/AudioManager';
import { COLOR, CSS_COLOR, FONT_DISPLAY, GAME_H, GAME_W, TEXTURE } from '../config';
import type { GameBoard } from '../objects/GameBoard';

export interface ScatterHooks {
  onDim(on: boolean): void;
  /** Called at the moment the banner appears: the palace transforms into its Free Spins look. */
  onEnterFreeSpins(): void;
  /** Canvas text in the player's language. */
  labels: { freeSpins: string; awarded: (spins: number, retrigger: boolean) => string };
}

/** Lotus Scatters glow, golden particles gather in the centre and FREE SPINS is announced. */
export class ScatterEffect {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly board: GameBoard,
    private readonly audio: AudioManager,
  ) {}

  async play(
    positions: readonly Position[],
    spins: number,
    retrigger: boolean,
    hooks: ScatterHooks,
  ): Promise<void> {
    const { scene } = this;
    void this.audio.play('scatter');
    hooks.onDim(true);

    const dim = this.board.createDim(50);
    scene.tweens.add({ targets: dim, alpha: 0.5, duration: 320 });

    const lotuses = this.board.getTiles(positions);
    this.board.liftTiles(lotuses, 52);
    lotuses.forEach((tile) => tile.setWinHighlight(true));
    await Promise.all(
      lotuses.map((tile) =>
        tweenAsync(scene, {
          targets: tile,
          scale: 1.16,
          duration: 260,
          yoyo: true,
          repeat: 1,
          ease: 'Sine.easeInOut',
        }),
      ),
    );

    // Golden particles travel to the centre of the screen.
    const cx = GAME_W / 2;
    const cy = GAME_H / 2 - 30;
    const sparks: Promise<void>[] = [];
    lotuses.forEach((tile) => {
      for (let i = 0; i < 9; i++) {
        const spark = scene.add
          .image(tile.x + rand(-20, 20), tile.y + rand(-20, 20), TEXTURE.particle)
          .setDepth(56)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setScale(rand(0.5, 1.1));
        sparks.push(
          tweenAsync(scene, {
            targets: spark,
            x: cx + rand(-30, 30),
            y: cy + rand(-20, 20),
            scale: 0.15,
            alpha: 0,
            delay: i * 40,
            duration: 720,
            ease: 'Cubic.easeIn',
          }).then(() => spark.destroy()),
        );
      }
    });
    await Promise.all(sparks);

    // Banner.
    void this.audio.play('free-spins');
    const banner = scene.add.container(cx, cy).setDepth(60).setAlpha(0).setScale(0.6);
    const glow = scene.add
      .image(0, 0, TEXTURE.glow)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDisplaySize(720, 360)
      .setAlpha(0.8);
    const line = scene.add.graphics();
    line.fillStyle(COLOR.jadeDark, 0.9).fillRoundedRect(-300, -74, 600, 160, 18);
    line.lineStyle(1.5, COLOR.gold, 0.95).strokeRoundedRect(-300, -74, 600, 160, 18);
    line
      .lineStyle(2, COLOR.gold, 0.9)
      .lineBetween(-250, -54, 250, -54)
      .lineBetween(-250, 70, 250, 70);
    const heading = scene.add
      .text(0, -10, hooks.labels.freeSpins, {
        fontFamily: FONT_DISPLAY,
        fontSize: '68px',
        fontStyle: 'bold',
        color: CSS_COLOR.goldLight,
        stroke: CSS_COLOR.dark,
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setShadow(0, 0, CSS_COLOR.gold, 22, true, true);
    const sub = scene.add
      .text(0, 46, hooks.labels.awarded(spins, retrigger), {
        fontFamily: FONT_DISPLAY,
        fontSize: '30px',
        fontStyle: '600',
        color: CSS_COLOR.ivory,
        stroke: CSS_COLOR.dark,
        strokeThickness: 5,
      })
      .setOrigin(0.5);
    banner.add([glow, line, heading, sub]);
    await tweenAsync(scene, {
      targets: banner,
      alpha: 1,
      scale: 1,
      duration: 480,
      ease: 'Back.easeOut',
    });

    if (!retrigger) hooks.onEnterFreeSpins();
    await delay(scene, 1800);

    scene.tweens.add({
      targets: [banner, dim],
      alpha: 0,
      duration: 420,
      onComplete: () => {
        banner.destroy();
        dim.destroy();
      },
    });
    lotuses.forEach((tile) => tile.setWinHighlight(false));
    await delay(scene, 420);
    this.board.restoreTiles(lotuses);
    hooks.onDim(false);
  }
}
