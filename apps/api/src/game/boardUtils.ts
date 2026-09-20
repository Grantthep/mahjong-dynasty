import { isScatter, type Board, type Position, type SymbolId } from '@mahjong/shared';

export const cloneBoard = (board: Board): Board => board.map((column) => [...column]);

export function findPositions(board: Board, predicate: (symbol: SymbolId) => boolean): Position[] {
  const found: Position[] = [];
  board.forEach((column, col) => {
    column.forEach((symbol, row) => {
      if (predicate(symbol)) found.push({ col, row });
    });
  });
  return found;
}

export const findScatters = (board: Board): Position[] => findPositions(board, isScatter);

export const positionKey = ({ col, row }: Position): string => `${col}:${row}`;

export function uniquePositions(positions: Position[]): Position[] {
  const seen = new Set<string>();
  const unique: Position[] = [];
  for (const position of positions) {
    const key = positionKey(position);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(position);
    }
  }
  return unique;
}
