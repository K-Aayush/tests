-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('draft', 'requested', 'received', 'accepted', 'rejected', 'ready', 'cancelled', 'in_progress', 'on_hold', 'failed', 'completed', 'entered_in_error');

-- CreateEnum
CREATE TYPE "TaskIntent" AS ENUM ('unknown', 'proposal', 'plan', 'order', 'original_order', 'reflex_order', 'filler_order', 'instance_order', 'option');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('routine', 'urgent', 'asap', 'stat');

-- CreateTable
CREATE TABLE "practitioners" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT,
    "prefix" TEXT,
    "suffix" TEXT,
    "npi" TEXT,
    "specialty" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "practitioners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'draft',
    "intent" "TaskIntent" NOT NULL DEFAULT 'unknown',
    "priority" "TaskPriority" DEFAULT 'routine',
    "code" TEXT NOT NULL,
    "description" TEXT,
    "focusId" TEXT,
    "focusType" TEXT,
    "requesterId" TEXT,
    "ownerId" TEXT,
    "executionPeriodStart" TIMESTAMP(3),
    "executionPeriodEnd" TIMESTAMP(3),
    "authoredOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastModified" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "practitioners_npi_key" ON "practitioners"("npi");

-- CreateIndex
CREATE UNIQUE INDEX "practitioners_email_key" ON "practitioners"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tasks_externalId_key" ON "tasks"("externalId");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "practitioners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "practitioners"("id") ON DELETE SET NULL ON UPDATE CASCADE;
