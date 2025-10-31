/*
  Warnings:

  - A unique constraint covering the columns `[firebaseUid]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "authProvider" TEXT NOT NULL DEFAULT 'email',
ADD COLUMN     "firebaseUid" TEXT,
ADD COLUMN     "photoURL" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_firebaseUid_key" ON "users"("firebaseUid");
