import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveVault, parseFrontmatter, DEFAULTS, ConfigError } from "../plugin/lib/config.ts";

const here = dirname(fileURLToPath(import.meta.url));
const fx = (name: string) => join(here, "fixtures", name);
const cli = join(here, "..", "plugin", "scripts", "wiki-config.ts");

function tmp(): string {
  return realpathSync(mkdtempSync(join(tmpdir(), "wiki-config-test-")));
}

function runCli(args: string[]) {
  return spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" });
}

function errorOf(fn: () => unknown): ConfigError {
  try {
    fn();
  } catch (e) {
    assert.ok(e instanceof ConfigError, "expected ConfigError, got " + String(e));
    return e;
  }
  assert.fail("expected a ConfigError");
}

// --- Resolution ---

test("finds the nearest .wiki.json walking up from a nested start dir", () => {
  const r = resolveVault(join(fx("json-vault"), "sub", "deep"));
  assert.equal(r.source, "wiki.json");
  assert.equal(r.vaultRoot, fx("json-vault"));
  assert.equal(r.config.wiki_root, "Notes/Wiki");
});

test("falls back to SCHEMA.md frontmatter (type: llm-wiki) when no .wiki.json", () => {
  const r = resolveVault(fx("schema-vault"));
  assert.equal(r.source, "schema");
  assert.equal(r.vaultRoot, fx("schema-vault"));
  assert.equal(r.config.wiki_root, "Atlas/Wiki");
  assert.equal(r.config.raw, "+/raw");
  assert.deepEqual(r.config.areas, ["Fiction"]);
});

test("SCHEMA fallback ignores other keys (up, created, modified, archive)", () => {
  const r = resolveVault(fx("schema-vault"));
  assert.deepEqual(Object.keys(r.config).sort(), Object.keys(DEFAULTS).sort());
  assert.deepEqual(r.warnings, []);
});

test("SCHEMA missing keys take defaults", () => {
  const d = tmp();
  mkdirSync(join(d, "Atlas", "Wiki"), { recursive: true });
  writeFileSync(join(d, "Atlas", "Wiki", "SCHEMA.md"), "---\ntype: llm-wiki\n---\n");
  const r = resolveVault(d);
  assert.deepEqual(r.config, DEFAULTS);
});

test("SCHEMA.md without type: llm-wiki is not a vault", () => {
  const d = tmp();
  mkdirSync(join(d, "Atlas", "Wiki"), { recursive: true });
  writeFileSync(join(d, "Atlas", "Wiki", "SCHEMA.md"), "---\ntype: note\n---\n");
  const e = errorOf(() => resolveVault(d));
  assert.match(e.message, /No wiki vault found/);
});

test(".wiki.json wins over SCHEMA.md in the same vault", () => {
  const d = tmp();
  mkdirSync(join(d, "Atlas", "Wiki"), { recursive: true });
  writeFileSync(join(d, "Atlas", "Wiki", "SCHEMA.md"), "---\ntype: llm-wiki\nraw: other\n---\n");
  writeFileSync(join(d, ".wiki.json"), '{"raw":"mine"}');
  const r = resolveVault(d);
  assert.equal(r.source, "wiki.json");
  assert.equal(r.config.raw, "mine");
});

test("fails closed with the searched directories when no vault is found", () => {
  const d = tmp();
  const sub = join(d, "a", "b");
  mkdirSync(sub, { recursive: true });
  const e = errorOf(() => resolveVault(sub));
  assert.match(e.message, /No wiki vault found/);
  assert.ok(e.message.includes(sub));
  assert.ok(e.message.includes(join(d, "a")));
  assert.ok(e.message.includes(d));
});

// --- Defaults ---

test("defaults mirror the pkm layout", () => {
  assert.deepEqual(DEFAULTS, {
    wiki_root: "Atlas/Wiki",
    raw: "+/raw",
    manifest: "+/raw/.manifest.json",
    attachments: "x/Images",
    index: "index.md",
    hot: "hot.md",
    log: "log.md",
    language: "en",
    areas: [],
    fetchers: ["firecrawl-scrape", "webfetch"],
  });
});

test(".wiki.json missing keys take defaults; given keys override", () => {
  const r = resolveVault(fx("json-vault"));
  assert.equal(r.config.raw, "inbox");
  assert.equal(r.config.language, "es");
  assert.deepEqual(r.config.areas, ["Work"]);
  assert.deepEqual(r.config.fetchers, DEFAULTS.fetchers);
});

test("manifest defaults to {raw}/.manifest.json and follows a custom raw", () => {
  const r = resolveVault(fx("json-vault"));
  assert.equal(r.config.raw, "inbox");
  assert.equal(r.config.manifest, "inbox/.manifest.json");
  const d = tmp();
  writeFileSync(join(d, ".wiki.json"), "{}");
  assert.equal(resolveVault(d).config.manifest, "+/raw/.manifest.json");
});

test("an explicit manifest wins over the raw-derived default", () => {
  const d = tmp();
  writeFileSync(join(d, ".wiki.json"), '{"raw":"inbox","manifest":"meta/m.json"}');
  assert.equal(resolveVault(d).config.manifest, "meta/m.json");
});

test("SCHEMA fallback derives the manifest from raw", () => {
  const d = tmp();
  mkdirSync(join(d, "Atlas", "Wiki"), { recursive: true });
  writeFileSync(join(d, "Atlas", "Wiki", "SCHEMA.md"), "---\ntype: llm-wiki\nraw: drop\n---\n");
  assert.equal(resolveVault(d).config.manifest, "drop/.manifest.json");
});

// --- Validation ---

test("unknown keys are warnings, not errors", () => {
  const r = resolveVault(fx("unknown-key"));
  assert.equal(r.warnings.length, 1);
  assert.match(r.warnings[0], /mode/);
  assert.equal(r.config.language, "en");
  assert.ok(!("mode" in r.config));
});

test("wrong types are errors naming the keys", () => {
  const e = errorOf(() => resolveVault(fx("bad-type")));
  assert.match(e.message, /wiki_root/);
  assert.match(e.message, /areas/);
});

test("invalid JSON in .wiki.json is an error", () => {
  const d = tmp();
  writeFileSync(join(d, ".wiki.json"), "{ nope");
  errorOf(() => resolveVault(d));
});

test("rejects '..' traversal", () => {
  const e = errorOf(() => resolveVault(fx("traversal")));
  assert.match(e.message, /raw/);
  assert.match(e.message, /\.\./);
});

test("rejects absolute paths", () => {
  const e = errorOf(() => resolveVault(fx("absolute")));
  assert.match(e.message, /wiki_root/);
  assert.match(e.message, /absolute/);
});

test("rejects symlinks escaping the vault", () => {
  const outside = tmp();
  const d = tmp();
  symlinkSync(outside, join(d, "evil"));
  writeFileSync(join(d, ".wiki.json"), '{"attachments":"evil/img"}');
  const e = errorOf(() => resolveVault(d));
  assert.match(e.message, /attachments/);
  assert.match(e.message, /symlink|escapes/);
});

test("index/hot/log are validated relative to wiki_root (no escape)", () => {
  const d = tmp();
  writeFileSync(join(d, ".wiki.json"), '{"log":"../../x.md"}');
  const e = errorOf(() => resolveVault(d));
  assert.match(e.message, /log/);
});

// --- Frontmatter reader ---

test("frontmatter reader handles scalars, quotes and inline arrays", () => {
  const fm = parseFrontmatter(
    '---\na: plain\nb: "quoted: yes"\nc: [x, "y, z", \'w\']\nd: []\nup: ["[[index]]"]\n---\nbody: no\n',
  );
  assert.equal(fm.a, "plain");
  assert.equal(fm.b, "quoted: yes");
  assert.deepEqual(fm.c, ["x", "y, z", "w"]);
  assert.deepEqual(fm.d, []);
  assert.deepEqual(fm.up, ["[[index]]"]);
  assert.ok(!("body" in fm));
});

// --- CLI ---

test("CLI prints resolved config JSON and exits 0", () => {
  const r = runCli(["--start", join(fx("json-vault"), "sub", "deep")]);
  assert.equal(r.status, 0, r.stderr);
  const out = JSON.parse(r.stdout);
  assert.equal(out.source, "wiki.json");
  assert.equal(out.vaultRoot, fx("json-vault"));
  assert.equal(out.config.wiki_root, "Notes/Wiki");
});

test("CLI exits 1 listing searched directories when no vault is found", () => {
  const d = tmp();
  const r = runCli(["--start", d]);
  assert.equal(r.status, 1);
  assert.equal(r.stdout, "");
  assert.match(r.stderr, /No wiki vault found/);
  assert.ok(r.stderr.includes(d));
});

test("CLI exits 1 on validation errors", () => {
  const r = runCli(["--start", fx("traversal")]);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /raw/);
});

test("CLI exits 2 on bad usage", () => {
  for (const args of [["--bogus"], ["--start"], ["positional"]]) {
    const r = runCli(args);
    assert.equal(r.status, 2, args.join(" "));
    assert.match(r.stderr, /Usage/);
  }
});
