import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(root, "plugin", "scripts", "wiki-search.ts");
const vault = join(root, "tests", "fixtures", "search-vault");

interface Hit { page: string; heading: string | null; area: string | null; score: number; snippet: string }
function search(args: string[]): { status: number | null; out: { results: Hit[] } | undefined; stderr: string } {
  const r = spawnSync("node", [script, "--start", vault, ...args], { encoding: "utf8" });
  return { status: r.status, out: r.status === 0 ? JSON.parse(r.stdout) : undefined, stderr: r.stderr };
}

// Retrieval regression: queries.tsv rows are "query<TAB>expected page"; expected page must be in the top 3.
const rows = readFileSync(join(vault, "queries.tsv"), "utf8").split("\n").filter((l) => l.trim());
for (const row of rows) {
  const [query, expected] = row.split("\t");
  test(`retrieval top-3: ${query}`, () => {
    const r = search(["--query", query, "--top", "3"]);
    assert.equal(r.status, 0, r.stderr);
    const pages = r.out!.results.map((h) => h.page);
    assert.ok(pages.includes(expected), `expected ${expected} in ${JSON.stringify(pages)}`);
  });
}

test("results are ranked, bounded and carry heading, area and snippet", () => {
  const r = search(["--query", "optimistic locking retry", "--top", "5"]);
  const hits = r.out!.results;
  assert.ok(hits.length >= 1 && hits.length <= 5);
  assert.equal(hits[0].page, "concepts/Optimistic Locking");
  for (let i = 1; i < hits.length; i++) assert.ok(hits[i - 1].score >= hits[i].score);
  for (const h of hits) assert.ok(h.snippet.length <= 240);
  assert.equal(hits[0].heading, "Retry strategy");
});

test("--area restricts to an area; --area root excludes areas", () => {
  const inWork = search(["--query", "events aggregate", "--area", "Work"]).out!.results;
  assert.ok(inWork.length > 0 && inWork.every((h) => h.area === "Work"));
  const rootOnly = search(["--query", "events aggregate locking", "--area", "root"]).out!.results;
  assert.ok(rootOnly.every((h) => h.area === null));
});

test("excludes hot/index/log, lint reports and notes outside wiki_root", () => {
  const pages = search(["--query", "optimistic locking cap aggregates hot recent lint report personal", "--top", "20"]).out!.results.map((h) => h.page);
  for (const p of pages) assert.doesNotMatch(p, /^(hot|index|log)$|^lint-|^Notes\//);
});

test("no match gives an empty result list and exit 0", () => {
  const r = search(["--query", "xylophone"]);
  assert.equal(r.status, 0);
  assert.deepEqual(r.out!.results, []);
});

test("usage errors exit 2, unresolved vault exits 1", () => {
  assert.equal(spawnSync("node", [script, "--start", vault], { encoding: "utf8" }).status, 2);
  assert.equal(spawnSync("node", [script, "--query", "x", "--top", "0", "--start", vault], { encoding: "utf8" }).status, 2);
  assert.equal(spawnSync("node", [script, "--query", "x", "--start", "/"], { encoding: "utf8" }).status, 1);
});

test("search is read-only: vault files are unchanged", () => {
  const before = readFileSync(join(vault, "Wiki", "hot.md"), "utf8");
  search(["--query", "aggregates"]);
  assert.equal(readFileSync(join(vault, "Wiki", "hot.md"), "utf8"), before);
});
