import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, realpathSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  hashFile,
  entryAlgo,
  readManifest,
  compareEntry,
  newEntry,
  ManifestError,
} from "../plugin/lib/manifest.ts";

const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, "..", "plugin", "scripts", "wiki-hash.ts");

function tmp(): string {
  return realpathSync(mkdtempSync(join(tmpdir(), "wiki-manifest-test-")));
}
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const md5 = (s: string) => createHash("md5").update(s).digest("hex");
const runCli = (args: string[]) => spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" });

test("hashFile hashes with sha256 by default and md5 on request", () => {
  const d = tmp();
  writeFileSync(join(d, "a.md"), "hello\n");
  assert.equal(hashFile(join(d, "a.md")), sha("hello\n"));
  assert.equal(hashFile(join(d, "a.md"), "sha256"), sha("hello\n"));
  assert.equal(hashFile(join(d, "a.md"), "md5"), md5("hello\n"));
});

test("an entry without hash_algo is md5; with hash_algo it uses that algo", () => {
  assert.equal(entryAlgo({ hash: "x" }), "md5");
  assert.equal(entryAlgo({ hash: "x", hash_algo: "sha256" }), "sha256");
  assert.equal(entryAlgo({ hash: "x", hash_algo: "md5" }), "md5");
});

test("compareEntry matches, mismatches and reports missing files using the entry algo", () => {
  const d = tmp();
  const f = join(d, "a.md");
  writeFileSync(f, "body");
  assert.deepEqual(compareEntry({ hash: md5("body") }, f), { status: "match", algo: "md5", expected: md5("body"), actual: md5("body") });
  assert.equal(compareEntry({ hash: sha("body"), hash_algo: "sha256" }, f).status, "match");
  const bad = compareEntry({ hash: md5("body"), hash_algo: "sha256" }, f);
  assert.equal(bad.status, "mismatch");
  assert.equal(bad.algo, "sha256");
  assert.equal(bad.actual, sha("body"));
  const gone = compareEntry({ hash: "x" }, join(d, "nope.md"));
  assert.deepEqual(gone, { status: "missing", algo: "md5", expected: "x" });
});

test("hash comparison ignores hex case", () => {
  const d = tmp();
  writeFileSync(join(d, "a"), "body");
  assert.equal(compareEntry({ hash: md5("body").toUpperCase() }, join(d, "a")).status, "match");
});

test("newEntry builds a sha256 entry with the documented shape", () => {
  const d = tmp();
  writeFileSync(join(d, "a.md"), "body");
  const e = newEntry(join(d, "a.md"), { url: "https://x.test/a", ingested_at: "2026-01-02", pages_created: ["A.md"] });
  assert.deepEqual(e, {
    hash: sha("body"),
    hash_algo: "sha256",
    url: "https://x.test/a",
    ingested_at: "2026-01-02",
    status: "done",
    pages_created: ["A.md"],
    pages_updated: [],
  });
});

test("readManifest parses sources, returns undefined when the file is missing", () => {
  const d = tmp();
  assert.equal(readManifest(join(d, "m.json")), undefined);
  writeFileSync(
    join(d, "m.json"),
    JSON.stringify({ sources: { "+/raw/a.md": { hash: "h", pages_created: ["A.md"] } } }),
  );
  const m = readManifest(join(d, "m.json"));
  assert.deepEqual(Object.keys(m!.sources), ["+/raw/a.md"]);
  assert.equal(m!.sources["+/raw/a.md"].hash, "h");
});

test("readManifest rejects invalid JSON and wrong shapes", () => {
  const d = tmp();
  writeFileSync(join(d, "a.json"), "{ nope");
  assert.throws(() => readManifest(join(d, "a.json")), ManifestError);
  writeFileSync(join(d, "b.json"), "[]");
  assert.throws(() => readManifest(join(d, "b.json")), ManifestError);
  writeFileSync(join(d, "c.json"), '{"sources":{"x":{"hash":"h","hash_algo":"crc"}}}');
  assert.throws(() => readManifest(join(d, "c.json")), /hash_algo/);
  writeFileSync(join(d, "d.json"), '{"sources":{"x":{}}}');
  assert.throws(() => readManifest(join(d, "d.json")), /hash/);
});

// --- CLI ---

test("wiki-hash prints sha256:<hex> and exits 0", () => {
  const d = tmp();
  writeFileSync(join(d, "a.md"), "hello\n");
  const r = runCli([join(d, "a.md")]);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, `sha256:${sha("hello\n")}\n`);
  assert.equal(r.stderr, "");
});

test("wiki-hash --algo md5 prints md5:<hex>", () => {
  const d = tmp();
  writeFileSync(join(d, "a.md"), "hello\n");
  const r = runCli(["--algo", "md5", join(d, "a.md")]);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, `md5:${md5("hello\n")}\n`);
});

test("wiki-hash exits 2 on bad usage and prints usage to stderr", () => {
  const d = tmp();
  writeFileSync(join(d, "a.md"), "x");
  for (const args of [[], ["a", "b"], ["--algo"], ["--algo", "crc", join(d, "a.md")], ["--bogus", join(d, "a.md")]]) {
    const r = runCli(args);
    assert.equal(r.status, 2, JSON.stringify(args));
    assert.equal(r.stdout, "");
    assert.match(r.stderr, /Usage: node wiki-hash\.ts/);
  }
});

test("wiki-hash exits 1 when the file is missing or a directory", () => {
  const d = tmp();
  mkdirSync(join(d, "dir"));
  for (const p of [join(d, "nope.md"), join(d, "dir")]) {
    const r = runCli([p]);
    assert.equal(r.status, 1);
    assert.equal(r.stdout, "");
    assert.match(r.stderr, /Cannot read/);
  }
});
