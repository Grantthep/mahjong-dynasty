import type Phaser from 'phaser';
import { tweenAsync } from '../animations/tweens';
import { COLOR, TEXTURE, TIMING } from '../config';
import type { MahjongTile } from '../objects/MahjongTile';

/** Gold outline + gentle pulse + a few golden sparks. Calm by default, strong only on wins. */
export class WinEffect {
  constructor(private readonly scene: Phaser.Scene) {}

  burst(x: number, y: number, count = 7): void {
    const emitter = this.scene.add.particles(x, y, TEXTURE.particle, {
      speed: { min: 40, max: 160 },
      lifespan: { min: 350, max: 750 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [COLOR.goldLight, COLOR.gold],
      blendMode: 'ADD',
      emitting: false,
    });
    emitter.setDepth(30);
    emitter.explode(count);
    this.scene.time.delayedCall(900, () => emitter.destroy());
  }

  /** Outline + pulse the winning tiles. Resolves once the pulse has finished. */
  async highlight(tiles: readonly MahjongTile[]): Promise<void> {
    tiles.forEach((tile) => {
      tile.setWinHighlight(true);
      this.burst(tile.x, tile.y, 6);
    });
    await Promise.all(
      tiles.map((tile) =>
        tweenAsync(this.scene, {
          targets: tile,
          scale: 1.07,
          duration: TIMING.pulse / 4,
          yoyo: true,
          repeat: 1,
          ease: 'Sine.easeInOut',
        }),
      ),
    );
  }
}
