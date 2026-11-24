---
name: wiki-lint
description: "Trigger: /wiki-lint or 'health check the wiki', 'wiki needs maintenance'. Runs the read-only wiki-lint script, reports in chat, proposes fixes for approval."
license: MIT
metadata:
  author: jordi.pulido
  version: 3.0.0
allowed-tools: Bash, Read, Write, Edit, AskUserQuestion
---

## Activation Contract

Load when the user invokes `/wiki-lint`, says "health check the wiki", "the wiki needs maintenance", "clean up the wiki", or the wiki has grown significantly since the last lint pass.

## Hard Rules

- The script is read-only and the report lives in the chat. Write nothing to the vault until the user approves a plan.
- File tools (Read/Write/Edit/Bash) are primary. The `obsidian` CLI is optional: run it with a time limit (e.g. `timeout 20 obsidian ...`) and fall back to file tools on failure.
- Read `{wiki_root}/SCHEMA.md` before proposing fixes — naming conventions and structural rules live there.
- Operational files are exempt from frontmatter checks: `{index}`, `{hot}`, `{log}`, `SCHEMA.md`, `lint-*.md`.
- Never delete or merge pages unilaterally — present them for user review first.
- Never apply a fix, even a safe one, before the user approves the plan that lists it.
- Write a `lint-YYYY-MM-DD.md` page or a `{log}` entry only if the user asks or fixes were applied.

## Decision Gates

| Finding | Action |
|---------|--------|
| Script issue with a clear fix (frontmatter gap, index entry, dead link target typo) | Add to the plan with the exact change; apply only after approval |
| Contradiction older than 30 days | Show both sides, ask the user which is correct |
| Orphan page, empty section | Ask: link it, keep it, or delete it (user decides) |
| Two pages covering the same concept (judgment) | Flag for review: user decides which survives |
| Missing cross-reference (judgment) | List the most obvious gaps only; do not try to be exhaustive |
| Script exits 1 | Stop and show stderr; never guess a vault |

## Execution Steps

1. **Resolve vault config** — run `node <skill-dir>/../../scripts/wiki-config.ts --start "$PWD"` (`<skill-dir>` is the directory containing this SKILL.md). Use `wiki_root`, `raw`, `manifest`, `index`, `hot`, `log`. On exit 1 or 2, stop and show stderr. If `node` is missing or older than 22.18, resolve by hand: nearest `.wiki.json` walking up, else nearest `Atlas/Wiki/SCHEMA.md` with `type: llm-wiki`, else stop.
2. **Run the lint** — `node <skill-dir>/../../scripts/wiki-lint.ts --start "$PWD"` (add `--exclude GLOB` for areas the user wants skipped). Read the JSON from stdout.
3. **Present the report in the chat** — summary counts per check, then the issues grouped by check with `path:line`. Write no file.
4. **Judgment pass** — read the pages involved and look for duplicate concepts, missing cross-references and contradictions that need a decision. Add them to the findings.
5. **Plan** — list every proposed fix as `file: change (why)`. Ask the user to approve, trim or reject it.
6. **Apply** — after approval, make only the approved edits, then re-run step 2 to confirm.
7. **Record** — write `{wiki_root}/lint-YYYY-MM-DD.md` or prepend to `{wiki_root}/{log}` only if the user asked or fixes were applied.

## Output Contract

- Chat report: summary table (check, issues) and issues per check, plus judgment findings.
- Chat plan: proposed fixes awaiting approval, or "no changes proposed".
- Files: none by default; the approved edits, and a lint page or log entry only as in step 7.

## References

- `../../scripts/wiki-lint.ts` — checks, report format and options (`--as-of`, `--exclude`, `--strict`, `--format`)
- `../../_shared/cli-commands.md` — obsidian CLI syntax and manifest format
- `{wiki_root}/SCHEMA.md` (vault) — naming conventions, frontmatter format, page types
