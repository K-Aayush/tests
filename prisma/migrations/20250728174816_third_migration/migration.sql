-- CreateEnum
CREATE TYPE "AdministrativeGender" AS ENUM ('male', 'female', 'other', 'unknown');

-- CreateEnum
CREATE TYPE "ContactPointSystem" AS ENUM ('phone', 'fax', 'email', 'sms');

-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('postal', 'physical', 'both');

-- CreateEnum
CREATE TYPE "AddressUse" AS ENUM ('home', 'work', 'temp', 'old', 'billing');

-- CreateEnum
CREATE TYPE "IdentifierUse" AS ENUM ('usual', 'official', 'temp', 'secondary', 'old');

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "preferredName" TEXT,
    "contactPointType" "ContactPointSystem",
    "contactPointValue" TEXT,
    "gender" "AdministrativeGender",
    "birthDate" TIMESTAMP(3),
    "deceased" BOOLEAN,
    "maritalStatus" TEXT,
    "empi" TEXT,
    "generalPractitioner" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identifiers" (
    "id" TEXT NOT NULL,
    "use" "IdentifierUse",
    "system" TEXT,
    "value" TEXT NOT NULL,
    "type" TEXT,
    "patientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "identifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" TEXT NOT NULL,
    "use" "AddressUse",
    "type" "AddressType",
    "text" TEXT,
    "line" TEXT[],
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "patientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "identifiers" ADD CONSTRAINT "identifiers_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
