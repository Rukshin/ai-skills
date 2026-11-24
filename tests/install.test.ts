import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { check, SKILL_SCRIPTS } from "../tools/vendor.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const skillsDir = join(root, "plugin", "skills");
const skillNames = Object.keys(SKILL_SCRIPTS as Record<string, string[]>);

test("vendored copies match their sources (run: node tools/vendor.mjs)", () => {
  assert.deepEqual(check(), []);
});

test("every plugin skill is listed in the vendor tool", () => {
  const dirs = readdirSync(skillsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(join(skillsDir, e.name, "SKILL.md")))
    .map((e) => e.name)
    .sort();
  assert.deepEqual(dirs, [...skillNames].sort());
});

test("no skill points outside its own folder", () => {
  for (const name of skillNames) {
    const dir = join(skillsDir, name);
    for (const f of [join(dir, "SKILL.md"), join(dir, "references", "details.md")]) {
      if (!existsSync(f)) continue;
      assert.doesNotMatch(readFileSync(f, "utf8"), /\.\.\/\.\.\//, `${name}: ${basename(f)} uses ../../`);
    }
  }
});

for (const name of skillNames) {
  test(`${name} runs when copied alone (installer layout)`, () => {
    const tmp = mkdtempSync(join(tmpdir(), "skill-install-"));
    try {
      const dest = join(tmp, ".agents", "skills", name);
      cpSync(join(skillsDir, name), dest, { recursive: true });
      const vault = join(tmp, "vault");
      cpSync(join(root, "tests", "fixtures", "json-vault"), vault, { recursive: true });
      const r = spawnSync("node", [join(dest, "scripts", "wiki-config.ts"), "--start", vault], { encoding: "utf8" });
      assert.equal(r.status, 0, r.stderr);
      assert.ok(JSON.parse(r.stdout).config.wiki_root);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
}

test("personal skill is hidden from installers (metadata.internal: true)", () => {
  const text = readFileSync(join(root, "personal", "skills", "wiki-ingest-book", "SKILL.md"), "utf8");
  assert.match(text, /^metadata:\n(?:[ ]+.*\n)*?[ ]+internal: true$/m);
});

test("no plugin skill is marked internal", () => {
  for (const name of skillNames) {
    assert.doesNotMatch(readFileSync(join(skillsDir, name, "SKILL.md"), "utf8"), /internal:\s*true/);
  }
});
