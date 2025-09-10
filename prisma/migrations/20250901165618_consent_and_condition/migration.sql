-- CreateEnum
CREATE TYPE "ConditionClinicalStatus" AS ENUM ('active', 'recurrence', 'relapse', 'inactive', 'remission', 'resolved');

-- CreateEnum
CREATE TYPE "ConditionVerificationStatus" AS ENUM ('unconfirmed', 'provisional', 'differential', 'confirmed', 'refuted', 'entered_in_error');

-- CreateEnum
CREATE TYPE "ConditionCategory" AS ENUM ('problem_list_item', 'encounter_diagnosis');

-- CreateEnum
CREATE TYPE "ConditionSeverity" AS ENUM ('mild', 'moderate', 'severe');

-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('draft', 'proposed', 'active', 'rejected', 'inactive', 'entered_in_error');

-- CreateEnum
CREATE TYPE "ConsentCategory" AS ENUM ('privacy', 'treatment', 'research', 'advance_directive', 'disclosure');

-- CreateTable
CREATE TABLE "conditions" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "clinicalStatus" "ConditionClinicalStatus" NOT NULL,
    "verificationStatus" "ConditionVerificationStatus" NOT NULL,
    "category" "ConditionCategory",
    "severity" "ConditionSeverity",
    "code" TEXT NOT NULL,
    "codeSystem" TEXT,
    "codeDisplay" TEXT,
    "subjectId" TEXT NOT NULL,
    "encounterId" TEXT,
    "onsetDateTime" TIMESTAMP(3),
    "recordedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedBy" TEXT,
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consents" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "status" "ConsentStatus" NOT NULL,
    "category" "ConsentCategory" NOT NULL,
    "patientId" TEXT NOT NULL,
    "organizationId" TEXT,
    "dateTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "provision" JSONB,
    "sourceAttachment" TEXT,
    "grantedBy" TEXT,
    "witnessedBy" TEXT,
    "scope" TEXT,
    "purpose" TEXT[],
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conditions_externalId_key" ON "conditions"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "consents_externalId_key" ON "consents"("externalId");

-- AddForeignKey
ALTER TABLE "conditions" ADD CONSTRAINT "conditions_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conditions" ADD CONSTRAINT "conditions_recordedBy_fkey" FOREIGN KEY ("recordedBy") REFERENCES "practitioners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consents" ADD CONSTRAINT "consents_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
