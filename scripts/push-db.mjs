import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(currentFile), "..");
const databasePath = path.join(projectRoot, "data", "dev.db");
const migrationPath = path.join(
  projectRoot,
  "prisma",
  "migrations",
  "20260530023000_init",
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

function applySqliteMigration() {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });

  if (hasExistingSchema()) {
    console.log("SQLite schema already exists.");
    return;
  }

  const result = run("sqlite3", [databasePath, `.read ${migrationPath}`]);
  if (result.status !== 0) {
    process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }

  console.log("SQLite schema initialized from migration SQL.");
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
