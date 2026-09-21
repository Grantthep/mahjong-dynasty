import Phaser from 'phaser';
import type { Board, CascadeMove, CascadeSpawn, Position } from '@mahjong/shared';
import { tweenAsync } from '../animations/tweens';
import type { AudioManager } from '../audio/AudioManager';
import {
  BOARD_H,
  BOARD_W,
  BOARD_X,
  BOARD_Y,
  CELL_H,
  CELL_W,
  COLOR,
  COLS,
  ROWS,
  TIMING,
  tileX,
  tileY,
} from '../config';
import { MahjongTile } from './MahjongTile';

/** The 6 x 4 grid: dark translucent jade panel with a thin antique-gold border and tile logic. */
export class GameBoard {
  private readonly layer: Phaser.GameObjects.Container;
  private tiles: (MahjongTile | null)[][] = Array.from({ length: COLS }, () =>
    Array<MahjongTile | null>(ROWS).fill(null),
  );

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly audio: AudioManager,
  ) {
    this.drawFrame();
    this.layer = scene.add.container(0, 0).setDepth(10);

    // Falling tiles are clipped to the board so they appear to enter from its top edge.
    const shape = scene.make.graphics({ x: 0, y: 0 }, false);
    shape.fillStyle(0xffffff, 1).fillRect(BOARD_X - 10, BOARD_Y - 10, BOARD_W + 20, BOARD_H + 20);
    this.layer.setMask(shape.createGeometryMask());
  }

  private drawFrame(): void {
    const g = this.scene.add.graphics().setDepth(5);
    const x = BOARD_X - 14;
    const y = BOARD_Y - 14;
    const w = BOARD_W + 28;
    const h = BOARD_H + 28;

    g.fillStyle(COLOR.jadeDark, 0.74).fillRoundedRect(x, y, w, h, 20);
    g.fillStyle(0x020b09, 0.4).fillRoundedRect(
      BOARD_X - 5,
      BOARD_Y - 5,
      BOARD_W + 10,
      BOARD_H + 10,
      14,
    );

    g.lineStyle(1, COLOR.gold, 0.12);
    for (let c = 1; c < COLS; c++)
      g.lineBetween(BOARD_X + c * CELL_W, BOARD_Y, BOARD_X + c * CELL_W, BOARD_Y + BOARD_H);
    for (let r = 1; r < ROWS; r++)
      g.lineBetween(BOARD_X, BOARD_Y + r * CELL_H, BOARD_X + BOARD_W, BOARD_Y + r * CELL_H);

    g.lineStyle(1.5, COLOR.gold, 0.95).strokeRoundedRect(x, y, w, h, 20);
    g.lineStyle(1, COLOR.gold, 0.3).strokeRoundedRect(x + 6, y + 6, w - 12, h - 12, 15);

    // Subtle geometric corner ornaments (kept small so they never steal symbol space).
    const corner = (cx: number, cy: number, sx: number, sy: number) => {
      g.lineStyle(2, COLOR.goldLight, 0.95);
      g.beginPath();
      g.moveTo(cx, cy + sy * 30);
      g.lineTo(cx, cy);
      g.lineTo(cx + sx * 30, cy);
      g.strokePath();
      g.lineStyle(1.2, COLOR.gold, 0.6);
      g.beginPath();
      g.moveTo(cx + sx * 8, cy + sy * 20);
      g.lineTo(cx + sx * 8, cy + sy * 8);
      g.lineTo(cx + sx * 20, cy + sy * 8);
      g.strokePath();
      g.fillStyle(COLOR.goldLight, 1);
      g.fillPoints(
        [
          new Phaser.Geom.Point(cx + sx * 3, cy + sy * 3 - 4),
          new Phaser.Geom.Point(cx + sx * 3 + 4, cy + sy * 3),
          new Phaser.Geom.Point(cx + sx * 3, cy + sy * 3 + 4),
          new Phaser.Geom.Point(cx + sx * 3 - 4, cy + sy * 3),
        ],
        true,
      );
    };
    corner(x + 4, y + 4, 1, 1);
    corner(x + w - 4, y + 4, -1, 1);
    corner(x + 4, y + h - 4, 1, -1);
    corner(x + w - 4, y + h - 4, -1, -1);
  }

  /**
   * A translucent black plate covering just the board panel. Used to darken the tiles during
   * Dragon Fortune / Free Spins without leaving a visible rectangle around the whole canvas.
   * Starts fully transparent; tween `alpha` to show it.
   */
  createDim(depth: number): Phaser.GameObjects.Graphics {
    const dim = this.scene.add.graphics().setDepth(depth).setAlpha(0);
    dim
      .fillStyle(0x000000, 1)
      .fillRoundedRect(BOARD_X - 14, BOARD_Y - 14, BOARD_W + 28, BOARD_H + 28, 20);
    return dim;
  }

  getTile(col: number, row: number): MahjongTile | null {
    return this.tiles[col]?.[row] ?? null;
  }

  getTiles(positions: readonly Position[]): MahjongTile[] {
    return positions
      .map(({ col, row }) => this.getTile(col, row))
      .filter((tile): tile is MahjongTile => tile !== null);
  }

  /** Centre of a set of positions in canvas coordinates. */
  centerOf(positions: readonly Position[]): { x: number; y: number } {
    if (positions.length === 0) return { x: BOARD_X + BOARD_W / 2, y: BOARD_Y + BOARD_H / 2 };
    const sum = positions.reduce(
      (acc, p) => ({ x: acc.x + tileX(p.col), y: acc.y + tileY(p.row) }),
      { x: 0, y: 0 },
    );
    return { x: sum.x / positions.length, y: sum.y / positions.length };
  }

  private createTile(
    col: number,
    row: number,
    symbol: Board[number][number],
    y = tileY(row),
  ): MahjongTile {
    const tile = new MahjongTile(this.scene, tileX(col), y, symbol);
    this.layer.add(tile);
    this.tiles[col]![row] = tile;
    return tile;
  }

  private clear(): void {
    this.tiles.flat().forEach((tile) => tile?.destroy());
    this.tiles = Array.from({ length: COLS }, () => Array<MahjongTile | null>(ROWS).fill(null));
  }

  /** Instantly shows a board (used for the initial state and to re-sync after animations). */
  build(board: Board): void {
    this.clear();
    board.forEach((column, col) =>
      column.forEach((symbol, row) => this.createTile(col, row, symbol)),
    );
  }

  /** Makes the visible tiles match `board` exactly (safety net after animations). */
  syncTo(board: Board): void {
    board.forEach((column, col) =>
      column.forEach((symbol, row) => {
        const tile = this.getTile(col, row);
        if (!tile) {
          this.createTile(col, row, symbol);
          return;
        }
        if (tile.symbol !== symbol) tile.setSymbol(symbol);
        tile.setPosition(tileX(col), tileY(row)).setScale(1).setAlpha(1).setAngle(0);
        tile.setWinHighlight(false);
        tile.clearFlash();
      }),
    );
  }

  /** Falls with a small landing bounce. Resolves when the tile has settled. */
  private land(
    tile: MahjongTile,
    toY: number,
    fallMs: number,
    delayMs: number,
    sound: boolean,
  ): Promise<void> {
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: tile,
        y: toY,
        duration: fallMs,
        delay: delayMs,
        ease: 'Cubic.easeIn',
        onComplete: () => {
          if (sound) void this.audio.play('tile-drop');
          this.scene.tweens.add({
            targets: tile,
            y: toY - 7,
            duration: 85,
            yoyo: true,
            ease: 'Sine.easeOut',
            onComplete: () => resolve(),
          });
        },
      });
    });
  }

  /** Old tiles fall away. */
  dropOut(): Promise<void> {
    return this.dropOutReels(Array.from({ length: COLS }, (_, col) => col));
  }

  /** Only the tiles of the given reels fall away (the other reels stay untouched). */
  async dropOutReels(reels: readonly number[]): Promise<void> {
    const leaving: Promise<void>[] = [];
    const chosen = new Set(reels);
    this.tiles.forEach((column, col) => {
      if (!chosen.has(col)) return;
      column.forEach((tile, row) => {
        if (!tile) return;
        leaving.push(
          tweenAsync(this.scene, {
            targets: tile,
            y: tile.y + BOARD_H + 140,
            alpha: 0,
            duration: 280,
            delay: col * 28 + (ROWS - row) * 14,
            ease: 'Cubic.easeIn',
          }).then(() => tile.destroy()),
        );
        column[row] = null;
      });
    });
    await Promise.all(leaving);
  }

  /** New board drops in column by column. */
  dropIn(board: Board): Promise<void> {
    return this.dropInReels(
      board,
      board.map((_, col) => col),
    );
  }

  /** New tiles drop into the given reels only, one reel after the other. */
  async dropInReels(board: Board, reels: readonly number[]): Promise<void> {
    const landing: Promise<void>[] = [];
    reels.forEach((col, position) => {
      const column = board[col];
      if (!column) return;
      for (let row = ROWS - 1; row >= 0; row--) {
        const symbol = column[row]!;
        const tile = this.createTile(col, row, symbol, tileY(row) - BOARD_H - 70);
        const order = position * TIMING.colStagger + (ROWS - 1 - row) * TIMING.rowStagger;
        landing.push(
          this.land(tile, tileY(row), TIMING.dropIn + row * 25, order, row === ROWS - 1),
        );
      }
    });
    await Promise.all(landing);
  }

  /** Winning tiles shrink away. */
  async removeTiles(positions: readonly Position[]): Promise<void> {
    const removing = positions.map(({ col, row }) => {
      const tile = this.getTile(col, row);
      this.tiles[col]![row] = null;
      if (!tile) return Promise.resolve();
      return tweenAsync(this.scene, {
        targets: tile,
        scale: 0.15,
        alpha: 0,
        angle: Phaser.Math.Between(-12, 12),
        duration: TIMING.remove,
        ease: 'Back.easeIn',
      }).then(() => tile.destroy());
    });
    await Promise.all(removing);
  }

  /** Survivors fall and the server-supplied replacement tiles drop in from above. */
  async applyCollapse(
    moves: readonly CascadeMove[],
    spawns: readonly CascadeSpawn[],
  ): Promise<void> {
    const landing: Promise<void>[] = [];

    const movers = moves.map((move) => ({ move, tile: this.getTile(move.col, move.fromRow) }));
    movers.forEach(({ move }) => {
      this.tiles[move.col]![move.fromRow] = null;
    });
    movers.forEach(({ move, tile }) => {
      if (!tile) return;
      this.tiles[move.col]![move.toRow] = tile;
      const distance = move.toRow - move.fromRow;
      landing.push(
        this.land(tile, tileY(move.toRow), TIMING.fall + distance * 45, 0, move.toRow === ROWS - 1),
      );
    });

    const perColumn = new Map<number, number>();
    spawns.forEach((spawn) => perColumn.set(spawn.col, (perColumn.get(spawn.col) ?? 0) + 1));
    spawns.forEach((spawn) => {
      const count = perColumn.get(spawn.col) ?? 1;
      const tile = this.createTile(
        spawn.col,
        spawn.row,
        spawn.symbol,
        tileY(spawn.row - count) - 24,
      );
      landing.push(
        this.land(
          tile,
          tileY(spawn.row),
          TIMING.fall + count * 50,
          (count - 1 - spawn.row) * 30,
          spawn.row === count - 1,
        ),
      );
    });

    await Promise.all(landing);
  }

  /** Temporarily draws tiles above the dimming overlay (Dragon Fortune / Free Spins). */
  liftTiles(tiles: readonly MahjongTile[], depth: number): void {
    tiles.forEach((tile) => {
      this.layer.remove(tile);
      this.scene.add.existing(tile);
      tile.setDepth(depth);
    });
  }

  restoreTiles(tiles: readonly MahjongTile[]): void {
    tiles.forEach((tile) => {
      if (tile.active) this.layer.add(tile);
    });
  }
}
