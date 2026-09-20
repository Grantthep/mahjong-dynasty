/**
 * Seeds (or resets) the demo account:
 *   email:    demo@mahjong.local
 *   username: demo_player
 *   password: Demo1234!
 * Run:  npm run db:seed
 */
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { STARTING_BALANCE } from '@mahjong/shared';

const prisma = new PrismaClient();

const DEMO = { email: 'demo@mahjong.local', username: 'demo_player', password: 'Demo1234!' };

async function main() {
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

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
