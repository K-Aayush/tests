-- AlterTable
ALTER TABLE "users" ADD COLUMN     "middleName" TEXT,
ADD COLUMN     "phoneNumber" TEXT,
ALTER COLUMN "firstName" DROP NOT NULL,
ALTER COLUMN "lastName" DROP NOT NULL;
