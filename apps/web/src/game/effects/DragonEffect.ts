import Phaser from 'phaser';
import type { DragonFortuneEvent } from '@mahjong/shared';
import { delay, jitter, rand, tweenAsync } from '../animations/tweens';
import type { AudioManager } from '../audio/AudioManager';
import {
  BOARD_H,
  BOARD_Y,
  COLOR,
  CSS_COLOR,
  FONT_DISPLAY,
  GAME_H,
  GAME_W,
  TEXTURE,
  TIMING,
} from '../config';
import type { DragonMeter } from '../objects/DragonMeter';
import type { GameBoard } from '../objects/GameBoard';
import type { MahjongTile } from '../objects/MahjongTile';
import type { WinEffect } from './WinEffect';

export interface DragonHooks {
  onDim(on: boolean): void;
}

const DRAGON_SCALE = 0.62;
const START_X = -560;
const END_X = GAME_W + 620;

/**
 * THE signature moment. The screen darkens, the meter flashes gold, a golden dragon sweeps across
 * the board and strikes the server-chosen tiles, which shake, flash and become Golden Dragon Wilds.
 */
export class DragonEffect {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly board: GameBoard,
    private readonly meter: DragonMeter,
    private readonly audio: AudioManager,
    private readonly winEffect: WinEffect,
  ) {}

  async play(event: DragonFortuneEvent, hooks: DragonHooks): Promise<void> {
    const { scene } = this;
    const targets = this.board.getTiles(event.positions);

    // 1-2. Normal movement has stopped (the caller awaited it). Darken the screen.
    hooks.onDim(true);
    const dim = this.board.createDim(50);
    scene.tweens.add({ targets: dim, alpha: 0.5, duration: 380 });
    void this.audio.play('dragon-fortune');

    // 3. Dragon meter flashes gold.
    await this.meter.flash();

    const title = scene.add
      .text(GAME_W / 2, BOARD_Y + 96, 'DRAGON FORTUNE!', {
        fontFamily: FONT_DISPLAY,
        fontSize: '60px',
        fontStyle: 'bold',
        color: CSS_COLOR.goldLight,
        stroke: CSS_COLOR.dark,
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(60)
      .setAlpha(0)
      .setScale(0.5)
      .setShadow(0, 0, CSS_COLOR.gold, 24, true, true);
    scene.tweens.add({ targets: title, alpha: 1, scale: 1, duration: 520, ease: 'Back.easeOut' });

    // 4. Golden particles enter the screen.
    this.goldenRush();

    // Chosen tiles rise above the darkness and start to tremble.
    this.board.liftTiles(targets, 52);
    targets.forEach((tile) => tile.startShake());
    await delay(scene, 550);

    // 5-8. The dragon travels across the board; energy strikes each chosen tile as its head passes.
    const dragon = scene.add
      .image(START_X, BOARD_Y + BOARD_H / 2, TEXTURE.dragon)
      .setDepth(55)
      .setScale(DRAGON_SCALE)
      .setAlpha(0);
    const glow = scene.add
      .image(START_X, BOARD_Y + BOARD_H / 2, TEXTURE.glow)
      .setDepth(54)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDisplaySize(620, 320)
      .setAlpha(0);

    const remaining = [...targets].sort((a, b) => a.x - b.x);
    const strikes: Promise<void>[] = [];
    const centerY = BOARD_Y + BOARD_H / 2;

    const travel = new Promise<void>((resolve) => {
      scene.tweens.addCounter({
        from: 0,
        to: 1,
        duration: TIMING.dragonTravel,
        ease: 'Sine.easeInOut',
        onUpdate: (tween) => {
          const p = tween.getValue() ?? 0;
          dragon.x = START_X + (END_X - START_X) * p;
          dragon.y = centerY + Math.sin(p * Math.PI * 5) * 16;
          dragon.setAngle(Math.cos(p * Math.PI * 5) * 1.6);
          dragon.setAlpha(Math.min(1, p * 10));
          glow.setPosition(dragon.x + 60, dragon.y).setAlpha(Math.min(0.7, p * 6));

          const head = { x: dragon.x + 255, y: dragon.y - 44 };
          while (remaining.length > 0 && head.x >= (remaining[0] as MahjongTile).x - 40) {
            strikes.push(this.strike(remaining.shift() as MahjongTile, head));
          }
        },
        onComplete: () => resolve(),
      });
    });

    await travel;
    // Safety net: anything the head somehow missed still transforms.
    remaining
      .splice(0)
      .forEach((tile) => strikes.push(this.strike(tile, { x: tile.x - 120, y: tile.y - 60 })));
    await Promise.all(strikes);

    // 11-12. Dragon exits, brightness returns.
    dragon.destroy();
    glow.destroy();
    scene.tweens.add({ targets: title, alpha: 0, scale: 1.15, duration: 420 });
    await tweenAsync(scene, { targets: dim, alpha: 0, duration: 450 });
    hooks.onDim(false);
    title.destroy();
    dim.destroy();
    this.board.restoreTiles(targets);
    this.board.syncTo(event.boardAfter);
  }

  private goldenRush(): void {
    for (let i = 0; i < 42; i++) {
      const fromLeft = Math.random() < 0.5;
      const spark = this.scene.add
        .image(fromLeft ? -20 : GAME_W + 20, rand(60, GAME_H - 60), TEXTURE.particle)
        .setDepth(56)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setScale(rand(0.4, 1.2));
      this.scene.tweens.add({
        targets: spark,
        x: GAME_W / 2 + jitter(260),
        y: BOARD_Y + BOARD_H / 2 + jitter(200),
        alpha: 0,
        duration: rand(900, 1500),
        delay: rand(0, 700),
        ease: 'Cubic.easeOut',
        onComplete: () => spark.destroy(),
      });
    }
  }

  /** Lightning from the dragon's head to a tile, then white/gold flash and transformation. */
  private async strike(tile: MahjongTile, from: { x: number; y: number }): Promise<void> {
    const { scene } = this;
    void this.audio.play('wild');

    const bolt = scene.add.graphics().setDepth(58);
    const points: Phaser.Math.Vector2[] = [new Phaser.Math.Vector2(from.x, from.y)];
    const segments = 6;
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      points.push(
        new Phaser.Math.Vector2(
          from.x + (tile.x - from.x) * t + jitter(22),
          from.y + (tile.y - from.y) * t + jitter(22),
        ),
      );
    }
    points.push(new Phaser.Math.Vector2(tile.x, tile.y));
    const draw = (width: number, color: number, alpha: number) => {
      bolt.lineStyle(width, color, alpha);
      bolt.strokePoints(points);
    };
    draw(12, COLOR.gold, 0.45);
    draw(5, COLOR.goldLight, 0.95);
    draw(2, COLOR.white, 1);
    scene.tweens.add({ targets: bolt, alpha: 0, duration: 320, onComplete: () => bolt.destroy() });

    tile.flash(COLOR.white);
    await delay(scene, 95);
    tile.flash(COLOR.goldLight);
    await delay(scene, 95);

    tile.stopShake();
    tile.clearFlash();
    tile.setSymbol('wild-dragon');
    tile.setScale(1.35);
    this.winEffect.burst(tile.x, tile.y, 16);
    await tweenAsync(scene, { targets: tile, scale: 1, duration: 300, ease: 'Back.easeOut' });
  }
}
