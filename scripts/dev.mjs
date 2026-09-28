import { spawn } from "node:child_process";
import path from "node:path";

const nextCli = path.join(process.cwd(), "node_modules/next/dist/bin/next");
const cleanupScript = path.join(process.cwd(), "scripts/cleanup.mjs");
const devServer = spawn(process.execPath, [nextCli, "dev", ...process.argv.slice(2)], {
  stdio: "inherit",
});

let cleanupProcess = null;
function runCleanup() {
  if (cleanupProcess) return;
  cleanupProcess = spawn(process.execPath, [cleanupScript], { stdio: "inherit" });
  cleanupProcess.on("error", (error) => {
    console.error("Failed to start local cleanup", error);
  });
  cleanupProcess.on("close", () => {
    cleanupProcess = null;
  });
}

runCleanup();
const interval = setInterval(runCleanup, 60 * 60 * 1_000);

function stop(signal) {
  clearInterval(interval);
  devServer.kill(signal);
  cleanupProcess?.kill(signal);
}

process.on("SIGINT", () => stop("SIGINT"));
process.on("SIGTERM", () => stop("SIGTERM"));
devServer.on("error", (error) => {
  console.error("Failed to start Next.js", error);
  clearInterval(interval);
  cleanupProcess?.kill();
  process.exitCode = 1;
});
devServer.on("exit", (code, signal) => {
  clearInterval(interval);
  cleanupProcess?.kill();
  process.exitCode = code ?? (signal ? 0 : 1);
});
