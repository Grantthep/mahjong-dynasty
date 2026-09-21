/**
 * Seeds (or resets) the demo account:
 *   email:    demo@mahjong.local
 *   username: demo_player
 *   password: Demo1234!
 * and, outside production, a demo administrator for the analytics dashboard:
 *   email:    admin@mahjong.local
 *   username: demo_admin
 *   password: Admin1234!
 *
 * Run:  npm run db:seed                    (resets the demo player's balance and history)
 *       npm run db:seed -- --admin-only    (only creates/refreshes the administrator)
 */
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { STARTING_BALANCE } from '@mahjong/shared';

const prisma = new PrismaClient();

const ADMIN = { email: 'admin@mahjong.local', username: 'demo_admin', password: 'Admin1234!' };
const DEMO = { email: 'demo@mahjong.local', username: 'demo_player', password: 'Demo1234!' };

async function seedDemoPlayer() {
  const passwordHash = await bcrypt.hash(DEMO.password, 12);

  const user = await prisma.user.upsert({
    where: { email: DEMO.email },
    update: { passwordHash, demoBalance: STARTING_BALANCE },
    create: {
      email: DEMO.email,
      username: DEMO.username,
      passwordHash,
      demoBalance: STARTING_BALANCE,
    },
  });

  // Reset the game session (Dragon meter + Free Spins) and history for a clean demo.
  await prisma.spin.deleteMany({ where: { userId: user.id } });
  await prisma.gameSession.upsert({
    where: { userId: user.id },
    update: {
      dragonMeter: 0,
      freeSpinsRemaining: 0,
      freeSpinsTotal: 0,
      freeSpinBet: 0,
      freeSpinsWin: 0,
    },
    create: { userId: user.id },
  });

  console.info('Seeded demo account (DEMO CREDITS only):');
  console.info(`  email:    ${DEMO.email}`);
  console.info(`  username: ${DEMO.username}`);
  console.info(`  password: ${DEMO.password}`);
  console.info(`  balance:  ${STARTING_BALANCE.toLocaleString('en-US')} demo credits`);
}

async function seedAdmin() {
  // A well-known admin password is fine for a local demo but must never exist in production.
  if (process.env.NODE_ENV === 'production') {
    console.info('Skipping the demo administrator in production.');
    return;
  }
  const passwordHash = await bcrypt.hash(ADMIN.password, 12);
  const admin = await prisma.user.upsert({
    where: { email: ADMIN.email },
    update: { passwordHash, role: 'ADMIN' },
    create: {
      email: ADMIN.email,
      username: ADMIN.username,
      passwordHash,
      role: 'ADMIN',
      demoBalance: STARTING_BALANCE,
    },
  });
  await prisma.gameSession.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id },
  });
  console.info('Seeded demo administrator (dev only):');
  console.info(`  email:    ${ADMIN.email}`);
  console.info(`  password: ${ADMIN.password}`);
}

async function main() {
  if (!process.argv.includes('--admin-only')) await seedDemoPlayer();
  await seedAdmin();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
