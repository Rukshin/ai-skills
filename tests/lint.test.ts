import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, readFileSync, statSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { splitFrontmatter, extractWikilinks, maskCode } from "../plugin/lib/markdown.ts";

const here = dirname(fileURLToPath(import.meta.url));
const vault = join(here, "fixtures", "lint-vault");
const cli = join(here, "..", "plugin", "scripts", "wiki-lint.ts");
const AS_OF = "2026-03-01";
const CHECKS = [
  "dead-links",
  "orphans",
  "frontmatter-gaps",
  "up-chain",
  "index-drift",
  "manifest-drift",
  "stale-contradictions",
  "empty-sections",
];

function tmp(): string {
  return realpathSync(mkdtempSync(join(tmpdir(), "wiki-lint-test-")));
}
function run(args: string[]) {
  return spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" });
}
function lint(extra: string[] = [], start = vault) {
  const r = run(["--start", start, "--as-of", AS_OF, ...extra]);
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout);
}
function issuesOf(report: any, id: string) {
  return report.checks.find((c: any) => c.id === id).issues;
}
const brief = (issues: any[]) => issues.map((i) => `${i.severity} ${i.path}${i.line ? ":" + i.line : ""} ${i.message}`);

// --- markdown helpers ---

test("wikilinks: targets, aliases, headings, lines; code is ignored", () => {
  const text = [
    "[[A]] and [[B|alias]] and [[C#Heading]] and [[D#H|x]] and ![[img.png]]",
    "`[[Inline]]` and ``[[Double `tick`]]``",
    "```",
    "[[Fenced]]",
    "```",
    "~~~",
    "[[Tilde]]",
    "~~~",
    "after [[E]]",
  ].join("\n");
  const links = extractWikilinks(maskCode(text));
  assert.deepEqual(
    links.map((l) => [l.target, l.heading, l.line]),
    [
      ["A", undefined, 1],
      ["B", undefined, 1],
      ["C", "Heading", 1],
      ["D", "H", 1],
      ["img.png", undefined, 1],
      ["E", undefined, 9],
    ],
  );
});

test("frontmatter: scalars, inline arrays, block lists, body offset", () => {
  const fm = splitFrontmatter('---\nup: ["[[index]]"]\ntags:\n  - wiki/concept\n  - "x"\ncreated: 2026-01-01\nempty: []\n---\n# T\n');
  assert.deepEqual(fm.data.up, ["[[index]]"]);
  assert.deepEqual(fm.data.tags, ["wiki/concept", "x"]);
  assert.equal(fm.data.created, "2026-01-01");
  assert.deepEqual(fm.data.empty, []);
  assert.equal(fm.bodyStartLine, 8);
  assert.deepEqual(splitFrontmatter("# no fm\n").data, {});
});

// --- report shape ---

test("report has the documented shape and all eight checks in order", () => {
  const r = lint();
  assert.deepEqual(Object.keys(r), ["vaultRoot", "asOf", "summary", "checks"]);
  assert.equal(r.vaultRoot, vault);
  assert.equal(r.asOf, AS_OF);
  assert.deepEqual(r.checks.map((c: any) => c.id), CHECKS);
  assert.deepEqual(Object.keys(r.summary.by_check), CHECKS);
  for (const c of r.checks) {
    assert.equal(typeof c.name, "string");
    assert.equal(r.summary.by_check[c.id], c.issues.length);
    for (const i of c.issues) {
      assert.ok(["error", "warning"].includes(i.severity));
      assert.equal(typeof i.message, "string");
      assert.equal(typeof i.path, "string");
    }
  }
  assert.equal(r.summary.issues_found, 19);
});

// --- checks (exact issues) ---

test("dead-links: dead and ambiguous targets; code, dot dirs and index entries do not count", () => {
  const r = lint();
  assert.deepEqual(brief(issuesOf(r, "dead-links")), [
    "error Wiki/Hub.md:12 Dead link: [[Placeholder]]",
    "error Wiki/Linker.md:12 Dead link: [[Missing Page]]",
    "warning Wiki/Linker.md:13 Ambiguous link [[Twin]]: matches Wiki/Sub/Twin.md, Wiki/Twin.md",
  ]);
});

test("orphans: only pages without inbound links from other content pages", () => {
  const r = lint();
  assert.deepEqual(brief(issuesOf(r, "orphans")), [
    "warning Wiki/Orphan Page.md No inbound links from other content pages",
  ]);
});

test("frontmatter-gaps: content pages need up, created, sources and a wiki/* tag; operational files are exempt", () => {
  const r = lint();
  assert.deepEqual(brief(issuesOf(r, "frontmatter-gaps")), [
    "error Wiki/No Meta.md Missing frontmatter: up, created, sources, wiki/* tag",
  ]);
});

test("up-chain: broken and cyclic chains", () => {
  const r = lint();
  assert.deepEqual(brief(issuesOf(r, "up-chain")), [
    "error Wiki/Broken Chain.md `up` chain does not reach index.md: leaves the wiki at Home",
    "error Wiki/Cycle A.md `up` chain does not reach index.md: cycle Cycle A -> Cycle B -> Cycle A",
    "error Wiki/Cycle B.md `up` chain does not reach index.md: cycle Cycle B -> Cycle A -> Cycle B",
  ]);
});

test("index-drift: unlisted pages and index entries pointing to missing pages", () => {
  const r = lint();
  assert.deepEqual(brief(issuesOf(r, "index-drift")), [
    "error Wiki/index.md:21 Index entry points to a missing page: [[Ghost Entry]]",
    "warning Wiki/Lost Child.md Page is not listed in index.md",
    "warning Wiki/Unlisted Hub.md Page is not listed in index.md",
    "warning Wiki/Unlisted.md Page is not listed in index.md",
  ]);
});

test("manifest-drift: untracked raw files, hash mismatches per algo, missing created pages", () => {
  const r = lint();
  assert.deepEqual(brief(issuesOf(r, "manifest-drift")), [
    "warning raw/.manifest.json Page in pages_created no longer exists: Gone Page.md (source raw/changed-md5.md)",
    "warning raw/changed-md5.md Hash mismatch (md5, entry has no hash_algo): source changed since ingest",
    "warning raw/changed-sha.md Hash mismatch (sha256): source changed since ingest",
    "warning raw/untracked.md Raw file is not in the manifest",
  ]);
});

test("stale-contradictions: older than 30 days from --as-of; fresh ones and code fences do not count", () => {
  const r = lint();
  assert.deepEqual(brief(issuesOf(r, "stale-contradictions")), [
    "warning Wiki/Stale.md:12 Contradiction from 2025-12-01 is 90 days old (> 30)",
  ]);
  const early = lint(["--as-of", "2025-12-20"]);
  assert.deepEqual(issuesOf(early, "stale-contradictions"), []);
});

test("empty-sections: headings with no content; parent with only a subsection is not empty; lint pages exempt", () => {
  const r = lint();
  assert.deepEqual(brief(issuesOf(r, "empty-sections")), [
    "warning Wiki/Empty Sections.md:10 Empty section: ## Empty",
    "warning Wiki/Empty Sections.md:22 Empty section: ## Trailing",
  ]);
});

test("fix_hint is a string when present", () => {
  const r = lint();
  for (const c of r.checks) for (const i of c.issues) if ("fix_hint" in i) assert.equal(typeof i.fix_hint, "string");
});

// --- read-only ---

function snapshot(dir: string, out: Record<string, string> = {}, base = dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    const st = statSync(p);
    const rel = p.slice(base.length);
    if (e.isDirectory()) {
      out[rel + "/"] = String(st.mtimeMs);
      snapshot(p, out, base);
    } else out[rel] = `${st.mtimeMs}:${st.size}:${readFileSync(p, "utf8")}`;
  }
  return out;
}

test("linting never changes any file, mtime or directory in the vault", () => {
  const before = snapshot(vault);
  lint();
  run(["--start", vault, "--as-of", AS_OF, "--format", "markdown", "--strict"]);
  const after = snapshot(vault);
  assert.deepEqual(after, before);
});

// --- options ---

test("--exclude globs drop matching files from every check (repeatable, path and basename globs)", () => {
  const r = lint(["--exclude", "Wiki/Unlisted.md", "--exclude", "Wiki/Unlisted Hub.md", "--exclude", "Wiki/Lost Child.md", "--exclude", "Stale.md", "--exclude", "raw/*.md"]);
  assert.deepEqual(brief(issuesOf(r, "index-drift")), ["error Wiki/index.md:21 Index entry points to a missing page: [[Ghost Entry]]"]);
  assert.deepEqual(issuesOf(r, "stale-contradictions"), []);
  assert.deepEqual(brief(issuesOf(r, "manifest-drift")), [
    "warning raw/.manifest.json Page in pages_created no longer exists: Gone Page.md (source raw/changed-md5.md)",
  ]);
  assert.equal(r.summary.issues_found, 12);
});

test("exit code: 0 with issues by default, 1 with --strict, 0 with --strict and no issues", () => {
  assert.equal(run(["--start", vault, "--as-of", AS_OF]).status, 0);
  const s = run(["--start", vault, "--as-of", AS_OF, "--strict"]);
  assert.equal(s.status, 1);
  assert.equal(JSON.parse(s.stdout).summary.issues_found, 19);

  const d = tmp();
  mkdirSync(join(d, "Atlas", "Wiki"), { recursive: true });
  writeFileSync(join(d, ".wiki.json"), "{}");
  writeFileSync(join(d, "Atlas", "Wiki", "index.md"), "---\nup: [\"[[Home]]\"]\n---\n# Index\n\n- [[Page]]\n");
  writeFileSync(join(d, "Home.md"), "# Home\n\nText\n");
  writeFileSync(
    join(d, "Atlas", "Wiki", "Page.md"),
    '---\nup: ["[[index]]"]\ncreated: 2026-01-01\nsources: ["https://x.test"]\ntags: [wiki/concept]\n---\n# Page\n\nBody, see [[Page]].\n',
  );
  writeFileSync(join(d, "Atlas", "Wiki", "Other.md"), "---\nup: [\"[[index]]\"]\ncreated: 2026-01-01\nsources: [a]\ntags: [wiki/x]\n---\n# Other\n\nLinks [[Page]].\n");
  // Other is unlisted -> one issue; remove by listing it
  writeFileSync(join(d, "Atlas", "Wiki", "index.md"), "---\nup: [\"[[Home]]\"]\n---\n# Index\n\n- [[Page]]\n- [[Other]]\n");
  writeFileSync(join(d, "Atlas", "Wiki", "Page.md"), '---\nup: ["[[index]]"]\ncreated: 2026-01-01\nsources: ["https://x.test"]\ntags: [wiki/concept]\n---\n# Page\n\nSee [[Other]].\n');
  const clean = run(["--start", d, "--as-of", AS_OF, "--strict"]);
  assert.equal(clean.status, 0, clean.stdout + clean.stderr);
  assert.equal(JSON.parse(clean.stdout).summary.issues_found, 0);
});

test("--format markdown prints a readable report, not JSON", () => {
  const r = run(["--start", vault, "--as-of", AS_OF, "--format", "markdown"]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^# Wiki lint report/);
  assert.match(r.stdout, /Issues found: 19/);
  assert.match(r.stdout, /## Dead links \(3\)/);
  assert.match(r.stdout, /- error `Wiki\/Linker\.md:12` Dead link: \[\[Missing Page\]\]/);
  assert.match(r.stdout, /## Empty sections \(2\)/);
  assert.throws(() => JSON.parse(r.stdout));
});

test("--format json is the default and also accepted explicitly", () => {
  const a = run(["--start", vault, "--as-of", AS_OF]);
  const b = run(["--start", vault, "--as-of", AS_OF, "--format", "json"]);
  assert.equal(a.stdout, b.stdout);
});

test("bad usage exits 2 with usage on stderr and nothing on stdout", () => {
  for (const args of [
    ["--bogus"],
    ["--start"],
    ["--as-of", "2026-13-40"],
    ["--as-of", "yesterday"],
    ["--format", "xml"],
    ["--exclude"],
    ["stray"],
  ]) {
    const r = run(["--start", vault, ...args]);
    assert.equal(r.status, 2, JSON.stringify(args));
    assert.equal(r.stdout, "");
    assert.match(r.stderr, /Usage: node wiki-lint\.ts/);
  }
});

test("exits 1 with the searched directories when no vault resolves", () => {
  const d = tmp();
  const r = run(["--start", d]);
  assert.equal(r.status, 1);
  assert.equal(r.stdout, "");
  assert.match(r.stderr, /No wiki vault found/);
});

// --- --only ---

const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const norm = (s: string) => s.split(vault).join("<root>");

test("without --only the JSON and markdown output is byte-identical to the pre-flag output", () => {
  const j = run(["--start", vault, "--as-of", AS_OF]);
  const m = run(["--start", vault, "--as-of", AS_OF, "--format", "markdown"]);
  assert.equal(sha(norm(j.stdout)), "9a7dc05ad10bd4f97e262af934a102efab4841a34af9d0e38a1a4f26dbd399e0");
  assert.equal(sha(norm(m.stdout)), "b36bca75627f6549eb3f31387d3f281561ffe61bb21fb561347ecc9adbef2bcb");
  assert.ok(!j.stdout.includes('"kind"'));
});

test("--only runs and reports just the selected checks, in canonical order", () => {
  const r = lint(["--only", "orphans,dead-links"]);
  assert.deepEqual(r.checks.map((c: any) => c.id), ["dead-links", "orphans"]);
  assert.deepEqual(r.summary.by_check, { "dead-links": 3, orphans: 1 });
  assert.equal(r.summary.issues_found, 4);
  assert.deepEqual(brief(issuesOf(r, "orphans")), ["warning Wiki/Orphan Page.md No inbound links from other content pages"]);
  const md = run(["--start", vault, "--as-of", AS_OF, "--only", "orphans", "--format", "markdown"]);
  assert.match(md.stdout, /Issues found: 1/);
  assert.doesNotMatch(md.stdout, /Dead links/);
});

test("--only is repeatable and --strict only counts the selected checks", () => {
  const r = lint(["--only", "orphans", "--only", "empty-sections"]);
  assert.deepEqual(r.checks.map((c: any) => c.id), ["orphans", "empty-sections"]);
  assert.equal(r.summary.issues_found, 3);
  const clean = run(["--start", vault, "--as-of", "2025-12-20", "--only", "stale-contradictions", "--strict"]);
  assert.equal(clean.status, 0);
  assert.equal(JSON.parse(clean.stdout).summary.issues_found, 0);
});

test("--only manifest-drift tags each issue with a kind", () => {
  const r = lint(["--only", "manifest-drift"]);
  assert.deepEqual(r.checks.map((c: any) => c.id), ["manifest-drift"]);
  assert.equal(r.summary.issues_found, 4);
  assert.deepEqual(
    issuesOf(r, "manifest-drift").map((i: any) => [i.path, i.kind]),
    [
      ["raw/.manifest.json", "missing-pages"],
      ["raw/changed-md5.md", "hash-mismatch"],
      ["raw/changed-sha.md", "hash-mismatch"],
      ["raw/untracked.md", "unmanifested"],
    ],
  );
});

test("--only with an unknown id exits 2, lists the valid ids, prints nothing on stdout", () => {
  for (const v of ["nope", "orphans,nope", "orphans,"]) {
    const r = run(["--start", vault, "--only", v]);
    assert.equal(r.status, 2, v);
    assert.equal(r.stdout, "");
    for (const id of CHECKS) assert.ok(r.stderr.includes(id), `${v}: ${id}`);
  }
  const noValue = run(["--start", vault, "--only"]);
  assert.equal(noValue.status, 2);
  assert.match(noValue.stderr, /Usage: node wiki-lint\.ts/);
});

test("--only never changes any file in the vault", () => {
  const before = snapshot(vault);
  lint(["--only", "manifest-drift,orphans"]);
  run(["--start", vault, "--as-of", AS_OF, "--only", "manifest-drift", "--format", "markdown", "--strict"]);
  assert.deepEqual(snapshot(vault), before);
});
