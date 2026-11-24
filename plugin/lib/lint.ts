// Read-only wiki lint: eight checks over a resolved vault. Never writes.
// Node >= 22.18 (type stripping) or bun. Only `node:` built-ins.
import { readdirSync, readFileSync } from "node:fs";
import { join, posix } from "node:path";
import type { Resolved } from "./config.ts";
import { asList, extractHeadings, extractWikilinks, maskCode, splitFrontmatter } from "./markdown.ts";
import type { WikiLink } from "./markdown.ts";
import { compareEntry, readManifest, ManifestError } from "./manifest.ts";

export interface Issue {
  path: string;
  line?: number;
  severity: "error" | "warning";
  message: string;
  fix_hint?: string;
}
export interface CheckResult {
  id: string;
  name: string;
  issues: Issue[];
}
export interface Report {
  vaultRoot: string;
  asOf: string;
  summary: { issues_found: number; by_check: Record<string, number> };
  checks: CheckResult[];
}
export interface LintOptions {
  asOf: string;
  exclude: string[];
}

export const CHECKS: { id: string; name: string }[] = [
  { id: "dead-links", name: "Dead links" },
  { id: "orphans", name: "Orphan pages" },
  { id: "frontmatter-gaps", name: "Frontmatter gaps" },
  { id: "up-chain", name: "Up chain" },
  { id: "index-drift", name: "Index drift" },
  { id: "manifest-drift", name: "Manifest drift" },
  { id: "stale-contradictions", name: "Stale contradictions" },
  { id: "empty-sections", name: "Empty sections" },
];

const STALE_DAYS = 30;

// ---------- helpers ----------

export function globToRegExp(glob: string): RegExp {
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        i++;
        if (glob[i + 1] === "/") {
          i++;
          re += "(?:.*/)?";
        } else re += ".*";
      } else re += "[^/]*";
    } else if (c === "?") re += "[^/]";
    else re += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${re}$`);
}

function excluder(globs: string[]): (rel: string) => boolean {
  const rules = globs.map((g) => ({ re: globToRegExp(g.replace(/\/+$/, "")), base: !g.includes("/") }));
  return (rel) => {
    const name = rel.slice(rel.lastIndexOf("/") + 1);
    return rules.some((r) => r.re.test(rel) || (r.base && r.re.test(name)) || r.re.test(rel.split("/").slice(0, -1).join("/")));
  };
}

/** Vault-relative file paths (posix), skipping dot entries and symlinks. */
function walk(vaultRoot: string, rel = ""): string[] {
  const out: string[] = [];
  let entries;
  try {
    entries = readdirSync(join(vaultRoot, rel), { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name.startsWith(".") || e.isSymbolicLink()) continue;
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...walk(vaultRoot, r));
    else if (e.isFile()) out.push(r);
  }
  return out.sort();
}

function readText(vaultRoot: string, rel: string): string {
  try {
    return readFileSync(join(vaultRoot, rel), "utf8");
  } catch {
    return "";
  }
}

function nameOf(rel: string): string {
  return rel.slice(rel.lastIndexOf("/") + 1).replace(/\.md$/i, "");
}

interface Page {
  rel: string;
  name: string;
  data: Record<string, string | string[]>;
  masked: string;
  bodyStart: number;
  /** Links with source line; frontmatter links flagged. */
  links: (WikiLink & { fm: boolean })[];
  operational: boolean;
  excluded: boolean;
}

function dayNumber(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

export function validDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

// ---------- main ----------

export function lintVault(resolved: Resolved, opts: LintOptions): Report {
  const { vaultRoot, config } = resolved;
  const isExcluded = excluder(opts.exclude);
  const wikiRoot = config.wiki_root.replace(/^\.\/+|\/+$/g, "");
  const indexRel = posix.join(wikiRoot, config.index);
  const hotRel = posix.join(wikiRoot, config.hot);
  const logRel = posix.join(wikiRoot, config.log);
  const inWiki = (rel: string) => rel.startsWith(`${wikiRoot}/`);

  const files = walk(vaultRoot);
  // Name index over every vault file so links to notes outside the wiki resolve.
  const byName = new Map<string, string[]>();
  const add = (k: string, rel: string) => byName.set(k, [...(byName.get(k) ?? []), rel]);
  for (const rel of files) {
    const base = rel.slice(rel.lastIndexOf("/") + 1);
    if (/\.md$/i.test(base)) add(base.replace(/\.md$/i, "").toLowerCase(), rel);
    else add(base.toLowerCase(), rel);
  }
  const resolveLink = (target: string): string[] => {
    const t = target.replace(/^\/+/, "").replace(/\.md$/i, "").toLowerCase();
    const candidates = byName.get(t.slice(t.lastIndexOf("/") + 1)) ?? [];
    if (!t.includes("/")) return [...candidates].sort();
    return candidates.filter((c) => c.replace(/\.md$/i, "").toLowerCase().endsWith(`/${t}`) || c.replace(/\.md$/i, "").toLowerCase() === t).sort();
  };

  const operationalNames = new Set([hotRel, logRel, posix.join(wikiRoot, "SCHEMA.md")]);
  const pages: Page[] = [];
  for (const rel of files) {
    if (!inWiki(rel) || !/\.md$/i.test(rel)) continue;
    const text = readText(vaultRoot, rel);
    const fm = splitFrontmatter(text);
    const lines = text.replace(/\r\n/g, "\n").split("\n");
    const fmText = lines.slice(0, fm.bodyStartLine).join("\n");
    const body = lines.slice(fm.bodyStartLine).join("\n");
    const masked = maskCode(body);
    const links = [
      ...extractWikilinks(fmText, 0).map((l) => ({ ...l, fm: true })),
      ...extractWikilinks(masked, fm.bodyStartLine).map((l) => ({ ...l, fm: false })),
    ];
    const base = rel.slice(rel.lastIndexOf("/") + 1);
    pages.push({
      rel,
      name: nameOf(rel),
      data: fm.data,
      masked,
      bodyStart: fm.bodyStartLine,
      links,
      operational: operationalNames.has(rel) || rel === indexRel || /^lint-.*\.md$/i.test(base),
      excluded: isExcluded(rel),
    });
  }
  const pageByRel = new Map(pages.map((p) => [p.rel, p]));
  const live = pages.filter((p) => !p.excluded);
  const content = live.filter((p) => !p.operational);
  const results: Record<string, Issue[]> = Object.fromEntries(CHECKS.map((c) => [c.id, []]));
  const push = (id: string, issue: Issue) => results[id].push(issue);

  // Resolve every link once.
  const resolved_ = new Map<Page, { link: WikiLink & { fm: boolean }; targets: string[] }[]>();
  for (const p of pages) resolved_.set(p, p.links.map((link) => ({ link, targets: resolveLink(link.target) })));

  // 1. dead-links (index entries are reported by index-drift)
  const schemaRel = posix.join(wikiRoot, "SCHEMA.md");
  for (const p of live) {
    if (p.rel === schemaRel) continue; // SCHEMA documents placeholder links such as [[Source]]
    for (const { link, targets } of resolved_.get(p)!) {
      if (targets.length === 0) {
        if (p.rel === indexRel) continue;
        push("dead-links", {
          path: p.rel,
          line: link.line,
          severity: "error",
          message: `Dead link: [[${link.target}]]`,
          fix_hint: "Create the page, fix the target name, or remove the link",
        });
      } else if (targets.length > 1) {
        push("dead-links", {
          path: p.rel,
          line: link.line,
          severity: "warning",
          message: `Ambiguous link [[${link.target}]]: matches ${targets.join(", ")}`,
          fix_hint: "Use a path-qualified link such as [[Folder/Name]]",
        });
      }
    }
  }

  // 2. orphans: inbound links from other content pages only
  const inbound = new Set<string>();
  for (const p of pages) {
    if (p.operational) continue;
    for (const { targets } of resolved_.get(p)!) for (const t of targets) if (t !== p.rel) inbound.add(t);
  }
  for (const p of content) {
    if (!inbound.has(p.rel)) {
      push("orphans", {
        path: p.rel,
        severity: "warning",
        message: "No inbound links from other content pages",
        fix_hint: "Link to this page from a related page, or review whether it should exist",
      });
    }
  }

  // 3. frontmatter-gaps
  for (const p of content) {
    const missing: string[] = [];
    if (asList(p.data.up).length === 0) missing.push("up");
    if (asList(p.data.created).length === 0) missing.push("created");
    if (asList(p.data.sources).length === 0) missing.push("sources");
    const tags = [...asList(p.data.tags), ...(p.masked.match(/(?:^|\s)#wiki\/[\w/-]+/g) ?? []).map((t) => t.trim())];
    if (!tags.some((t) => /^#?wiki\/\S+/.test(t))) missing.push("wiki/* tag");
    if (missing.length) {
      push("frontmatter-gaps", {
        path: p.rel,
        severity: "error",
        message: `Missing frontmatter: ${missing.join(", ")}`,
        fix_hint: "Add the missing fields following SCHEMA.md",
      });
    }
  }

  // 4. up-chain
  const upParents = (p: Page): string[] => {
    const out: string[] = [];
    for (const v of asList(p.data.up)) for (const l of extractWikilinks(v)) out.push(...resolveLink(l.target));
    return [...new Set(out)];
  };
  const reaches = (start: Page): { ok: true } | { ok: false; reason: string } => {
    let reason = "";
    const walkUp = (p: Page, path: string[]): boolean => {
      if (p.rel === indexRel) return true;
      if (path.includes(p.rel)) {
        const cyc = [...path.slice(path.indexOf(p.rel)), p.rel].map((r) => nameOf(r));
        reason = `cycle ${cyc.join(" -> ")}`;
        return false;
      }
      const parents = upParents(p);
      if (parents.length === 0) {
        reason = asList(p.data.up).length ? `broken \`up\` link in ${p.name}` : `${p.name} has no \`up\``;
        return false;
      }
      let any = false;
      for (const par of parents) {
        const pp = pageByRel.get(par);
        if (!pp) {
          reason = `leaves the wiki at ${nameOf(par)}`;
          continue;
        }
        if (walkUp(pp, [...path, p.rel])) any = true;
      }
      return any;
    };
    return walkUp(start, []) ? { ok: true } : { ok: false, reason };
  };
  for (const p of live) {
    if (p.rel === indexRel || asList(p.data.up).length === 0) continue;
    const r = reaches(p);
    if (!r.ok) {
      push("up-chain", {
        path: p.rel,
        severity: "error",
        message: `\`up\` chain does not reach ${config.index}: ${r.reason}`,
        fix_hint: `Point \`up\` at a page whose chain ends at ${config.index}`,
      });
    }
  }

  // 5. index-drift
  const indexPage = pageByRel.get(indexRel);
  if (indexPage && !indexPage.excluded) {
    const listed = new Set<string>();
    for (const { link, targets } of resolved_.get(indexPage)!) {
      if (link.fm) continue;
      if (targets.length === 0) {
        push("index-drift", {
          path: indexRel,
          line: link.line,
          severity: "error",
          message: `Index entry points to a missing page: [[${link.target}]]`,
          fix_hint: "Remove the entry or restore the page",
        });
      }
      for (const t of targets) listed.add(t);
    }
    for (const p of content) {
      // A page also counts as indexed when its `up` target is listed (hub/MOC layout).
      if (!listed.has(p.rel) && !upParents(p).some((t) => listed.has(t))) {
        push("index-drift", {
          path: p.rel,
          severity: "warning",
          message: `Page is not listed in ${config.index}`,
          fix_hint: "Add an entry with a one-line summary to the right section",
        });
      }
    }
  }

  // 6. manifest-drift
  manifestDrift(vaultRoot, config, files, isExcluded, wikiRoot, push);

  // 7. stale-contradictions and 8. empty-sections
  const today = dayNumber(opts.asOf);
  for (const p of live) {
    if (/^lint-.*\.md$/i.test(p.rel.slice(p.rel.lastIndexOf("/") + 1))) continue;
    const lines = p.masked.split("\n");
    lines.forEach((line, i) => {
      const m = /^\s*>\s*\[!contradiction\]\s+(\d{4}-\d{2}-\d{2})/i.exec(line);
      if (!m || !validDate(m[1])) return;
      const age = today - dayNumber(m[1]);
      if (age > STALE_DAYS) {
        push("stale-contradictions", {
          path: p.rel,
          line: i + 1 + p.bodyStart,
          severity: "warning",
          message: `Contradiction from ${m[1]} is ${age} days old (> ${STALE_DAYS})`,
          fix_hint: "Decide which side is correct, then resolve or update the callout",
        });
      }
    });
    const heads = extractHeadings(p.masked);
    heads.forEach((h, idx) => {
      // A section ends at the next heading of the same or a higher level.
      const next = heads.slice(idx + 1).find((x) => x.level <= h.level);
      const end = next ? next.line - 1 : lines.length;
      const hasContent = lines.slice(h.line, end).some((l) => l.trim() !== "");
      if (!hasContent) {
        push("empty-sections", {
          path: p.rel,
          line: h.line + p.bodyStart,
          severity: "warning",
          message: `Empty section: ${"#".repeat(h.level)} ${h.text}`,
          fix_hint: "Add content or remove the heading",
        });
      }
    });
  }

  const checks: CheckResult[] = CHECKS.map((c) => ({
    id: c.id,
    name: c.name,
    issues: results[c.id].sort((a, b) => a.path.localeCompare(b.path) || (a.line ?? 0) - (b.line ?? 0) || a.message.localeCompare(b.message)),
  }));
  const by_check = Object.fromEntries(checks.map((c) => [c.id, c.issues.length]));
  return {
    vaultRoot,
    asOf: opts.asOf,
    summary: { issues_found: checks.reduce((n, c) => n + c.issues.length, 0), by_check },
    checks,
  };
}

function manifestDrift(
  vaultRoot: string,
  config: Resolved["config"],
  files: string[],
  isExcluded: (rel: string) => boolean,
  wikiRoot: string,
  push: (id: string, issue: Issue) => void,
): void {
  const id = "manifest-drift";
  const manifestRel = config.manifest;
  const rawRel = config.raw.replace(/^\.\/+|\/+$/g, "");
  let manifest;
  try {
    manifest = readManifest(join(vaultRoot, manifestRel));
  } catch (e) {
    if (e instanceof ManifestError) {
      push(id, { path: manifestRel, severity: "error", message: e.message });
      return;
    }
    throw e;
  }
  const fileSet = new Set(files);
  const keyToFile = (key: string): string | undefined => {
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(key)) return undefined;
    const k = key.replace(/^\.\/+/, "");
    if (fileSet.has(k)) return k;
    const inRaw = `${rawRel}/${k}`;
    return fileSet.has(inRaw) ? inRaw : undefined;
  };
  const tracked = new Set<string>();
  const sources = manifest?.sources ?? {};
  for (const [key, entry] of Object.entries(sources)) {
    const rel = keyToFile(key);
    if (rel) tracked.add(rel);
    // Sources may be deleted after ingest, so a missing source file is not drift.
    if (rel && !isExcluded(rel)) {
      const cmp = compareEntry(entry, join(vaultRoot, rel));
      if (cmp.status === "mismatch") {
        const how = entry.hash_algo ? entry.hash_algo : "md5, entry has no hash_algo";
        push(id, {
          path: rel,
          severity: "warning",
          message: `Hash mismatch (${how}): source changed since ingest`,
          fix_hint: "Re-ingest the source (new entries use sha256) or confirm the change is intended",
        });
      }
    }
    if (!isExcluded(manifestRel)) {
      for (const page of entry.pages_created ?? []) {
        if (!fileSet.has(posix.join(wikiRoot, page))) {
          push(id, {
            path: manifestRel,
            severity: "warning",
            message: `Page in pages_created no longer exists: ${page} (source ${key})`,
            fix_hint: "Remove it from the entry or restore the page",
          });
        }
      }
    }
  }
  for (const rel of files) {
    if (!rel.startsWith(`${rawRel}/`) || rel === manifestRel || tracked.has(rel) || isExcluded(rel)) continue;
    push(id, {
      path: rel,
      severity: "warning",
      message: "Raw file is not in the manifest",
      fix_hint: "Ingest it with wiki-ingest, or delete it if it is not needed",
    });
  }
}

export function renderMarkdown(report: Report): string {
  const out: string[] = [];
  out.push("# Wiki lint report", "");
  out.push(`- Vault: \`${report.vaultRoot}\``, `- As of: ${report.asOf}`, `- Issues found: ${report.summary.issues_found}`, "");
  out.push("| Check | Issues |", "|-------|--------|");
  for (const c of report.checks) out.push(`| ${c.name} | ${c.issues.length} |`);
  out.push("");
  for (const c of report.checks) {
    out.push(`## ${c.name} (${c.issues.length})`, "");
    if (c.issues.length === 0) out.push("No issues.", "");
    else {
      for (const i of c.issues) {
        const loc = i.line ? `${i.path}:${i.line}` : i.path;
        out.push(`- ${i.severity} \`${loc}\` ${i.message}${i.fix_hint ? ` — ${i.fix_hint}` : ""}`);
      }
      out.push("");
    }
  }
  return out.join("\n");
}
