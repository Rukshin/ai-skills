// Usage: node plugin/scripts/wiki-hash.ts [--algo sha256|md5] <file>
// Prints `<algo>:<hex>`. Exit 0 ok, 1 unreadable file, 2 bad usage.
import { statSync } from "node:fs";
import { hashFile } from "../lib/manifest.ts";
import type { HashAlgo } from "../lib/manifest.ts";

const USAGE = "Usage: node wiki-hash.ts [--algo sha256|md5] <file>";

function main(argv: string[]): number {
  let algo: HashAlgo = "sha256";
  const files: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--algo") {
      const v = argv[++i];
      if (v !== "sha256" && v !== "md5") {
        process.stderr.write(`${USAGE}\n`);
        return 2;
      }
      algo = v;
    } else if (a.startsWith("--")) {
      process.stderr.write(`${USAGE}\n`);
      return 2;
    } else {
      files.push(a);
    }
  }
  if (files.length !== 1) {
    process.stderr.write(`${USAGE}\n`);
    return 2;
  }
  try {
    if (!statSync(files[0]).isFile()) throw new Error("not a regular file");
    process.stdout.write(`${algo}:${hashFile(files[0], algo)}\n`);
    return 0;
  } catch (e) {
    process.stderr.write(`Cannot read ${files[0]}: ${(e as Error).message}\n`);
    return 1;
  }
}

process.exitCode = main(process.argv.slice(2));
