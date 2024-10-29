/*
  Warnings:

  - The primary key for the `plugin_installations` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `plugin_installations` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

-- AlterTable
ALTER TABLE "plugin_installations" DROP CONSTRAINT "plugin_installations_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "plugin_installations_pkey" PRIMARY KEY ("pluginId", "stepNumber");

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';
