/**
 * Export all data from local SQLite database to JSON.
 * Run BEFORE swapping adapters:
 *   npx tsx scripts/export-sqlite.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql as PrismaLibSQL } from "@prisma/adapter-libsql";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const adapter = new PrismaLibSQL({
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  });
  const prisma = new PrismaClient({ adapter } as never);

  const [users, accounts, sessions, verificationTokens, objectives, keyResults, kpis, tasks, alignments] =
    await Promise.all([
      prisma.user.findMany(),
      prisma.account.findMany(),
      prisma.session.findMany(),
      prisma.verificationToken.findMany(),
      prisma.objective.findMany(),
      prisma.keyResult.findMany(),
      prisma.kPI.findMany(),
      prisma.task.findMany(),
      prisma.taskAlignment.findMany(),
    ]);

  const data = {
    users,
    accounts,
    sessions,
    verificationTokens,
    objectives,
    keyResults,
    kpis,
    tasks,
    alignments,
  };

  const outPath = path.join(__dirname, "sqlite-export.json");
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));

  console.log("Exported:");
  Object.entries(data).forEach(([k, v]) =>
    console.log(`  ${k}: ${(v as unknown[]).length} records`)
  );
  console.log(`\nSaved to ${outPath}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
