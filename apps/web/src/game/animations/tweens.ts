import type Phaser from 'phaser';

/** Resolves after `ms` of scene time. */
export const delay = (scene: Phaser.Scene, ms: number): Promise<void> =>
  new Promise((resolve) => {
    scene.time.delayedCall(ms, () => resolve());
  });

/** Runs a tween and resolves when it completes. */
export const tweenAsync = (
  scene: Phaser.Scene,
  config: Phaser.Types.Tweens.TweenBuilderConfig,
): Promise<void> =>
  new Promise((resolve) => {
    scene.tweens.add({ ...config, onComplete: () => resolve() });
  });

export const rand = (min: number, max: number): number => min + Math.random() * (max - min);

/**
 * Cosmetic-only randomness (particle scatter, lightning jitter).
 * Game OUTCOMES are never decided on the client.
 */
export const jitter = (amount: number): number => rand(-amount, amount);
