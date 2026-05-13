---
name: wiki-lint
description: "Trigger: /wiki-lint or 'health check the wiki', 'wiki needs maintenance'. Runs 8 checks on Atlas/Wiki/, auto-fixes safe issues, flags the rest."
license: MIT
metadata:
  author: jordi.pulido
  version: 2.0.0
allowed-tools: Bash, Read, Write, Edit, AskUserQuestion
---

## Activation Contract

Load when the user invokes `/wiki-lint`, says "health check the wiki", "the wiki needs maintenance", "clean up the wiki", or the wiki has grown significantly since the last lint pass.

## Hard Rules

- Obsidian must be open — CLI commands hang indefinitely otherwise.
- Read `Atlas/Wiki/SCHEMA.md` before starting — naming conventions and structural rules live there.
- Operational files are exempt from frontmatter checks: `hot.md`, `log.md`, `SCHEMA.md`, lint report files.
- Never delete or merge pages unilaterally — always present for user review first.
- Collect all findings before writing anything — write the report once at the end.

## Decision Gates

| Finding type | Action |
|--------------|--------|
| Missing `created` frontmatter field | Auto-fix: add today's date (or file creation date if determinable) |
| Missing `type` tag (`#wiki/concept`, `#wiki/person`, etc.) | Auto-fix: infer from page content and add |
| Missing index entries (page exists but not in `index.md`) | Auto-fix: add to correct section with one-line summary |
| High-frequency dead links (5+ references, no page) | Auto-fix: create stub page with frontmatter + one-line placeholder |
| Contradiction callout older than 30 days | Flag for review: show both sides, ask user which is correct |
| Orphan page | Flag for review: user confirms before any deletion |
| Two pages covering the same concept | Flag for review: user decides which survives and which gets merged |

## Execution Steps

Run all 8 checks in order. Collect findings — write the report only after all checks complete.

1. **Dead links** — list all wiki pages; scan every page for `[[wikilinks]]`; flag any target that has no matching file.
2. **Orphan pages** — build an inbound-link map across all pages; flag any page that never appears as a wikilink target.
3. **Unresolved contradictions >30d** — search for `[!contradiction]` callouts; flag any with a date older than 30 days.
4. **Missing pages** — collect all `[[wikilinks]]`, subtract existing pages, group by target, sort by frequency; candidates at 3+, near-certain at 5+.
5. **Missing cross-references** — flag the most obvious bidirectional gaps (page A discusses page B's topic but has no `[[Page B]]`); don't try to be exhaustive.
6. **Frontmatter gaps** — check all non-exempt content pages for missing `sources`, `type` tag, or `created`.
7. **Index drift** — find pages not listed in `index.md` and `index.md` entries pointing to deleted pages.
8. **Manifest drift** — find files in `+/raw/` not recorded in `+/raw/.manifest.json`.

Apply auto-fixes (from Decision Gates) as you find them. Flag review items for the report.

## Output Contract

Create `Atlas/Wiki/lint-YYYY-MM-DD.md` with:
- Summary table: each of the 8 checks with issues-found / auto-fixed / needs-review counts
- One section per check listing findings
- Prepend a one-line entry to `Atlas/Wiki/log.md`
- Update `Atlas/Wiki/hot.md` with open review items

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

- `../_shared/cli-commands.md` — obsidian CLI command syntax
- `Atlas/Wiki/SCHEMA.md` (vault) — naming conventions, frontmatter format, page types
