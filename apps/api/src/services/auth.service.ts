import { randomInt } from 'node:crypto';
import { Prisma, type PrismaClient, type User } from '@prisma/client';
import { STARTING_BALANCE, type UserDTO } from '@mahjong/shared';
import { Errors } from '../utils/AppError';

export const toUserDTO = (user: User): UserDTO => ({
  id: user.id,
  username: user.username,
  demoBalance: user.demoBalance,
  createdAt: user.createdAt.toISOString(),
});

/** Players are anonymous guests: no email, no password. The browser keeps a signed cookie. */
export class AuthService {
  constructor(private readonly prisma: PrismaClient) {}

  /** A new guest: a random name (Guest4821), 10,000 DEMO CREDITS and a fresh game session. */
  async createGuest(): Promise<User> {
    for (let attempt = 0; attempt < 8; attempt++) {
      // Short names first; longer ones only if the short ones are running out.
      const number = attempt < 4 ? randomInt(1000, 10_000) : randomInt(100_000, 1_000_000);
      try {
        return await this.prisma.user.create({
          data: {
            username: `Guest${number}`,
            demoBalance: STARTING_BALANCE,
            session: { create: {} },
          },
        });
      } catch (error) {
        const taken =
          error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
        if (!taken) throw error;
      }
    }
    throw Errors.conflict('NAME_UNAVAILABLE', 'Could not pick a guest name. Please try again.');
  }

  async findUser(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  async getUser(userId: string): Promise<User> {
    const user = await this.findUser(userId);
    if (!user) throw Errors.unauthorized('Account no longer exists');
    return user;
  }
}
