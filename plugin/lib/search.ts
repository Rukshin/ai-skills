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
  /** Share (0-1, idf-weighted) of the query terms found anywhere in the page. */
  coverage: number;
  snippet: string;
}

/** high: every query term occurs in the wiki and the top page covers most of them; low: a gap is likely; none: no hit. */
export type Confidence = "high" | "low" | "none";

export interface SearchResult {
  results: Hit[];
  /** Query terms (after stop words) that occur nowhere in the wiki: gap candidates. */
  unmatched_terms: string[];
  confidence: Confidence;
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
  /** Archived answer page (tag ending in "question"): derived, ranked below compiled pages. */
  derived: boolean;
}

const STOP = new Set(
  ("a an the of to in on for and or is are was were be by with as at it its that this what how when why who which from do does " +
    "el la los las un una unos unas de del y o en es son que qué como cómo cuando cuándo por para con se su sus al lo mi me te " +
    "can could would should many much use used using about there their they you your i my we our not no if then so than but each every any some all other " +
    "get make tell give show explain hay ser sobre entre pero muy sin más mas").split(" "),
);
const FIELD_WEIGHT = { title: 4, meta: 3, heading: 2, body: 1 } as const;
const TITLE_BONUS = 1.5;
const DERIVED_FACTOR = 0.5;
const LOW_COVERAGE = 0.5;
const SNIPPET_MAX = 240;
const K1 = 1.4;
const B = 0.6;

function fold(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

/** Light stemmer: plural -s/-ies and -ing only, so "pointers" and "point" stay distinct. */
function stem(w: string): string {
  if (w.length > 4 && w.endsWith("ies")) return `${w.slice(0, -3)}y`;
  if (w.length > 6 && w.endsWith("ing")) return w.slice(0, -3);
  if (w.length > 3 && w.endsWith("s") && !/(ss|us|is)$/.test(w)) return w.slice(0, -1);
  return w;
}

/** Lowercase, accent-folded, stop-word-free terms with their stems. */
function terms(text: string): Array<{ word: string; stem: string }> {
  const out: Array<{ word: string; stem: string }> = [];
  for (const w of fold(text).match(/[a-z0-9]+/g) ?? []) {
    if (STOP.has(w) || w.length < 2) continue;
    out.push({ word: w, stem: stem(w) });
  }
  return out;
}

export function tokens(text: string): string[] {
  return terms(text).map((t) => t.stem);
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
  const derived = asList(fm.data.tags).some((t) => /question$/i.test(t));
  const meta = [...asList(fm.data.aliases), ...asList(fm.data.tags)].join(" ");
  const lines = text.replace(/\r\n/g, "\n").split("\n").slice(fm.bodyStartLine);
  const masked = maskCode(lines.join("\n")).split("\n");
  const out: Section[] = [];
  let heading: string | null = null;
  let buf: string[] = [];
  const flush = (): void => {
    const body = buf.join("\n").trim();
    if (heading !== null || body !== "") out.push({ page, title, area, heading, meta, text: body, derived });
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

function load(r: Resolved): Section[] {
  const { config, vaultRoot } = r;
  const wikiDir = join(vaultRoot, config.wiki_root);
  const skip = new Set([config.index, config.hot, config.log, "SCHEMA.md"]);
  const docs: Section[] = [];
  for (const file of listMd(wikiDir)) {
    const rel = relative(wikiDir, file).split(sep).join("/");
    if (skip.has(rel) || /(^|\/)lint-[^/]*\.md$/.test(rel)) continue;
    const first = rel.includes("/") ? rel.split("/")[0] : undefined;
    const pageArea = first !== undefined && config.areas.includes(first) ? first : null;
    const page = rel.replace(/\.md$/, "");
    docs.push(...sections(readFileSync(file, "utf8"), page, page.split("/").pop() ?? page, pageArea));
  }
  return docs;
}

export function searchVault(r: Resolved, opts: SearchOptions): SearchResult {
  const queryTerms = terms(opts.query);
  const q = [...new Set(queryTerms.map((t) => t.stem))];
  if (q.length === 0) return { results: [], unmatched_terms: [], confidence: "none" };
  const docs = load(r);
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
  const idfOf = (t: string): number => {
    const d = df.get(t) ?? 0;
    return Math.log(1 + (n - d + 0.5) / (d + 0.5));
  };

  const unmatched: string[] = [];
  for (const t of queryTerms) if (!df.has(t.stem) && !unmatched.includes(t.word)) unmatched.push(t.word);

  // Page-level term sets drive coverage: how much of the question the page as a whole answers.
  const pageTerms = new Map<string, Set<string>>();
  docs.forEach((d, i) => {
    const set = pageTerms.get(d.page) ?? new Set<string>();
    for (const t of bags[i].keys()) set.add(t);
    pageTerms.set(d.page, set);
  });
  const totalIdf = q.reduce((a, t) => a + idfOf(t), 0) || 1;

  const best = new Map<string, { score: number; doc: Section }>();
  docs.forEach((doc, i) => {
    if (opts.area === "root" ? doc.area !== null : opts.area !== undefined && doc.area !== opts.area) return;
    const titleTokens = new Set(tokens(doc.title));
    let score = 0;
    for (const t of q) {
      const f = bags[i].get(t) ?? 0;
      if (!f) continue;
      const idf = idfOf(t);
      score += (idf * f * (K1 + 1)) / (f + K1 * (1 - B + (B * lens[i]) / avg));
      if (titleTokens.has(t)) score += TITLE_BONUS * idf;
    }
    if (score <= 0) return;
    const cov = q.reduce((a, t) => a + (pageTerms.get(doc.page)?.has(t) ? idfOf(t) : 0), 0) / totalIdf;
    score *= (0.4 + 0.6 * cov) * (doc.derived ? DERIVED_FACTOR : 1);
    const cur = best.get(doc.page);
    if (!cur || score > cur.score) best.set(doc.page, { score, doc });
  });

  const hits: Hit[] = [...best.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, opts.top)
    .map(({ score, doc }) => ({
      page: doc.page,
      heading: doc.heading,
      area: doc.area,
      score: Math.round(score * 100) / 100,
      coverage: Math.round((q.reduce((a, t) => a + (pageTerms.get(doc.page)?.has(t) ? idfOf(t) : 0), 0) / totalIdf) * 100) / 100,
      snippet: doc.text.replace(/\s+/g, " ").slice(0, SNIPPET_MAX),
    }));
  const confidence: Confidence = hits.length === 0 ? "none" : unmatched.length > 0 || hits[0].coverage < LOW_COVERAGE ? "low" : "high";
  return { results: hits, unmatched_terms: unmatched, confidence };
}
