// Usage: node plugin/scripts/wiki-search.ts --query TEXT [--top N] [--area NAME|root] [--start DIR]
// Read-only ranked search over the wiki pages. Prints JSON {vaultRoot, wiki_root, query, results[]} (candidates, not evidence).
// Exit 0 ok (empty results = no match), 1 vault resolution error, 2 bad usage.
import { resolveVault, ConfigError } from "../lib/config.ts";
import { searchVault } from "../lib/search.ts";

const USAGE = "Usage: node wiki-search.ts --query TEXT [--top N] [--area NAME|root] [--start DIR]";

function versionOk(v: string): boolean {
  const [maj, min] = v.split(".").map(Number);
  return maj > 22 || (maj === 22 && min >= 18);
}

function main(argv: string[]): number {
  if (!versionOk(process.versions.node)) {
    process.stderr.write(`wiki-search needs Node >= 22.18 (or bun); found ${process.versions.node}.\n`);
    return 1;
  }
  let start = process.cwd();
  let query: string | undefined;
  let top = 5;
  let area: string | undefined;
  const bad = (): number => {
    process.stderr.write(`${USAGE}\n`);
    return 2;
  };
  for (let i = 0; i < argv.length; i += 2) {
    const a = argv[i];
    const v = argv[i + 1];
    if (v === undefined || (v.startsWith("--") && a !== "--query")) return bad();
    if (a === "--query") query = v;
    else if (a === "--start") start = v;
    else if (a === "--area") area = v;
    else if (a === "--top") {
      if (!/^\d+$/.test(v) || Number(v) < 1 || Number(v) > 50) return bad();
      top = Number(v);
    } else return bad();
  }
  if (query === undefined || query.trim() === "") return bad();
  try {
    const resolved = resolveVault(start);
    for (const w of resolved.warnings) process.stderr.write(`warning: ${w}\n`);
    if (area !== undefined && area !== "root" && !resolved.config.areas.includes(area)) {
      process.stderr.write(`unknown area "${area}"; known: root, ${resolved.config.areas.join(", ")}\n`);
      return 2;
    }
    const results = searchVault(resolved, { query, top, area });
    process.stdout.write(
      `${JSON.stringify({ vaultRoot: resolved.vaultRoot, wiki_root: resolved.config.wiki_root, query, results }, null, 2)}\n`,
    );
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
