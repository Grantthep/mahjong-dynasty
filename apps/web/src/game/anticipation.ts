import { isScatter, type Board, type Position } from '@mahjong/shared';

/** Free Spins need 3 Lotus. With this many showing, the game "hunts" for the last one. */
export const HUNT_SCATTERS = 2;

/** How much slower the tiles that could bring the last Lotus fall (1 = normal speed). */
export const HUNT_SLOW = 1.9;

export function scatterPositions(board: Board): Position[] {
  const found: Position[] = [];
  board.forEach((column, col) =>
    column.forEach((symbol, row) => {
      if (isScatter(symbol)) found.push({ col, row });
    }),
  );
  return found;
}

/**
 * When a fresh board drops reel by reel (left to right): the reel on which the SECOND Lotus lands,
 * provided at least one reel is still to come. `null` when there is nothing to hunt for: fewer than
 * two Lotus, three or more already landed by that reel, or the second one is on the last reel.
 */
export function huntingReel(board: Board): number | null {
  let landed = 0;
  for (let col = 0; col < board.length; col++) {
    landed += board[col]?.filter(isScatter).length ?? 0;
    if (landed > HUNT_SCATTERS) return null;
    if (landed === HUNT_SCATTERS) return col < board.length - 1 ? col : null;
  }
  return null;
}

/** Exactly two Lotus are showing, so the tiles that fall next could bring the third. */
export const isHunting = (board: Board): boolean =>
  scatterPositions(board).length === HUNT_SCATTERS;

/** Did the hunt succeed? (Free Spins need three or more.) */
export const huntSucceeded = (boardAfter: Board): boolean =>
  scatterPositions(boardAfter).length > HUNT_SCATTERS;
