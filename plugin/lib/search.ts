// Read-only ranked search over a wiki: BM25 over page sections (title/meta/heading/body fields).
// Node >= 22.18 (type stripping) or bun. Only `node:` built-ins.
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import type { Resolved } from "./config.ts";
import { asList, maskCode, splitFrontmatter } from "./markdown.ts";

export interface Hit {
  page: string;
  heading: string | null;
  area: string | null;
  score: number;
  snippet: string;
}

export interface SearchOptions {
  query: string;
  top: number;
  /** An entry of `areas`, or "root" for pages outside every area. */
  area?: string;
}

interface Section {
  page: string;
  title: string;
  area: string | null;
  heading: string | null;
  meta: string;
  text: string;
}

const STOP = new Set(
  ("a an the of to in on for and or is are was were be by with as at it its that this what how when why who which from do does " +
    "el la los las un una unos unas de del y o en es son que qué como cómo cuando cuándo por para con se su sus al lo mi me te").split(" "),
);
const FIELD_WEIGHT = { title: 4, meta: 3, heading: 2, body: 1 } as const;
const TITLE_BONUS = 4;
const SNIPPET_MAX = 240;
const K1 = 1.4;
const B = 0.6;

function fold(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

/** Lowercase, accent-folded, stop-word-free tokens cut to 5 characters (cheap stemming). */
export function tokens(text: string): string[] {
  const out: string[] = [];
  for (const w of fold(text).match(/[a-z0-9]+/g) ?? []) {
    if (STOP.has(w) || w.length < 2) continue;
    out.push(w.length > 5 ? w.slice(0, 5) : w);
  }
  return out;
}

function listMd(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...listMd(p));
    else if (e.isFile() && e.name.endsWith(".md")) out.push(p);
  }
  return out.sort();
}

function sections(text: string, page: string, title: string, area: string | null): Section[] {
  const fm = splitFrontmatter(text);
  const meta = [...asList(fm.data.aliases), ...asList(fm.data.tags)].join(" ");
  const lines = text.replace(/\r\n/g, "\n").split("\n").slice(fm.bodyStartLine);
  const masked = maskCode(lines.join("\n")).split("\n");
  const out: Section[] = [];
  let heading: string | null = null;
  let buf: string[] = [];
  const flush = (): void => {
    const body = buf.join("\n").trim();
    if (heading !== null || body !== "") out.push({ page, title, area, heading, meta, text: body });
  };
  lines.forEach((line, i) => {
    const m = /^#{1,6}\s+(.+?)\s*#*\s*$/.exec(masked[i] ?? "");
    if (m) {
      flush();
      heading = m[1];
      buf = [];
    } else buf.push(line);
  });
  flush();
  return out;
}

function load(r: Resolved, area: string | undefined): Section[] {
  const { config, vaultRoot } = r;
  const wikiDir = join(vaultRoot, config.wiki_root);
  const skip = new Set([config.index, config.hot, config.log, "SCHEMA.md"]);
  const docs: Section[] = [];
  for (const file of listMd(wikiDir)) {
    const rel = relative(wikiDir, file).split(sep).join("/");
    if (skip.has(rel) || /(^|\/)lint-[^/]*\.md$/.test(rel)) continue;
    const first = rel.includes("/") ? rel.split("/")[0] : undefined;
    const pageArea = first !== undefined && config.areas.includes(first) ? first : null;
    if (area === "root" ? pageArea !== null : area !== undefined && pageArea !== area) continue;
    const page = rel.replace(/\.md$/, "");
    docs.push(...sections(readFileSync(file, "utf8"), page, page.split("/").pop() ?? page, pageArea));
  }
  return docs;
}

export function searchVault(r: Resolved, opts: SearchOptions): Hit[] {
  const q = [...new Set(tokens(opts.query))];
  if (q.length === 0) return [];
  const docs = load(r, opts.area);
  const bags = docs.map((d) => {
    const bag = new Map<string, number>();
    const add = (text: string, w: number): void => {
      for (const t of tokens(text)) bag.set(t, (bag.get(t) ?? 0) + w);
    };
    add(d.title, FIELD_WEIGHT.title);
    add(d.meta, FIELD_WEIGHT.meta);
    add(d.heading ?? "", FIELD_WEIGHT.heading);
    add(d.text, FIELD_WEIGHT.body);
    return bag;
  });
  const lens = bags.map((b) => [...b.values()].reduce((a, c) => a + c, 0));
  const n = docs.length;
  const avg = lens.reduce((a, c) => a + c, 0) / Math.max(n, 1) || 1;
  const df = new Map<string, number>();
  for (const b of bags) for (const t of b.keys()) df.set(t, (df.get(t) ?? 0) + 1);

  const scored: Array<{ score: number; doc: Section }> = [];
  docs.forEach((doc, i) => {
    const titleTokens = new Set(tokens(doc.title));
    let score = 0;
    for (const t of q) {
      const f = bags[i].get(t) ?? 0;
      if (!f) continue;
      const d = df.get(t) ?? 0;
      const idf = Math.log(1 + (n - d + 0.5) / (d + 0.5));
      score += (idf * f * (K1 + 1)) / (f + K1 * (1 - B + (B * lens[i]) / avg));
      if (titleTokens.has(t)) score += TITLE_BONUS * idf; // rare term named in the title: strong signal
    }
    if (score > 0) scored.push({ score, doc });
  });
  scored.sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const hits: Hit[] = [];
  for (const { score, doc } of scored) {
    if (seen.has(doc.page)) continue; // best-scoring section per page
    seen.add(doc.page);
    hits.push({
      page: doc.page,
      heading: doc.heading,
      area: doc.area,
      score: Math.round(score * 100) / 100,
      snippet: doc.text.replace(/\s+/g, " ").slice(0, SNIPPET_MAX),
    });
    if (hits.length === opts.top) break;
  }
  return hits;
}
