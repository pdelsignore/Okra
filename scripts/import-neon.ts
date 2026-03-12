/**
 * Import exported SQLite data into Neon (PostgreSQL).
 * Run AFTER running `prisma migrate dev`:
 *   npx tsx scripts/import-neon.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import * as fs from "fs";
import * as path from "path";

// Load dotenv so DATABASE_URL is available
import "dotenv/config";

async function main() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter } as never);

  const dataPath = path.join(__dirname, "sqlite-export.json");
  const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

  // Insert in dependency order
  if (data.users.length) {
    await prisma.user.createMany({ data: data.users, skipDuplicates: true });
    console.log(`  users: ${data.users.length}`);
  }

  if (data.accounts.length) {
    await prisma.account.createMany({ data: data.accounts, skipDuplicates: true });
    console.log(`  accounts: ${data.accounts.length}`);
  }

  if (data.sessions.length) {
    await prisma.session.createMany({ data: data.sessions, skipDuplicates: true });
    console.log(`  sessions: ${data.sessions.length}`);
  }

  if (data.verificationTokens.length) {
    await prisma.verificationToken.createMany({ data: data.verificationTokens, skipDuplicates: true });
    console.log(`  verificationTokens: ${data.verificationTokens.length}`);
  }

  if (data.objectives.length) {
    await prisma.objective.createMany({ data: data.objectives, skipDuplicates: true });
    console.log(`  objectives: ${data.objectives.length}`);
  }

  if (data.keyResults.length) {
    await prisma.keyResult.createMany({ data: data.keyResults, skipDuplicates: true });
    console.log(`  keyResults: ${data.keyResults.length}`);
  }

  if (data.kpis.length) {
    await prisma.kPI.createMany({ data: data.kpis, skipDuplicates: true });
    console.log(`  kpis: ${data.kpis.length}`);
  }

  if (data.tasks.length) {
    await prisma.task.createMany({ data: data.tasks, skipDuplicates: true });
    console.log(`  tasks: ${data.tasks.length}`);
  }

  if (data.alignments.length) {
    await prisma.taskAlignment.createMany({ data: data.alignments, skipDuplicates: true });
    console.log(`  alignments: ${data.alignments.length}`);
  }

  console.log("\nImport complete.");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
