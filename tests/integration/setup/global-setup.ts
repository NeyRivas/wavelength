import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Vitest globalSetup: boots a disposable local Postgres database with the
// real migrations applied (see db-up.sh / auth-stub.sql) before the
// `integration` project's test files run, and tears it down after.
export default function setup() {
  execFileSync("bash", [path.join(dirname, "db-up.sh")], { stdio: "inherit" });

  return () => {
    execFileSync("bash", [path.join(dirname, "db-down.sh")], { stdio: "inherit" });
  };
}
