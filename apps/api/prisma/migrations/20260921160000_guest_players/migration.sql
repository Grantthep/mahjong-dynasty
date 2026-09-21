-- Players are anonymous guests now: no sign-up, log-in or administrator role.

-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "email",
DROP COLUMN "passwordHash",
DROP COLUMN "role";

-- DropEnum
DROP TYPE "Role";
