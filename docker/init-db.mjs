import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const migrationFiles = [
  "prisma/migrations/20260530023000_init/migration.sql",
  "prisma/migrations/20260602021500_add_app_settings/migration.sql"
];
let prisma;

function resolveSqlitePath(databaseUrl) {
  if (!databaseUrl?.startsWith("file:")) {
    throw new Error("DATABASE_URL must use a file: SQLite URL in the Docker runtime.");
  }

  const rawPath = databaseUrl.slice("file:".length).split("?")[0];
  return path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), "prisma", rawPath);
}

function readSqlStatements(migrationPath) {
  return fs
    .readFileSync(path.join(process.cwd(), migrationPath), "utf8")
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n")
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function tableExists(tableName) {
  const rows = await prisma.$queryRawUnsafe(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1",
    tableName
  );

  return rows.length > 0;
}

async function applyMigration(migrationPath) {
  for (const statement of readSqlStatements(migrationPath)) {
    await prisma.$executeRawUnsafe(statement);
  }
}

async function main() {
  const databasePath = resolveSqlitePath(process.env.DATABASE_URL);
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  prisma = new PrismaClient();

  if (!(await tableExists("User"))) {
    await applyMigration(migrationFiles[0]);
    console.log("SQLite initial schema initialized.");
  }

  if (!(await tableExists("AppSetting"))) {
    await applyMigration(migrationFiles[1]);
    console.log("SQLite AppSetting schema initialized.");
    return;
  }

  console.log("SQLite schema already initialized.");
}

try {
  await main();
} finally {
  await prisma?.$disconnect();
}
