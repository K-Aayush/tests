/*
  Warnings:

  - You are about to drop the column `patientId` on the `identifiers` table. All the data in the column will be lost.
  - Added the required column `addressableId` to the `addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `addressableType` to the `addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `identifiableId` to the `identifiers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `identifiableType` to the `identifiers` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "addresses" DROP CONSTRAINT "addresses_patientId_fkey";

-- DropForeignKey
ALTER TABLE "identifiers" DROP CONSTRAINT "identifiers_patientId_fkey";

-- AlterTable
ALTER TABLE "addresses" ADD COLUMN     "addressableId" TEXT NOT NULL,
ADD COLUMN     "addressableType" TEXT NOT NULL,
ALTER COLUMN "patientId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "identifiers" DROP COLUMN "patientId",
ADD COLUMN     "identifiableId" TEXT NOT NULL,
ADD COLUMN     "identifiableType" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "login_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jti" TEXT NOT NULL,
    "iat" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_attempts" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "key_rotation_logs" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "rotatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rotatedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "key_rotation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "login_sessions_jti_key" ON "login_sessions"("jti");

-- CreateIndex
CREATE UNIQUE INDEX "key_rotation_logs_version_key" ON "key_rotation_logs"("version");

-- AddForeignKey
ALTER TABLE "login_sessions" ADD CONSTRAINT "login_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
