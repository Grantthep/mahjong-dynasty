import type {
  BigWinTier,
  Board,
  CascadeStep,
  DragonFortuneEvent,
  SessionSnapshot,
  SpinMode,
  SpinOutcome,
} from '@mahjong/shared';
import { findScatters } from './boardUtils';
import { BoardGenerator } from './BoardGenerator';
import { CascadeEngine } from './CascadeEngine';
import { GAME_CONFIG, type GameConfig } from './config/gameConfig';
import { DragonFortuneEngine } from './DragonFortuneEngine';
import { FreeSpinEngine } from './FreeSpinEngine';
import { MultiplierEngine } from './MultiplierEngine';
import type { RandomSource } from './RandomSource';
import { WildReelRespinEngine } from './WildReelRespinEngine';
import { WinEvaluator } from './WinEvaluator';

/**
 * Orchestrates one complete spin: board -> wins -> cascades -> multipliers -> Dragon Fortune
 * -> Free Spins. Pure game logic: no HTTP, database, React or Phaser. The only source of
 * randomness is the injected RandomSource.
 */
export class GameEngine {
  private readonly generator: BoardGenerator;
  private readonly evaluator: WinEvaluator;
  private readonly cascade = new CascadeEngine();
  private readonly multipliers: MultiplierEngine;
  private readonly dragon: DragonFortuneEngine;
  private readonly freeSpins: FreeSpinEngine;
  private readonly wildReels: WildReelRespinEngine;

  constructor(
    rng: RandomSource,
    private readonly config: GameConfig = GAME_CONFIG,
  ) {
    this.generator = new BoardGenerator(rng, config);
    this.evaluator = new WinEvaluator(config);
    this.multipliers = new MultiplierEngine(config);
    this.dragon = new DragonFortuneEngine(rng, config);
    this.freeSpins = new FreeSpinEngine(config);
    this.wildReels = new WildReelRespinEngine(rng, this.generator, config);
  }

  bigWinTier(win: number, bet: number): BigWinTier {
    if (bet <= 0) return 'none';
    const ratio = win / bet;
    const { big, mega, epic } = this.config.bigWin;
    if (ratio >= epic) return 'epic';
    if (ratio >= mega) return 'mega';
    if (ratio >= big) return 'big';
    return 'none';
  }

  /**
   * @param session Persisted state before the spin.
   * @param requestedBet Bet chosen by the player (ignored during Free Spins, which use the locked bet).
   */
  playSpin(session: SessionSnapshot, requestedBet: number): SpinOutcome {
    const isFreeSpin = session.freeSpinsRemaining > 0;
    const bet = isFreeSpin ? session.freeSpinBet : requestedBet;
    const mode: SpinMode = isFreeSpin ? 'free' : 'base';
    const winCap = bet * this.config.maxWinMultiplier;

    const initialBoard = this.generator.generateBoard(mode);
    const wildReelRespin = this.wildReels.tryRespin(initialBoard, mode);
    let board: Board = wildReelRespin?.board ?? initialBoard;
    let meter = session.dragonMeter;
    let totalWin = 0;
    let cappedAtMaxWin = false;
    let dragonFortuneTriggers = 0;
    const cascades: CascadeStep[] = [];

    for (let index = 1; index <= this.config.maxCascades; index++) {
      const evaluation = this.evaluator.evaluate(board, bet);
      if (evaluation.wins.length === 0) break;

      const multiplier = this.multipliers.getMultiplier(index, mode);
      let win = this.multipliers.apply(evaluation.baseWin, multiplier);
      if (totalWin + win >= winCap) {
        win = winCap - totalWin;
        cappedAtMaxWin = true;
      }
      totalWin += win;

      const meterBefore = meter;
      const fill = this.dragon.fill(meter, index);
      meter = fill.triggered ? 0 : fill.meter;

      const collapsed = this.cascade.collapse(board, evaluation.positions, (col) =>
        this.generator.generateSymbol(col, mode),
      );
      let boardAfter = collapsed.board;

      let dragonFortune: DragonFortuneEvent | null = null;
      if (fill.triggered) {
        dragonFortuneTriggers++;
        const positions = this.dragon.selectTargets(boardAfter);
        boardAfter = this.dragon.transform(boardAfter, positions);
        dragonFortune = { positions, boardAfter };
      }

      cascades.push({
        index,
        board,
        wins: evaluation.wins,
        winningPositions: evaluation.positions,
        baseWin: evaluation.baseWin,
        multiplier,
        win,
        runningWin: totalWin,
        meterBefore,
        meterAfter: fill.meter,
        moves: collapsed.moves,
        spawns: collapsed.spawns,
        boardAfter: collapsed.board,
        dragonFortune,
      });

      board = boardAfter;
      if (cappedAtMaxWin) break;
    }

    const scatterPositions = findScatters(board);
    const scatterCount = scatterPositions.length;
    const transition = this.freeSpins.advance(session, {
      isFreeSpin,
      bet,
      totalWin,
      scatterCount,
      dragonMeter: meter,
    });

    return {
      bet,
      isFreeSpin,
      freeSpinIndex: isFreeSpin ? session.freeSpinsTotal - session.freeSpinsRemaining + 1 : 0,
      initialBoard,
      wildReelRespin,
      cascades,
      finalBoard: board,
      totalWin,
      cappedAtMaxWin,
      bigWinTier: this.bigWinTier(totalWin, bet),
      scatterCount,
      scatterPositions,
      freeSpinsAwarded: transition.awarded,
      freeSpinsRetriggered: transition.retriggered,
      freeSpinsCompleted: transition.completed,
      freeSpinsWinTotal: transition.roundWinTotal,
      dragonMeterBefore: session.dragonMeter,
      dragonMeterAfter: meter,
      dragonFortuneTriggers,
      session: transition.session,
    };
  }
}
