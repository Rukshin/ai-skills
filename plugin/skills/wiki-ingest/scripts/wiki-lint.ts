// Usage: node plugin/scripts/wiki-lint.ts [--start DIR] [--as-of YYYY-MM-DD] [--exclude GLOB]... [--only ID[,ID]...] [--strict] [--format json|markdown]
// Read-only wiki health check. Exit 0 ok (1 with --strict and issues), 1 vault resolution error, 2 bad usage.
import { resolveVault, ConfigError } from "../lib/config.ts";
import { CHECKS, lintVault, renderMarkdown, validDate } from "../lib/lint.ts";

const USAGE =
  "Usage: node wiki-lint.ts [--start DIR] [--as-of YYYY-MM-DD] [--exclude GLOB]... [--only ID[,ID]...] [--strict] [--format json|markdown]";

function versionOk(v: string): boolean {
  const [maj, min] = v.split(".").map(Number);
  return maj > 22 || (maj === 22 && min >= 18);
}

function today(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function main(argv: string[]): number {
  if (!versionOk(process.versions.node)) {
    process.stderr.write(`wiki-lint needs Node >= 22.18 (or bun); found ${process.versions.node}.\n`);
    return 1;
  }
  let start = process.cwd();
  let asOf = today();
  let strict = false;
  let format = "json";
  const exclude: string[] = [];
  let only: string[] | undefined;
  const value = (i: number): string | undefined => (i + 1 < argv.length && !argv[i + 1].startsWith("--") ? argv[i + 1] : undefined);
  const bad = (): number => {
    process.stderr.write(`${USAGE}\n`);
    return 2;
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--strict") strict = true;
    else if (a === "--start" || a === "--as-of" || a === "--exclude" || a === "--format" || a === "--only") {
      const v = value(i);
      if (v === undefined) return bad();
      i++;
      if (a === "--start") start = v;
      else if (a === "--as-of") {
        if (!validDate(v)) return bad();
        asOf = v;
      } else if (a === "--exclude") exclude.push(v);
      else if (a === "--only") {
        const ids = v.split(",");
        const valid = CHECKS.map((c) => c.id);
        const unknown = ids.filter((id) => !valid.includes(id));
        if (unknown.length) {
          process.stderr.write(`Unknown check id: ${unknown.map((u) => JSON.stringify(u)).join(", ")}. Valid ids: ${valid.join(", ")}\n`);
          return 2;
        }
        only = [...(only ?? []), ...ids];
      }
      else {
        if (v !== "json" && v !== "markdown") return bad();
        format = v;
      }
    } else return bad();
  }
  try {
    const resolved = resolveVault(start);
    for (const w of resolved.warnings) process.stderr.write(`warning: ${w}\n`);
    const report = lintVault(resolved, { asOf, exclude, only });
    process.stdout.write(format === "markdown" ? `${renderMarkdown(report)}\n` : `${JSON.stringify(report, null, 2)}\n`);
    return strict && report.summary.issues_found > 0 ? 1 : 0;
  } catch (e) {
    if (e instanceof ConfigError) {
      process.stderr.write(`${e.message}\n`);
      return 1;
    }
    throw e;
  }
}

process.exitCode = main(process.argv.slice(2));
