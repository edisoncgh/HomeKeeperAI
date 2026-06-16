import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(currentFile), "..");
const databasePath = path.join(projectRoot, "data", "dev.db");
const initialMigrationPath = path.join(
  projectRoot,
  "prisma",
  "migrations",
  "20260530023000_init",
  "migration.sql"
);
const appSettingsMigrationPath = path.join(
  projectRoot,
  "prisma",
  "migrations",
  "20260602021500_add_app_settings",
  "migration.sql"
);
const itemImagesMigrationPath = path.join(
  projectRoot,
  "prisma",
  "migrations",
  "20260611000100_add_item_images",
  "migration.sql"
);
const itemUnitSpecificationMigrationPath = path.join(
  projectRoot,
  "prisma",
  "migrations",
  "20260616000100_add_item_unit_specification",
  "migration.sql"
);

function run(command, args) {
  return spawnSync(command, args, {
    cwd: projectRoot,
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL ?? "file:../data/dev.db",
      APPDATA: path.join(projectRoot, ".cache", "appdata"),
      LOCALAPPDATA: path.join(projectRoot, ".cache", "localappdata"),
      CHECKPOINT_DISABLE: "1"
    },
    encoding: "utf8"
  });
}

function hasExistingSchema() {
  if (!fs.existsSync(databasePath)) {
    return false;
  }

  const result = run("sqlite3", [databasePath, ".tables"]);
  return result.status === 0 && result.stdout.includes("User");
}

function getTableList() {
  if (!fs.existsSync(databasePath)) {
    return "";
  }

  const result = run("sqlite3", [databasePath, ".tables"]);
  return result.status === 0 ? result.stdout : "";
}

function hasItemColumn(columnName) {
  if (!fs.existsSync(databasePath)) {
    return false;
  }

  const result = run("sqlite3", [databasePath, "PRAGMA table_info('Item');"]);
  return result.status === 0 && result.stdout.includes(`|${columnName}|`);
}

function applySqliteMigration() {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });

  if (hasExistingSchema()) {
    applyPendingSqliteMigrations();
    return;
  }

  runSqliteMigration(initialMigrationPath);
  applyPendingSqliteMigrations();
  console.log("SQLite schema initialized from migration SQL.");
}

function applyPendingSqliteMigrations() {
  const tables = getTableList();
  if (!tables.includes("AppSetting")) {
    runSqliteMigration(appSettingsMigrationPath);
    console.log("SQLite AppSetting migration applied.");
  }

  const refreshedTables = getTableList();
  if (!refreshedTables.includes("ItemImage")) {
    runSqliteMigration(itemImagesMigrationPath);
    console.log("SQLite ItemImage migration applied.");
  }

  if (!hasItemColumn("unit") || !hasItemColumn("specification")) {
    runSqliteMigration(itemUnitSpecificationMigrationPath);
    console.log("SQLite item unit/specification migration applied.");
    return;
  }

  console.log("SQLite schema already exists.");
}

function runSqliteMigration(migrationPath) {
  const result = run("sqlite3", [databasePath, `.read ${migrationPath}`]);
  if (result.status !== 0) {
    process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }
}

const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
const prismaResult = run(npxCommand, ["prisma", "db", "push"]);

if (prismaResult.status === 0) {
  process.stdout.write(prismaResult.stdout);
  process.stderr.write(prismaResult.stderr);
  process.exit(0);
}

console.warn("Prisma db push failed in this environment; falling back to sqlite3 migration.");
applySqliteMigration();
