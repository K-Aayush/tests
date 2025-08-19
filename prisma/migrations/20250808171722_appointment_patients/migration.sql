/*
  Warnings:

  - A unique constraint covering the columns `[externalId]` on the table `patients` will be added. If there are existing duplicate values, this will fail.
  - The required column `externalId` was added to the `patients` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "externalId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'scheduled',
    "type" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "patientId" TEXT NOT NULL,
    "providerId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "appointments_externalId_key" ON "appointments"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "patients_externalId_key" ON "patients"("externalId");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
