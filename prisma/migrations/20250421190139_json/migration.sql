-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "stateData" JSONB;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "fullContent" JSONB;
