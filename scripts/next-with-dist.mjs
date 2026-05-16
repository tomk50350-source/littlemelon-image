import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const command = process.execPath;
const args = process.argv.slice(2);
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");

const child = spawn(command, [nextBin, ...args], {
  cwd: root,
  stdio: "inherit",
  shell: false,
  env: {
    ...process.env,
    NEXT_DIST_DIR: ".next-littlemelon-build"
  }
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});
