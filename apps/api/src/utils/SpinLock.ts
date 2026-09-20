/**
 * In-process guard against overlapping spins for the same player (double clicks, replayed
 * requests). The database row lock (SELECT ... FOR UPDATE) protects across processes.
 */
export class SpinLock {
  private readonly active = new Set<string>();

  tryAcquire(userId: string): boolean {
    if (this.active.has(userId)) return false;
    this.active.add(userId);
    return true;
  }

  release(userId: string): void {
    this.active.delete(userId);
  }
}
