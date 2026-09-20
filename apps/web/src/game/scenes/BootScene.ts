import Phaser from 'phaser';

/** Configures the renderer and hands over to the PreloadScene. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    // Transparent canvas: the React palace background shows through around the board.
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
    this.scene.start('Preload');
  }
}
