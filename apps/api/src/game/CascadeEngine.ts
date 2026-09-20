import type { Board, CascadeMove, CascadeSpawn, Position, SymbolId } from '@mahjong/shared';

export interface CollapseResult {
  board: Board;
  moves: CascadeMove[];
  spawns: CascadeSpawn[];
}

/**
 * Removes winning tiles, lets the survivors fall (gravity) and fills the gaps at the top with
 * new tiles. Returns the exact tile movements so the client can animate the server result.
 */
export class CascadeEngine {
  collapse(
    board: Board,
    removed: readonly Position[],
    nextSymbol: (col: number) => SymbolId,
  ): CollapseResult {
    const moves: CascadeMove[] = [];
    const spawns: CascadeSpawn[] = [];

    const removedByCol = new Map<number, Set<number>>();
    for (const { col, row } of removed) {
      const rows = removedByCol.get(col) ?? new Set<number>();
      rows.add(row);
      removedByCol.set(col, rows);
    }

    const next: Board = board.map((column, col) => {
      const gone = removedByCol.get(col);
      if (!gone || gone.size === 0) return [...column];

      const survivors: { symbol: SymbolId; fromRow: number }[] = [];
      column.forEach((symbol, row) => {
        if (!gone.has(row)) survivors.push({ symbol, fromRow: row });
      });

      const emptyCount = column.length - survivors.length;
      const newColumn: SymbolId[] = [];

      for (let row = 0; row < emptyCount; row++) {
        const symbol = nextSymbol(col);
        newColumn.push(symbol);
        spawns.push({ col, row, symbol });
      }

      survivors.forEach(({ symbol, fromRow }, index) => {
        const toRow = emptyCount + index;
        newColumn.push(symbol);
        if (fromRow !== toRow) moves.push({ col, fromRow, toRow });
      });

      return newColumn;
    });

    return { board: next, moves, spawns };
  }
}
