/*
  Warnings:

  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('PATIENT', 'PRACTITIONER', 'ORGANIZATION');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "role";

-- CreateTable
CREATE TABLE "user_entity_links" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_entity_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_entity_links_userId_entityId_entityType_key" ON "user_entity_links"("userId", "entityId", "entityType");

-- AddForeignKey
ALTER TABLE "user_entity_links" ADD CONSTRAINT "user_entity_links_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
