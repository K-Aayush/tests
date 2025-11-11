/*
  Warnings:

  - You are about to drop the column `firebaseUid` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[authProviderId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "users_firebaseUid_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "firebaseUid",
ADD COLUMN     "authProviderId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_authProviderId_key" ON "users"("authProviderId");
