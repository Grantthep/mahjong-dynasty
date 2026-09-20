/**
 * Monte-Carlo simulation of the game engine.
 *
 *   npm run simulate
 *   npm run simulate -- --spins=100000
 *   npm run simulate -- --spins=50000 --bet=50 --seed=42
 */
import { runSimulation } from './game/simulation';
import { CryptoRandomSource, SeededRandomSource, type RandomSource } from './game/RandomSource';

function readArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

const spins = Number(readArg('spins') ?? 100_000);
const bet = Number(readArg('bet') ?? 20);
const seed = readArg('seed');

if (!Number.isInteger(spins) || spins <= 0) {
  console.error('Invalid --spins value (expected a positive integer).');
  process.exit(1);
}

// A seed makes the run reproducible (development only); otherwise use the secure source.
const rng: RandomSource = seed ? new SeededRandomSource(seed) : new CryptoRandomSource();

const started = performance.now();
const report = runSimulation(spins, rng, bet);
const seconds = ((performance.now() - started) / 1000).toFixed(2);

const n = (value: number) => value.toLocaleString('en-US');
const pct = (value: number, digits = 2) => `${(value * 100).toFixed(digits)}%`;
const oneIn = (frequency: number) =>
  frequency > 0 ? `1 in ${(1 / frequency).toFixed(1)} spins` : 'never';

console.log('');
console.log('=======================================================');
console.log(' MAHJONG DYNASTY: DRAGON FORTUNE - SIMULATION REPORT');
console.log('=======================================================');
console.log(` Mode                         : DEMO CREDITS (virtual)`);
console.log(` Bet per paid spin            : ${n(bet)}${seed ? `   (seed: ${seed})` : ''}`);
console.log(` Spins (paid)                 : ${n(report.paidSpins)}`);
console.log(` Free Spins played            : ${n(report.freeSpins)}`);
console.log(` Total Demo Credits Bet       : ${n(report.totalBet)}`);
console.log(` Total Demo Credits Returned  : ${n(report.totalReturned)}`);
console.log(`   - from base game           : ${n(report.baseGameReturned)}`);
console.log(`   - from Free Spins          : ${n(report.freeSpinReturned)}`);
console.log(` Observed Demo Return Ratio   : ${pct(report.returnRatio)}`);
console.log(` Hit Frequency (all spins)    : ${pct(report.hitFrequency)}`);
console.log(` Average Cascades per spin    : ${report.averageCascades.toFixed(3)}`);
console.log(
  ` Free Spin Frequency          : ${pct(report.freeSpinFrequency)}  (${oneIn(report.freeSpinFrequency)})`,
);
console.log(
  ` Dragon Fortune Frequency     : ${pct(report.dragonFortuneFrequency)}  (${oneIn(report.dragonFortuneFrequency)})`,
);
console.log(
  ` Largest Demo Win             : ${n(report.largestWin)}  (${report.largestWinMultiple.toFixed(1)}x bet)`,
);
console.log(` Simulated in                 : ${seconds}s`);
console.log('-------------------------------------------------------');
console.log(' FOR DEVELOPMENT / DEMONSTRATION ONLY');
console.log(' NOT CERTIFIED GAME MATH');
console.log('=======================================================');
console.log('');
