/*
  Warnings:

  - You are about to drop the column `percentage` on the `TaskAlignment` table. All the data in the column will be lost.
  - Added the required column `contribution` to the `TaskAlignment` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TaskAlignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "kpiId" TEXT,
    "keyResultId" TEXT NOT NULL,
    "contribution" REAL NOT NULL,
    "isOverridden" BOOLEAN NOT NULL DEFAULT false,
    "confidence" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskAlignment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TaskAlignment_kpiId_fkey" FOREIGN KEY ("kpiId") REFERENCES "KPI" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TaskAlignment_keyResultId_fkey" FOREIGN KEY ("keyResultId") REFERENCES "KeyResult" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TaskAlignment" ("confidence", "createdAt", "id", "isOverridden", "keyResultId", "kpiId", "taskId") SELECT "confidence", "createdAt", "id", "isOverridden", "keyResultId", "kpiId", "taskId" FROM "TaskAlignment";
DROP TABLE "TaskAlignment";
ALTER TABLE "new_TaskAlignment" RENAME TO "TaskAlignment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
