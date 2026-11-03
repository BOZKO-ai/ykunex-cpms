import { copyFileSync, mkdirSync, existsSync, writeFileSync, unlinkSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

function loadDotEnv() {
  if (process.env.DATABASE_URL || !existsSync(".env")) return;
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*DATABASE_URL\s*=\s*"?([^"]*)"?\s*$/);
    if (match) process.env.DATABASE_URL = match[1];
  }
}

loadDotEnv();
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is missing. Copy .env.example to .env and configure MySQL first.");
  process.exit(1);
}

mkdirSync("backups", { recursive: true });
const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 16);

if (databaseUrl.startsWith("file:")) {
  const src = join("prisma", databaseUrl.replace("file:./", ""));
  if (!existsSync(src)) {
    console.error(`SQLite database not found at ${src}. Run \`npm run setup\` first.`);
    process.exit(1);
  }
  const dest = join("backups", `yakunex-${stamp}.db`);
  copyFileSync(src, dest);
  console.log(`Backup saved: ${dest}`);
  process.exit(0);
}

if (!databaseUrl.startsWith("mysql://")) {
  console.error("Unsupported DATABASE_URL. Use a mysql:// URL.");
  process.exit(1);
}

const parsed = new URL(databaseUrl);
const passwordFile = join("backups", `.mysql-password-${process.pid}`);
const dest = join("backups", `yakunex-${stamp}.sql`);
writeFileSync(passwordFile, `[client]\npassword=${decodeURIComponent(parsed.password)}\n`, { mode: 0o600 });

try {
  const result = spawnSync(
    "mysqldump",
    [
      "--defaults-extra-file=" + passwordFile,
      "--host=" + parsed.hostname,
      "--port=" + (parsed.port || "3306"),
      "--user=" + decodeURIComponent(parsed.username),
      "--single-transaction",
      "--routines",
      "--events",
      decodeURIComponent(parsed.pathname.slice(1)),
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  if (result.error) {
    console.error("mysqldump was not found. Install MySQL client tools and ensure mysqldump is on PATH.");
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(result.stderr.toString().trim() || "MySQL backup failed.");
    process.exit(result.status ?? 1);
  }
  writeFileSync(dest, result.stdout);
  console.log(`Backup saved: ${dest}`);
} finally {
  unlinkSync(passwordFile);
}
