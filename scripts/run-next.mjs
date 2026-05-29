import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(currentFile), "..");
const nextBin = path.join(projectRoot, "node_modules", "next", "dist", "bin", "next");
const wasmDir = path.join(projectRoot, "node_modules", "@next", "swc-wasm-nodejs");
const readlinkPatch = path.join(projectRoot, "scripts", "patch-readlink.cjs");
const command = process.argv[2] ?? "dev";
const args = process.argv.slice(3);
const nodeOptions = [process.env.NODE_OPTIONS, "--require", readlinkPatch]
  .filter(Boolean)
  .join(" ");

const result = spawnSync(process.execPath, [nextBin, command, ...args], {
  cwd: projectRoot,
  env: {
    ...process.env,
    NODE_OPTIONS: nodeOptions,
    NEXT_TEST_WASM: "1",
    NEXT_TEST_WASM_DIR: wasmDir
  },
  stdio: "inherit"
});

process.exit(result.status ?? 1);
