// Bumps the app version in app.config.ts following the rule:
// patch rolls 0-99, then minor increments (and patch resets to 0);
// minor rolls 0-99, then major increments (and minor resets to 0).
// Examples: 1.0.99 -> 1.1.0, 1.1.99 -> 1.2.0, 1.99.99 -> 2.0.0
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const configPath = join(dirname(fileURLToPath(import.meta.url)), "..", "app.config.ts");
const content = readFileSync(configPath, "utf-8");

const versionRegex = /version:\s*"(\d+)\.(\d+)\.(\d+)"/;
const match = content.match(versionRegex);
if (!match) {
  console.error("Could not find a version field (e.g. version: \"1.2.3\") in app.config.ts");
  process.exit(1);
}

let [, major, minor, patch] = match.map(Number);

patch += 1;
if (patch > 99) {
  patch = 0;
  minor += 1;
  if (minor > 99) {
    minor = 0;
    major += 1;
  }
}

const newVersion = `${major}.${minor}.${patch}`;
const updated = content.replace(versionRegex, `version: "${newVersion}"`);
writeFileSync(configPath, updated);

console.log(newVersion);
