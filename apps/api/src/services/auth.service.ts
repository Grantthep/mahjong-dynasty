import bcrypt from 'bcrypt';
import { Prisma, type PrismaClient, type User } from '@prisma/client';
import {
  STARTING_BALANCE,
  type LoginInput,
  type RegisterInput,
  type UserDTO,
} from '@mahjong/shared';
import { AppError, Errors } from '../utils/AppError';

export const toUserDTO = (user: User): UserDTO => ({
  id: user.id,
  email: user.email,
  username: user.username,
  demoBalance: user.demoBalance,
  role: user.role,
  createdAt: user.createdAt.toISOString(),
});

export class AuthService {
  private dummyHash: Promise<string> | null = null;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly bcryptRounds: number,
  ) {}

  async register(input: RegisterInput): Promise<User> {
    const passwordHash = await bcrypt.hash(input.password, this.bcryptRounds);
    try {
      return await this.prisma.user.create({
        data: {
          email: input.email,
          username: input.username,
          passwordHash,
          demoBalance: STARTING_BALANCE,
          session: { create: {} },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = String(error.meta?.target ?? '');
        throw target.includes('username')
          ? Errors.conflict('USERNAME_TAKEN', 'That username is already taken')
          : Errors.conflict('EMAIL_TAKEN', 'An account with that email already exists');
      }
      throw error;
    }
  }

  async login(input: LoginInput): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    // Always run a bcrypt comparison so response time does not reveal whether the email exists.
    const hash = user?.passwordHash ?? (await this.getDummyHash());
    const valid = await bcrypt.compare(input.password, hash);
    if (!user || !valid) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password');
    }
    return user;
  }

  async getUser(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw Errors.unauthorized('Account no longer exists');
    return user;
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= bcrypt.hash('not-a-real-password', this.bcryptRounds);
    return this.dummyHash;
  }
}
