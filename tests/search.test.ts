import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(root, "plugin", "scripts", "wiki-search.ts");
const vault = join(root, "tests", "fixtures", "search-vault");
const vaultReal = join(root, "tests", "fixtures", "search-vault-real");

interface Hit { page: string; heading: string | null; area: string | null; score: number; coverage: number; snippet: string }
interface Out { results: Hit[]; unmatched_terms: string[]; confidence: "high" | "low" | "none" }
function search(args: string[], v = vault): { status: number | null; out: Out | undefined; stderr: string } {
  const r = spawnSync("node", [script, "--start", v, ...args], { encoding: "utf8" });
  return { status: r.status, out: r.status === 0 ? JSON.parse(r.stdout) : undefined, stderr: r.stderr };
}
function table(v: string, file: string): string[][] {
  return readFileSync(join(v, file), "utf8").split("\n").filter((l) => l.trim()).map((l) => l.split("\t"));
}

// Retrieval regression. queries.tsv rows: query, expected page (a|b = either), rank limit (default 3), page that must NOT rank first (optional).
for (const v of [vault, vaultReal]) {
  const name = v === vault ? "fixture" : "real";
  for (const [query, expected, limit = "3", decoy = ""] of table(v, "queries.tsv")) {
    test(`retrieval ${name} top-${limit}: ${query} -> ${expected}`, () => {
      const r = search(["--query", query, "--top", "5"], v);
      assert.equal(r.status, 0, r.stderr);
      const pages = r.out!.results.map((h) => h.page);
      const want = expected.split("|");
      assert.ok(pages.slice(0, Number(limit)).some((p) => want.includes(p)), `expected ${expected} in top ${limit} of ${JSON.stringify(pages)}`);
      if (decoy) assert.notEqual(pages[0], decoy, `decoy ${decoy} ranked first`);
    });
  }
}

// Gap detection. gaps.tsv rows: query, unmatched terms (comma list, may be empty), confidence.
for (const [query, unmatched, confidence] of table(vaultReal, "gaps.tsv")) {
  test(`gap signal: ${query} -> ${confidence}`, () => {
    const r = search(["--query", query], vaultReal);
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(r.out!.unmatched_terms, unmatched === "" ? [] : unmatched.split(","));
    assert.equal(r.out!.confidence, confidence);
    if (confidence === "none") assert.deepEqual(r.out!.results, []);
  });
}

test("results carry coverage in [0,1]", () => {
  for (const h of search(["--query", "optimistic locking"]).out!.results) assert.ok(h.coverage > 0 && h.coverage <= 1);
});

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
