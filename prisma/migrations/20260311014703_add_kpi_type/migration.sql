-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_KPI" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "keyResultId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "keywords" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "targetCount" REAL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KPI_keyResultId_fkey" FOREIGN KEY ("keyResultId") REFERENCES "KeyResult" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_KPI" ("createdAt", "description", "id", "keyResultId", "keywords", "order", "title") SELECT "createdAt", "description", "id", "keyResultId", "keywords", "order", "title" FROM "KPI";
DROP TABLE "KPI";
ALTER TABLE "new_KPI" RENAME TO "KPI";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
