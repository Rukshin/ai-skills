---
name: wiki-lint
description: "Trigger: /wiki-lint or 'health check the wiki', 'wiki needs maintenance'. Runs 8 checks on the vault wiki, auto-fixes safe issues, flags the rest."
license: MIT
metadata:
  author: jordi.pulido
  version: 2.0.0
allowed-tools: Bash, Read, Write, Edit, AskUserQuestion
---

## Activation Contract

Load when the user invokes `/wiki-lint`, says "health check the wiki", "the wiki needs maintenance", "clean up the wiki", or the wiki has grown significantly since the last lint pass.

## Hard Rules

- File tools (Read/Write/Edit/Bash) are primary. The `obsidian` CLI is optional: it hangs indefinitely when Obsidian is closed, so run it with a time limit (e.g. `timeout 20 obsidian ...`) and fall back to file tools on failure or timeout.
- Read `{wiki_root}/SCHEMA.md` before starting — naming conventions and structural rules live there.
- Operational files are exempt from frontmatter checks: `{hot}`, `{log}`, `SCHEMA.md`, lint report files.
- Never delete or merge pages unilaterally — always present for user review first.
- Collect all findings before writing anything — write the report once at the end.

## Decision Gates

| Finding type | Action |
|--------------|--------|
| Missing `created` frontmatter field | Auto-fix: add today's date (or file creation date if determinable) |
| Missing `type` tag (`#wiki/concept`, `#wiki/person`, etc.) | Auto-fix: infer from page content and add |
| Missing index entries (page exists but not in `{index}`) | Auto-fix: add to correct section with one-line summary |
| High-frequency dead links (5+ references, no page) | Auto-fix: create stub page with frontmatter + one-line placeholder |
| Contradiction callout older than 30 days | Flag for review: show both sides, ask user which is correct |
| Orphan page | Flag for review: user confirms before any deletion |
| Two pages covering the same concept | Flag for review: user decides which survives and which gets merged |

## Execution Steps

Run all 8 checks in order (steps 2–9, after resolving config). Collect findings — write the report only after all checks complete.

1. **Resolve vault config** — run `node <skill-dir>/../../scripts/wiki-config.ts --start "$PWD"` (`<skill-dir>` is the directory containing this SKILL.md; the script is at `plugin/scripts/wiki-config.ts` from the plugin root). Read the JSON from stdout and use these keys: `wiki_root`, `raw`, `manifest`, `index`, `hot`, `log`, `areas`. Paths are vault-relative to `vaultRoot`; `index`, `hot` and `log` are relative to `{wiki_root}`. On exit 1 or 2, stop and show stderr to the user — never guess a vault. If `node` is unavailable or older than 22.18, apply the same rules by hand: nearest `.wiki.json` walking up, else nearest `Atlas/Wiki/SCHEMA.md` with `type: llm-wiki`, else stop.
2. **Dead links** — list all wiki pages; scan every page for `[[wikilinks]]`; flag any target that has no matching file.
3. **Orphan pages** — build an inbound-link map across all pages; flag any page that never appears as a wikilink target.
4. **Unresolved contradictions >30d** — search for `[!contradiction]` callouts; flag any with a date older than 30 days.
5. **Missing pages** — collect all `[[wikilinks]]`, subtract existing pages, group by target, sort by frequency; candidates at 3+, near-certain at 5+.
6. **Missing cross-references** — flag the most obvious bidirectional gaps (page A discusses page B's topic but has no `[[Page B]]`); don't try to be exhaustive.
7. **Frontmatter gaps** — check all non-exempt content pages for missing `sources`, `type` tag, or `created`.
8. **Index drift** — find pages not listed in `{index}` and `{index}` entries pointing to deleted pages.
9. **Manifest drift** — find files in `{raw}` not recorded in `{manifest}`.

Apply auto-fixes (from Decision Gates) as you find them. Flag review items for the report.

## Output Contract

Create `{wiki_root}/lint-YYYY-MM-DD.md` with:
- Summary table: each of the 8 checks with issues-found / auto-fixed / needs-review counts
- One section per check listing findings
- Prepend a one-line entry to `{wiki_root}/{log}`
- Update `{wiki_root}/{hot}` with open review items

Report format for the summary table:
```
| Check | Issues found | Auto-fixed | Needs review |
|-------|-------------|------------|--------------|
| Dead links | N | N | N |
| Orphan pages | N | 0 | N |
| Unresolved contradictions (>30d) | N | 0 | N |
| Missing pages | N | N (stubs) | N |
| Missing cross-references | N | 0 | N |
| Frontmatter gaps | N | N | 0 |
| Index drift | N | N | 0 |
| Manifest drift | N | 0 | N |
```

## References

- `../../_shared/cli-commands.md` — obsidian CLI command syntax
- `{wiki_root}/SCHEMA.md` (vault) — naming conventions, frontmatter format, page types
