// Usage: node plugin/scripts/wiki-config.ts [--start DIR]
// Prints the resolved vault config as JSON. Exit 0 ok, 1 resolution/validation error, 2 bad usage.
import { resolveVault, ConfigError } from "../lib/config.ts";

const USAGE = "Usage: node wiki-config.ts [--start DIR]";

function versionOk(v: string): boolean {
  const [maj, min] = v.split(".").map(Number);
  return maj > 22 || (maj === 22 && min >= 18);
}

function main(argv: string[]): number {
  if (!versionOk(process.versions.node)) {
    process.stderr.write(`wiki-config needs Node >= 22.18 (or bun); found ${process.versions.node}.\n`);
    return 1;
  }
  let start = process.cwd();
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--start" && i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
      start = argv[++i];
    } else {
      process.stderr.write(`${USAGE}\n`);
      return 2;
    }
  }
  try {
    const r = resolveVault(start);
    for (const w of r.warnings) process.stderr.write(`warning: ${w}\n`);
    process.stdout.write(`${JSON.stringify(r, null, 2)}\n`);
    return 0;
  } catch (e) {
    if (e instanceof ConfigError) {
      process.stderr.write(`${e.message}\n`);
      return 1;
    }
    throw e;
  }
}

process.exitCode = main(process.argv.slice(2));
