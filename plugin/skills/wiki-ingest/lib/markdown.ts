// Tiny markdown helpers for the wiki lint: frontmatter, wikilinks, headings.
// Node >= 22.18 (type stripping) or bun. No dependencies.

export type FmValue = string | string[];

export interface Frontmatter {
  data: Record<string, FmValue>;
  /** Number of lines before the body starts (0 when there is no frontmatter). */
  bodyStartLine: number;
}

export interface WikiLink {
  target: string;
  heading?: string;
  alias?: string;
  embed: boolean;
  /** 1-based line in the text passed in (plus any offset). */
  line: number;
}

export interface Heading {
  level: number;
  text: string;
  line: number;
}

function unquote(s: string): string {
  const t = s.trim();
  if (t.length >= 2 && ((t[0] === '"' && t.endsWith('"')) || (t[0] === "'" && t.endsWith("'")))) return t.slice(1, -1);
  return t;
}

function splitInline(inner: string): string[] {
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
    } else cur += ch;
  }
  out.push(cur);
  return out.map(unquote).filter((x) => x !== "");
}

function parseScalarOrList(raw: string): FmValue {
  let v = raw.trim();
  if (v[0] !== '"' && v[0] !== "'") {
    const hash = v.search(/\s#/);
    if (hash >= 0) v = v.slice(0, hash).trim();
  }
  // An unquoted `[[Link]]` is a wikilink string, not a nested list.
  if (v.startsWith("[[")) return v;
  if (v.startsWith("[") && v.endsWith("]")) return splitInline(v.slice(1, -1));
  return unquote(v);
}

export function splitFrontmatter(text: string): Frontmatter {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const data: Record<string, FmValue> = {};
  if (lines[0]?.trim() !== "---") return { data, bodyStartLine: 0 };
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      end = i;
      break;
    }
  }
  if (end < 0) return { data, bodyStartLine: 0 };
  let list: string[] | undefined;
  for (let i = 1; i < end; i++) {
    const line = lines[i];
    const item = /^\s+-\s+(.*)$/.exec(line);
    if (item && list) {
      list.push(unquote(item[1].trim()));
      continue;
    }
    const m = /^([A-Za-z_][\w-]*)\s*:(.*)$/.exec(line);
    list = undefined;
    if (!m) continue;
    if (m[2].trim() === "") {
      list = [];
      data[m[1]] = list;
    } else data[m[1]] = parseScalarOrList(m[2]);
  }
  return { data, bodyStartLine: end + 1 };
}

/** Values of a frontmatter key as a list of strings. */
export function asList(v: FmValue | undefined): string[] {
  if (v === undefined) return [];
  return (Array.isArray(v) ? v : [v]).filter((x) => x.trim() !== "");
}

/**
 * Blanks out fenced code blocks and inline code spans, keeping line structure,
 * so line numbers and offsets stay valid for later scans.
 */
export function maskCode(text: string): string {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  let fence: { ch: string; len: number } | undefined;
  const out = lines.map((line) => {
    const m = /^\s{0,3}(`{3,}|~{3,})/.exec(line);
    if (fence) {
      if (m && m[1][0] === fence.ch && m[1].length >= fence.len && line.trim() === m[1]) fence = undefined;
      return "";
    }
    if (m) {
      fence = { ch: m[1][0], len: m[1].length };
      return "";
    }
    return maskInline(line);
  });
  return out.join("\n");
}

function maskInline(line: string): string {
  let out = "";
  let i = 0;
  while (i < line.length) {
    if (line[i] !== "`") {
      out += line[i++];
      continue;
    }
    let n = 0;
    while (line[i + n] === "`") n++;
    const close = line.indexOf("`".repeat(n), i + n);
    if (close < 0) {
      out += line.slice(i, i + n);
      i += n;
    } else {
      out += " ".repeat(close + n - i);
      i = close + n;
    }
  }
  return out;
}

/** Wikilinks in already-masked text. `lineOffset` is added to the 1-based line. */
export function extractWikilinks(text: string, lineOffset = 0): WikiLink[] {
  const links: WikiLink[] = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const re = /(!?)\[\[([^\]\n]+?)\]\]/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(lines[i])) !== null) {
      const inner = m[2];
      const pipe = inner.indexOf("|");
      let target = (pipe >= 0 ? inner.slice(0, pipe) : inner).replace(/\\$/, "").trim();
      const alias = pipe >= 0 ? inner.slice(pipe + 1).trim() : undefined;
      let heading: string | undefined;
      const hash = target.indexOf("#");
      if (hash >= 0) {
        heading = target.slice(hash + 1).trim() || undefined;
        target = target.slice(0, hash).trim();
      }
      if (target === "") continue;
      links.push({ target, heading, alias, embed: m[1] === "!", line: i + 1 + lineOffset });
    }
  }
  return links;
}

/** ATX headings in already-masked text. */
export function extractHeadings(text: string, lineOffset = 0): Heading[] {
  const out: Heading[] = [];
  text.split("\n").forEach((line, i) => {
    const m = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (m) out.push({ level: m[1].length, text: m[2], line: i + 1 + lineOffset });
  });
  return out;
}
