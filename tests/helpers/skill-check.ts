import { basename, dirname, join, normalize } from "node:path";

export interface SkillFs {
  exists(path: string): boolean;
}

// Budgets come from plugin/docs/skill-style-guide.md (Body Budget):
// target 180-450 tokens, recommended max 700, hard max 1000 (estimate: chars / 4).
// Description: MUST be <= 250 chars (guide, Frontmatter Rules).
export const HARD_MAX_TOKENS = 1000;
export const MAX_DESCRIPTION_CHARS = 250;

export const REQUIRED_SECTIONS = [
  "Activation Contract",
  "Hard Rules",
  "Decision Gates",
  "Execution Steps",
  "Output Contract",
  "References",
];

// Each error is "<rule>: <message>".
export function checkSkill(path: string, content: string, fs: SkillFs): string[] {
  const errors: string[] = [];
  const err = (rule: string, msg: string) => errors.push(`${rule}: ${msg}`);
  const dir = dirname(path);

  if (basename(path) !== "SKILL.md") err("filename", `file must be named SKILL.md, got ${basename(path)}`);

  const m = /^---\n([\s\S]*?)\n---\n?/.exec(content);
  if (!m) {
    err("frontmatter", "missing frontmatter block");
    return errors;
  }
  const body = content.slice(m[0].length);
  const lines = m[1].split("\n");

  // Top-level keys only; indented lines belong to the previous key.
  const top = new Map<string, string>();
  const block = new Map<string, string[]>();
  let current = "";
  for (const line of lines) {
    const k = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line);
    if (k && !/^\s/.test(line)) {
      current = k[1];
      top.set(current, k[2]);
      block.set(current, []);
    } else if (current) {
      block.get(current)!.push(line);
    }
  }
  const unquote = (v: string) => v.replace(/^["']|["']$/g, "");

  const name = top.get("name");
  if (!name) err("name", "missing name");
  else if (unquote(name) !== basename(dir)) err("name", `name "${unquote(name)}" must equal directory "${basename(dir)}"`);

  const desc = top.get("description");
  if (desc === undefined) err("description", "missing description");
  else {
    const q = /^"(.*)"$/.exec(desc);
    const continuation = block.get("description")!.some((l) => l.trim() !== "");
    if (!q || continuation) err("description-quoted", "description must be one physical line wrapped in double quotes");
    const text = q ? q[1] : desc;
    if (!text.startsWith("Trigger:")) err("description-trigger", 'description must start with "Trigger:"');
    if (text.length > MAX_DESCRIPTION_CHARS)
      err("description-length", `description is ${text.length} chars (max ${MAX_DESCRIPTION_CHARS})`);
  }

  if (!top.get("license")) err("license", "missing license");

  if (!top.has("metadata")) err("metadata", "missing metadata");
  else {
    const meta = block.get("metadata")!.join("\n");
    for (const key of ["author", "version"]) {
      if (!new RegExp(`^\\s+${key}:\\s*\\S`, "m").test(meta)) err("metadata", `missing metadata.${key}`);
    }
  }

  // H2 sections outside code fences.
  const h2: string[] = [];
  let fence = false;
  for (const line of body.split("\n")) {
    if (/^```/.test(line)) fence = !fence;
    else if (!fence) {
      const h = /^## (.+?)\s*$/.exec(line);
      if (h) h2.push(h[1]);
    }
  }
  if (h2.join("|") !== REQUIRED_SECTIONS.join("|"))
    err("sections", `expected H2 ${JSON.stringify(REQUIRED_SECTIONS)} in order, got ${JSON.stringify(h2)}`);

  const tokens = Math.ceil(body.length / 4);
  if (tokens > HARD_MAX_TOKENS) err("budget", `body ~${tokens} tokens exceeds hard max ${HARD_MAX_TOKENS}`);

  const refs = new Set<string>();
  for (const r of body.matchAll(/`([^`\n]+)`/g)) refs.add(r[1]);
  for (const r of body.matchAll(/\]\(([^)\s]+)\)/g)) refs.add(r[1]);
  for (const raw of refs) {
    if (!/^(\.\/|\.\.\/|references\/|assets\/)/.test(raw)) continue;
    if (/[{}<>]/.test(raw)) continue;
    const target = raw.replace(/[#?].*$/, "").replace(/[.,;:]+$/, "");
    if (!fs.exists(normalize(join(dir, target)))) err("reference", `unresolved reference ${raw}`);
  }

  if (/(^|[^A-Za-z0-9_-])me\.md\b/i.test(content)) err("me-md", "skill must not mention me.md");

  return errors;
}
