---
name: wiki-ingest
description: "Trigger: /wiki-ingest or user says 'ingest this', 'add to wiki', 'process this article'. Compiles a raw source (file or URL) into the LLM Wiki."
license: MIT
metadata:
  author: jordi.pulido
  version: 2.0.0
allowed-tools: Bash, Read, Write, Edit, WebFetch, AskUserQuestion
---

## Activation Contract

Load when the user invokes `/wiki-ingest`, drops a file path inside `+/raw/` or a URL and wants it compiled into `Atlas/Wiki/`, or says "ingest this", "add this to the wiki", or "process this article".

## Hard Rules

- Obsidian must be open — CLI commands hang indefinitely otherwise. Ask the user to open it if commands fail.
- Read at most 5 existing wiki pages per ingest; use `hot_path` and `index_path` to choose which ones matter.
- Skip unchanged sources — if the manifest already has the same path with the same hash, stop and report "Already ingested (unchanged). Use 'force ingest' to re-ingest."
- Never silently overwrite a conflicting claim — add a `[!contradiction]` callout to the affected page instead.
- Work pages are always written in English regardless of the source language.
- Read `Atlas/Wiki/SCHEMA.md` before writing any pages — it defines naming conventions, frontmatter, and collision resolution.

## Decision Gates

| Condition | `target_dir` | `moc_page` | `hot_path` | `index_path` |
|-----------|-------------|-----------|----------|------------|
| path starts `+/raw/work/` OR url contains `confluence` or `adevinta` | `Atlas/Wiki/Work/` | `[[Work/index]]` | `Atlas/Wiki/Work/hot.md` | `Atlas/Wiki/Work/index.md` |
| otherwise (default) | `Atlas/Wiki/` | `[[index]]` | `Atlas/Wiki/hot.md` | `Atlas/Wiki/index.md` |

## Execution Steps

1. **Detect domain** — apply Decision Gates; set `target_dir`, `moc_page`, `hot_path`, `index_path`.
2. **Orient + delta-check** — read `hot_path` for recent context; check manifest for the source path/URL; skip if already ingested unchanged.
3. **Read source** — file: `obsidian read path="..."`. URL: invoke the `firecrawl-scrape` skill and capture its markdown output.
4. **Discuss before writing** — share 3–5 key takeaways, proposed pages, and any contradictions with existing wiki content; use `AskUserQuestion` to confirm emphasis. Do not skip.
5. **Write pages** — in order: source summary page → concept pages (create or update) → person pages (create or update) → add `[!contradiction]` callouts where conflicts exist.
6. **Update housekeeping** — update `index_path` → prepend to `Atlas/Wiki/log.md` → update `hot_path` → update manifest → delete raw file (ask first; if it contains local images, move them to `x/Wiki/` instead).

## Output Contract

Report back with:
- Wikilinks to all created and updated pages
- Confirmation that `log.md` was prepended
- Confirmation that manifest was updated
- Whether the raw file was deleted or retained (and why)

## References

- `../_shared/cli-commands.md` — all obsidian CLI commands, hash/manifest formats, contradiction callout syntax
- `Atlas/Wiki/SCHEMA.md` (vault) — naming conventions, frontmatter format, page structures, collision resolution
