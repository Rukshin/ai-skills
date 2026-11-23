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

Load when the user invokes `/wiki-ingest`, drops a file path inside `{raw}` or a URL and wants it compiled into `{wiki_root}`, or says "ingest this", "add this to the wiki", or "process this article".

## Hard Rules

- File tools (Read/Write/Edit/Bash) are primary. The `obsidian` CLI is optional: it hangs indefinitely when Obsidian is closed, so run it with a time limit (e.g. `timeout 20 obsidian ...`) and fall back to file tools on failure or timeout.
- Read at most 5 existing wiki pages per ingest; use `hot_path` and `index_path` to choose which ones matter.
- Skip unchanged sources — if the manifest already has the same path with the same hash, stop and report "Already ingested (unchanged). Use 'force ingest' to re-ingest."
- Never silently overwrite a conflicting claim — add a `[!contradiction]` callout to the affected page instead.
- Wiki pages are written in `{language}` regardless of the source language.
- Read `{wiki_root}/SCHEMA.md` before writing any pages — it defines naming conventions, frontmatter, and collision resolution.

## Decision Gates

Area routing uses `areas` from the resolved config. An area is selected when the source path is under `{raw}/<area>/` or the user explicitly names it, and `<area>` is listed in `areas`. Otherwise use the default row.

| Condition | `target_dir` | `moc_page` | `hot_path` | `index_path` |
|-----------|-------------|-----------|----------|------------|
| area `<area>` selected (listed in `areas`) | `{wiki_root}/<area>/` | `[[<area>/index]]` | `{wiki_root}/<area>/{hot}` | `{wiki_root}/<area>/{index}` |
| otherwise (default) | `{wiki_root}/` | `[[index]]` | `{wiki_root}/{hot}` | `{wiki_root}/{index}` |

## Execution Steps

1. **Resolve vault config** — run `node <skill-dir>/../../scripts/wiki-config.ts --start "$PWD"` (`<skill-dir>` is the directory containing this SKILL.md; the script is at `plugin/scripts/wiki-config.ts` from the plugin root). Read the JSON from stdout and use these keys: `wiki_root`, `raw`, `manifest`, `attachments`, `index`, `hot`, `log`, `language`, `areas`, `fetchers`. Paths are vault-relative to `vaultRoot`; `index`, `hot` and `log` are relative to `{wiki_root}`. On exit 1 or 2, stop and show stderr to the user — never guess a vault. If `node` is unavailable or older than 22.18, apply the same rules by hand: nearest `.wiki.json` walking up, else nearest `Atlas/Wiki/SCHEMA.md` with `type: llm-wiki`, else stop.
2. **Detect area** — apply Decision Gates; set `target_dir`, `moc_page`, `hot_path`, `index_path`.
3. **Orient + delta-check** — read `hot_path` for recent context; check `{manifest}` for the source path/URL; skip if already ingested unchanged.
4. **Read source** — file: read it with the Read tool (or `obsidian read path="..."` when the CLI responds). URL: try the `fetchers` in order (`firecrawl-scrape` → invoke the skill; `webfetch` → WebFetch tool) and capture the markdown output.
5. **Discuss before writing** — share 3–5 key takeaways, proposed pages, and any contradictions with existing wiki content; use `AskUserQuestion` to confirm emphasis. Do not skip.
6. **Write pages** — in order: source summary page → concept pages (create or update) → person pages (create or update) → add `[!contradiction]` callouts where conflicts exist.
7. **Update housekeeping** — update `index_path` → prepend to `{wiki_root}/{log}` → update `hot_path` → update `{manifest}` → delete raw file (ask first; if it contains local images, move them to `{attachments}` instead).

## Output Contract

Report back with:
- Wikilinks to all created and updated pages
- Confirmation that `{log}` was prepended
- Confirmation that manifest was updated
- Whether the raw file was deleted or retained (and why)

## References

- `../../_shared/cli-commands.md` — all obsidian CLI commands, hash/manifest formats, contradiction callout syntax
- `{wiki_root}/SCHEMA.md` (vault) — naming conventions, frontmatter format, page structures, collision resolution
