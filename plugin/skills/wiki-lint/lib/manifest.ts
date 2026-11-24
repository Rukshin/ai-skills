// Ingest manifest helpers: read, hash files, compare entries.
// Node >= 22.18 (type stripping) or bun. Only `node:` built-ins.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

export type HashAlgo = "sha256" | "md5";

export interface ManifestEntry {
  hash: string;
  /** Missing means md5 (legacy entries). */
  hash_algo?: HashAlgo;
  url?: string;
  ingested_at?: string;
  status?: string;
  pages_created?: string[];
  pages_updated?: string[];
}

export interface Manifest {
  sources: Record<string, ManifestEntry>;
}

export interface Comparison {
  status: "match" | "mismatch" | "missing";
  algo: HashAlgo;
  expected: string;
  actual?: string;
}

export class ManifestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ManifestError";
  }
}

export function hashFile(path: string, algo: HashAlgo = "sha256"): string {
  return createHash(algo).update(readFileSync(path)).digest("hex");
}

export function entryAlgo(entry: { hash_algo?: HashAlgo }): HashAlgo {
  return entry.hash_algo ?? "md5";
}

export function compareEntry(entry: ManifestEntry, filePath: string): Comparison {
  const algo = entryAlgo(entry);
  let actual: string;
  try {
    actual = hashFile(filePath, algo);
  } catch {
    return { status: "missing", algo, expected: entry.hash };
  }
  const status = actual.toLowerCase() === entry.hash.toLowerCase() ? "match" : "mismatch";
  return { status, algo, expected: entry.hash, actual };
}

/** New entries always use sha256. */
export function newEntry(
  filePath: string,
  info: { url?: string; ingested_at?: string; status?: string; pages_created?: string[]; pages_updated?: string[] } = {},
): ManifestEntry {
  return {
    hash: hashFile(filePath, "sha256"),
    hash_algo: "sha256",
    url: info.url,
    ingested_at: info.ingested_at,
    status: info.status ?? "done",
    pages_created: info.pages_created ?? [],
    pages_updated: info.pages_updated ?? [],
  };
}

/** Returns undefined when the file does not exist; throws ManifestError when invalid. */
export function readManifest(path: string): Manifest | undefined {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    return undefined;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new ManifestError(`Invalid JSON in ${path}: ${(e as Error).message}`);
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new ManifestError(`${path} must contain a JSON object`);
  }
  const sources = (parsed as { sources?: unknown }).sources ?? {};
  if (sources === null || typeof sources !== "object" || Array.isArray(sources)) {
    throw new ManifestError(`${path}: "sources" must be an object`);
  }
  for (const [key, raw] of Object.entries(sources)) {
    const e = raw as Record<string, unknown> | null;
    if (e === null || typeof e !== "object" || typeof e.hash !== "string") {
      throw new ManifestError(`${path}: entry "${key}" needs a string "hash"`);
    }
    if (e.hash_algo !== undefined && e.hash_algo !== "sha256" && e.hash_algo !== "md5") {
      throw new ManifestError(`${path}: entry "${key}" has invalid hash_algo (use "sha256" or "md5")`);
    }
  }
  return { sources: sources as Record<string, ManifestEntry> };
}
