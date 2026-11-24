// Copies the shared scripts, libs and reference into each skill folder so a skill
// stays runnable when an installer (e.g. `npx skills add`) copies it alone.
// Source of truth: plugin/scripts, plugin/lib, plugin/_shared. Usage: node tools/vendor.mjs [--check]
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const plugin = join(root, "plugin");

// Entry scripts each skill runs; lib files follow from their imports.
export const SKILL_SCRIPTS = {
  "wiki-ingest": ["wiki-config.ts", "wiki-hash.ts"],
  "wiki-lint": ["wiki-config.ts", "wiki-lint.ts"],
  "wiki-query": ["wiki-config.ts", "wiki-search.ts"],
  "wiki-save": ["wiki-config.ts"],
};
const REFERENCE = ["_shared/cli-commands.md", "references/cli-commands.md"];

function libClosure(entryFiles) {
  const seen = new Set();
  const visit = (rel) => {
    const src = readFileSync(join(plugin, rel), "utf8");
    for (const m of src.matchAll(/from\s+"(\.\.?\/[^"]+\.ts)"/g)) {
      const target = join(dirname(rel), m[1]).replace(/\\/g, "/");
      if (!seen.has(target)) { seen.add(target); visit(target); }
    }
  };
  for (const f of entryFiles) visit(`scripts/${f}`);
  return [...seen];
}

/** Map of skill-relative output path -> content, per skill. */
export function plan() {
  const out = {};
  for (const [skill, scripts] of Object.entries(SKILL_SCRIPTS)) {
    const files = {};
    for (const s of scripts) files[`scripts/${s}`] = readFileSync(join(plugin, "scripts", s), "utf8");
    for (const l of libClosure(scripts)) files[l.replace(/^lib\//, "lib/")] = readFileSync(join(plugin, l), "utf8");
    files[REFERENCE[1]] = readFileSync(join(plugin, REFERENCE[0]), "utf8");
    out[skill] = files;
  }
  return out;
}

/** Returns drift messages (empty when the vendored copies match the sources). */
export function check() {
  const problems = [];
  for (const [skill, files] of Object.entries(plan())) {
    for (const [rel, content] of Object.entries(files)) {
      const p = join(plugin, "skills", skill, rel);
      if (!existsSync(p)) problems.push(`missing: ${skill}/${rel}`);
      else if (readFileSync(p, "utf8") !== content) problems.push(`stale: ${skill}/${rel}`);
    }
  }
  return problems;
}

export function write() {
  for (const [skill, files] of Object.entries(plan())) {
    const dir = join(plugin, "skills", skill);
    rmSync(join(dir, "scripts"), { recursive: true, force: true });
    rmSync(join(dir, "lib"), { recursive: true, force: true });
    for (const [rel, content] of Object.entries(files)) {
      mkdirSync(dirname(join(dir, rel)), { recursive: true });
      writeFileSync(join(dir, rel), content);
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--check")) {
    const p = check();
    if (p.length) { console.error(p.join("\n") + "\nRun: node tools/vendor.mjs"); process.exit(1); }
  } else write();
}
