import nextEnv from "@next/env";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

const projectDir = process.cwd();
const { loadEnvConfig } = nextEnv;

loadEnvConfig(projectDir);

const localPrismaCli = join(projectDir, "node_modules", "prisma", "build", "index.js");
const command = existsSync(localPrismaCli) ? process.execPath : "prisma";
const args = existsSync(localPrismaCli)
  ? [localPrismaCli, ...process.argv.slice(2)]
  : process.argv.slice(2);
const pathKey = process.platform === "win32" ? "Path" : "PATH";
const currentPath = process.env[pathKey] ?? process.env.PATH ?? process.env.Path ?? "";
const nextPath = `${dirname(process.execPath)}${process.platform === "win32" ? ";" : ":"}${currentPath}`;
const env = {
  ...process.env,
  [pathKey]: nextPath,
  PATH: nextPath,
};

const child = spawn(command, args, {
  cwd: projectDir,
  env,
  shell: false,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
