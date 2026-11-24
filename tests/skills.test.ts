import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkSkill } from "./helpers/skill-check.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixtures = join(root, "tests", "fixtures", "skills");
const realFs = { exists: (p: string) => existsSync(p) };

function findSkills(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...findSkills(p));
    else if (e.name.toLowerCase() === "skill.md") out.push(p);
  }
  return out;
}

function check(path: string, content?: string): string[] {
  return checkSkill(path, content ?? readFileSync(path, "utf8"), realFs);
}

function rules(path: string, content?: string): string[] {
  return check(path, content).map((e) => e.split(":")[0]);
}

const real = [...findSkills(join(root, "plugin")), ...findSkills(join(root, "personal"))];

test("discovers the plugin and personal skills", () => {
  assert.ok(real.length >= 5, `found ${real.length} skills`);
  assert.ok(real.some((p) => p.includes("/personal/")));
});

for (const p of real) {
  test(`real skill passes all checks: ${p.slice(root.length + 1)}`, () => {
    assert.deepEqual(check(p), []);
  });
}

test("valid fixture passes", () => {
  assert.deepEqual(check(join(fixtures, "valid", "SKILL.md")), []);
});

const broken: Array<[string, string]> = [
  ["name-mismatch", "name"],
  ["no-trigger", "description-trigger"],
  ["unquoted", "description-quoted"],
  ["too-long", "description-length"],
  ["multiline", "description-quoted"],
  ["no-license", "license"],
  ["no-metadata", "metadata"],
  ["no-author", "metadata"],
  ["missing-section", "sections"],
  ["wrong-order", "sections"],
  ["bad-ref", "reference"],
  ["mentions-me", "me-md"],
];
for (const [dir, rule] of broken) {
  test(`broken fixture ${dir} fails rule ${rule}`, () => {
    const found = rules(join(fixtures, dir, "SKILL.md"));
    assert.ok(found.includes(rule), `expected ${rule}, got ${JSON.stringify(found)}`);
  });
}

test("only the broken reference is reported, placeholders are skipped", () => {
  const errs = check(join(fixtures, "bad-ref", "SKILL.md")).filter((e) => e.startsWith("reference"));
  assert.equal(errs.length, 1);
  assert.match(errs[0], /references\/missing\.md/);
});

test("body over the hard budget (1000 tokens, chars/4) fails", () => {
  const valid = readFileSync(join(fixtures, "valid", "SKILL.md"), "utf8");
  const big = valid + "\n" + "word ".repeat(900) + "\n";
  assert.ok(rules(join(fixtures, "valid", "SKILL.md"), big).includes("budget"));
});

test("filename must be exactly SKILL.md", () => {
  const valid = readFileSync(join(fixtures, "valid", "SKILL.md"), "utf8");
  assert.ok(rules(join(fixtures, "valid", "skill.md"), valid).includes("filename"));
  assert.ok(rules(join(fixtures, "valid", "SKILL.markdown"), valid).includes("filename"));
  assert.ok(!rules(join(fixtures, "valid", "SKILL.md"), valid).includes("filename"));
  assert.equal(basename(join(fixtures, "valid", "SKILL.md")), "SKILL.md");
});
