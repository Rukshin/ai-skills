// Vault config resolver for the wiki skills.
// Node >= 22.18 (type stripping) or bun. Only `node:` built-ins. No enums/namespaces.
import { readFileSync, realpathSync } from "node:fs";
import { dirname, join, resolve, isAbsolute, sep } from "node:path";

export interface WikiConfig {
  wiki_root: string;
  raw: string;
  manifest: string;
  attachments: string;
  index: string;
  hot: string;
  log: string;
  language: string;
  areas: string[];
  fetchers: string[];
}

export interface Resolved {
  vaultRoot: string;
  source: "wiki.json" | "schema";
  config: WikiConfig;
  warnings: string[];
}

export interface Io {
  /** File contents, or undefined when missing/unreadable. */
  readText(path: string): string | undefined;
  /** Canonical path, or undefined when it does not exist. */
  realpath(path: string): string | undefined;
}

export const DEFAULTS: WikiConfig = {
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
};

const SCHEMA_KEYS = ["wiki_root", "raw", "index", "hot", "log", "areas"];
const STRING_KEYS = ["wiki_root", "raw", "manifest", "attachments", "index", "hot", "log", "language"];
const LIST_KEYS = ["areas", "fetchers"];
// Keys whose value is a path relative to the vault root / to wiki_root.
const VAULT_PATHS = ["wiki_root", "raw", "manifest", "attachments"];
const WIKI_PATHS = ["index", "hot", "log"];

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export const nodeIo: Io = {
  readText(path) {
    try {
      return readFileSync(path, "utf8");
    } catch {
      return undefined;
    }
  },
  realpath(path) {
    try {
      return realpathSync(path);
    } catch {
      return undefined;
    }
  },
};

// ---------- Frontmatter reader (flat keys only) ----------

function unquote(s: string): string {
  const t = s.trim();
  if (t.length >= 2 && ((t[0] === '"' && t.endsWith('"')) || (t[0] === "'" && t.endsWith("'")))) {
    return t.slice(1, -1);
  }
  return t;
}

function splitList(inner: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quote = "";
  for (const ch of inner) {
    if (quote) {
      cur += ch;
      if (ch === quote) quote = "";
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      cur += ch;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map(unquote).filter((x) => x !== "");
}

function parseValue(raw: string): string | string[] {
  let v = raw.trim();
  if (v[0] !== '"' && v[0] !== "'") {
    const hash = v.search(/\s#/);
    if (hash >= 0) v = v.slice(0, hash).trim();
  }
  if (v.startsWith("[") && v.endsWith("]")) return splitList(v.slice(1, -1));
  return unquote(v);
}

export function parseFrontmatter(text: string): Record<string, string | string[]> {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const out: Record<string, string | string[]> = {};
  if (lines[0]?.trim() !== "---") return out;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "---") break;
    const m = /^([A-Za-z_][\w-]*)\s*:(.*)$/.exec(line);
    if (m) out[m[1]] = parseValue(m[2]);
  }
  return out;
}

// ---------- Validation ----------

function isStringList(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function relativeProblem(value: string): string | undefined {
  if (value.trim() === "") return "must not be empty";
  if (isAbsolute(value) || value.startsWith("/") || value.startsWith("\\") || /^[A-Za-z]:/.test(value) || value.startsWith("~")) {
    return "must be vault-relative, got an absolute path";
  }
  if (value.split(/[\\/]+/).includes("..")) return "must not contain '..' traversal";
  return undefined;
}

function within(root: string, target: string): boolean {
  return target === root || target.startsWith(root.endsWith(sep) ? root : root + sep);
}

/** Canonicalize via the nearest existing ancestor so missing files are still checked. */
function realOrAncestor(io: Io, path: string): string | undefined {
  let cur = path;
  const tail: string[] = [];
  for (;;) {
    const real = io.realpath(cur);
    if (real !== undefined) return tail.length ? join(real, ...tail.reverse()) : real;
    const parent = dirname(cur);
    if (parent === cur) return undefined;
    tail.push(cur.slice(parent.length).replace(/^[\\/]+/, ""));
    cur = parent;
  }
}

export function buildConfig(
  given: Record<string, unknown>,
  vaultRoot: string,
  io: Io,
  allowedKeys?: string[],
): { config: WikiConfig; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const strings: Record<string, string> = {};
  const lists: Record<string, string[]> = {};
  for (const k of STRING_KEYS) strings[k] = String(Object.entries(DEFAULTS).find((e) => e[0] === k)?.[1]);
  lists.areas = [...DEFAULTS.areas];
  lists.fetchers = [...DEFAULTS.fetchers];
  const known = Object.keys(DEFAULTS);
  let manifestGiven = false;

  for (const key of Object.keys(given)) {
    if (allowedKeys && !allowedKeys.includes(key)) continue;
    if (!known.includes(key)) {
      warnings.push(`Unknown key "${key}" ignored`);
      continue;
    }
    const v = given[key];
    if (STRING_KEYS.includes(key)) {
      if (typeof v !== "string") errors.push(`"${key}" must be a string`);
      else {
        strings[key] = v;
        if (key === "manifest") manifestGiven = true;
      }
    } else if (LIST_KEYS.includes(key)) {
      if (!isStringList(v)) errors.push(`"${key}" must be an array of strings`);
      else lists[key] = [...v];
    }
  }
  if (errors.length) throw new ConfigError(`Invalid wiki config in ${vaultRoot}:\n- ${errors.join("\n- ")}`);
  // The manifest lives next to the raw sources unless set explicitly.
  if (!manifestGiven) strings.manifest = `${strings.raw.replace(/\/+$/, "")}/.manifest.json`;
  const config: WikiConfig = {
    wiki_root: strings.wiki_root,
    raw: strings.raw,
    manifest: strings.manifest,
    attachments: strings.attachments,
    index: strings.index,
    hot: strings.hot,
    log: strings.log,
    language: strings.language,
    areas: lists.areas,
    fetchers: lists.fetchers,
  };

  const rootReal = io.realpath(vaultRoot) ?? vaultRoot;
  const check = (key: string, value: string, base: string) => {
    const problem = relativeProblem(value);
    if (problem) {
      errors.push(`"${key}" ${problem}: ${value}`);
      return;
    }
    const full = realOrAncestor(io, resolve(vaultRoot, base, value));
    if (full !== undefined && !within(rootReal, full)) {
      errors.push(`"${key}" escapes the vault (symlink or path): ${value}`);
    }
  };
  for (const key of VAULT_PATHS) check(key, strings[key], "");
  // index/hot/log only make sense once wiki_root itself is sane.
  if (!errors.some((e) => e.startsWith('"wiki_root"'))) {
    for (const key of WIKI_PATHS) check(key, strings[key], config.wiki_root);
  }
  for (const area of config.areas) {
    if (area.trim() === "" || area === "." || area === ".." || /[\\/]/.test(area)) {
      errors.push(`"areas" entries must be single folder names, got: ${area}`);
    }
  }
  if (errors.length) throw new ConfigError(`Invalid wiki config in ${vaultRoot}:\n- ${errors.join("\n- ")}`);
  return { config, warnings };
}

// ---------- Resolution ----------

export function ancestors(start: string): string[] {
  const dirs: string[] = [];
  let cur = resolve(start);
  for (;;) {
    dirs.push(cur);
    const parent = dirname(cur);
    if (parent === cur) return dirs;
    cur = parent;
  }
}

export function resolveVault(startDir: string, io: Io = nodeIo): Resolved {
  const dirs = ancestors(startDir);

  for (const dir of dirs) {
    const text = io.readText(join(dir, ".wiki.json"));
    if (text === undefined) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      throw new ConfigError(`Invalid JSON in ${join(dir, ".wiki.json")}: ${(e as Error).message}`);
    }
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new ConfigError(`${join(dir, ".wiki.json")} must contain a JSON object`);
    }
    const { config, warnings } = buildConfig(parsed as Record<string, unknown>, dir, io);
    return { vaultRoot: dir, source: "wiki.json", config, warnings };
  }

  for (const dir of dirs) {
    const text = io.readText(join(dir, "Atlas", "Wiki", "SCHEMA.md"));
    if (text === undefined) continue;
    const fm = parseFrontmatter(text);
    if (fm.type !== "llm-wiki") continue;
    const { config, warnings } = buildConfig(fm, dir, io, SCHEMA_KEYS);
    return { vaultRoot: dir, source: "schema", config, warnings };
  }

  throw new ConfigError(
    "No wiki vault found. Looked for .wiki.json, then Atlas/Wiki/SCHEMA.md (type: llm-wiki) in:\n" +
      dirs.map((d) => `  ${d}`).join("\n") +
      "\nCreate a .wiki.json at the vault root (see plugin/templates/wiki.json) or run from inside a vault.",
  );
}
