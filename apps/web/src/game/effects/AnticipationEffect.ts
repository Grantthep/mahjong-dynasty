import Phaser from 'phaser';
import { delay, tweenAsync } from '../animations/tweens';
import type { AudioManager } from '../audio/AudioManager';
import { BOARD_H, BOARD_Y, COLOR, CSS_COLOR, FONT_DISPLAY, GAME_W, TEXTURE } from '../config';
import type { GameBoard } from '../objects/GameBoard';
import type { MahjongTile } from '../objects/MahjongTile';

export interface AnticipationHooks {
  /** True while the game is hunting for the last Lotus (drives a screen-reader announcement). */
  onHunt(on: boolean): void;
  labels: { oneMore: string };
}

export interface Hunt {
  /** Ends the suspense. `landed` says whether the third Lotus arrived. */
  end(landed: boolean): Promise<void>;
}

const BUILD_UP_MS = 800;
const FADE_MS = 320;

/**
 * "One more Lotus...": two Lotus scatters are showing, so everything else darkens, the two glow
 * red and shake with a heartbeat, a banner says what is at stake, and the tiles that could bring
 * the last one fall in slow motion. Purely cosmetic: the server already decided the result.
 */
export class AnticipationEffect {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly board: GameBoard,
    private readonly audio: AudioManager,
  ) {}

  async begin(lotuses: readonly MahjongTile[], hooks: AnticipationHooks): Promise<Hunt> {
    const { scene } = this;
    hooks.onHunt(true);
    void this.audio.play('anticipation');

    const dim = this.board.createDim(50);
    scene.tweens.add({ targets: dim, alpha: 0.5, duration: 300 });
    this.board.liftTiles(lotuses, 52);

    const glows = lotuses.map((tile) => {
      const glow = scene.add
        .image(tile.x, tile.y, TEXTURE.glow)
        .setDepth(51)
        .setTint(0xff4a30)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDisplaySize(230, 250)
        .setAlpha(0.25);
      scene.tweens.add({
        targets: glow,
        alpha: 0.85,
        duration: 340,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      return glow;
    });

    const pulses = lotuses.map((tile) => {
      tile.setWinHighlight(true);
      tile.startShake();
      return scene.tweens.add({
        targets: tile,
        scale: { from: 1, to: 1.12 },
        duration: 340,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });

    const banner = this.createBanner(hooks.labels.oneMore);
    await delay(scene, BUILD_UP_MS);

    return {
      end: async (landed: boolean) => {
        hooks.onHunt(false);
        pulses.forEach((pulse) => pulse.remove());
        glows.forEach((glow) => scene.tweens.killTweensOf(glow));
        scene.tweens.killTweensOf(banner);
        banner.list.forEach((child) => scene.tweens.killTweensOf(child)); // the throbbing text
        // A miss fades away quietly; a hit hands over to the FREE SPINS banner straight away.
        await Promise.all([
          tweenAsync(scene, {
            targets: [dim, banner, ...glows],
            alpha: 0,
            duration: landed ? FADE_MS / 2 : FADE_MS,
          }),
          ...lotuses.map((tile) =>
            tweenAsync(scene, { targets: tile, scale: 1, duration: FADE_MS / 2 }),
          ),
        ]);
        lotuses.forEach((tile) => {
          tile.stopShake();
          tile.setWinHighlight(false);
        });
        this.board.restoreTiles(lotuses);
        [dim, banner, ...glows].forEach((item) => item.destroy());
      },
    };
  }

  private createBanner(label: string): Phaser.GameObjects.Container {
    const { scene } = this;
    // A plaque hanging from the bottom edge of the board frame, clear of the multiplier below it.
    const banner = scene.add
      .container(GAME_W / 2, BOARD_Y + BOARD_H + 18)
      .setDepth(60)
      .setAlpha(0)
      .setScale(0.85);
    const text = scene.add
      .text(0, 0, label, {
        fontFamily: FONT_DISPLAY,
        fontSize: '32px',
        fontStyle: 'bold',
        color: '#ffd9d3',
        stroke: CSS_COLOR.dark,
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setShadow(0, 0, '#ff4a30', 16, true, true);
    const width = text.width + 56;
    const height = 46;
    const plate = scene.add.graphics();
    plate
      .fillStyle(COLOR.jadeDark, 0.94)
      .fillRoundedRect(-width / 2, -height / 2, width, height, 14);
    plate
      .lineStyle(1.5, COLOR.gold, 0.95)
      .strokeRoundedRect(-width / 2, -height / 2, width, height, 14);
    banner.add([plate, text]);
    scene.tweens.add({ targets: banner, alpha: 1, scale: 1, duration: 260, ease: 'Back.easeOut' });
    // A slow throb so the line feels like a heartbeat rather than a caption.
    scene.tweens.add({
      targets: text,
      alpha: { from: 1, to: 0.55 },
      duration: 420,
      yoyo: true,
      repeat: -1,
      delay: 260,
    });
    return banner;
  }
}
