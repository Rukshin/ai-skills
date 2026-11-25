---
name: wiki-lint
description: "Trigger: /wiki-lint or 'health check the wiki', 'wiki needs maintenance'. Runs the read-only wiki-lint script, reports in chat, proposes fixes for approval."
license: MIT
metadata:
  author: jordi.pulido
  version: 3.2.0
allowed-tools: Bash, Read, Write, Edit, AskUserQuestion
---

## Activation Contract

Load on `/wiki-lint`, "health check the wiki", "clean up the wiki", or after the wiki has grown significantly since the last lint.

## Hard Rules

- The script is read-only and the report lives in the chat. Write nothing to the vault until the user approves a plan.
- File tools are primary; the `obsidian` CLI is optional (`timeout 20 obsidian ...`, fall back on failure).
- Read `{wiki_root}/SCHEMA.md` before proposing fixes (naming and structure rules).
- Exempt from frontmatter checks: `{index}`, `{hot}`, `{log}`, `SCHEMA.md`, `lint-*.md`.
- Never delete or merge pages unilaterally; present them for review first.
- Among duplicate pages and conflicting claims, the survivor is always the one whose ORIGINAL source is linked, unless there is a refutation with a clear reference. It decides the proposal only; merge/delete stays a plan line the user approves. See `references/survivor-rule.md`.
- Never apply a fix before the user approves the plan.
- Write `lint-YYYY-MM-DD.md` or a `{log}` entry only if the user asks or fixes were applied.

## Decision Gates

| Finding | Action |
|---------|--------|
| Script issue with a clear fix (frontmatter gap, index entry, link typo) | Plan it with the exact change; apply after approval |
| Contradiction older than 30 days | Show both sides; propose the winner by the rule |
| Orphan page, empty section | Ask: link, keep or delete (user decides) |
| Duplicates; only one links an original source (`sources` URL or wiki source page) | It survives; propose merging/removing the other, with reason |
| Both link original sources | Keep both, unless one clearly supersedes (newer edition, errata, official doc): newer/official survives; ask if unsure |
| Neither links one | Do not pick; ask the user |
| Refutation with a clear reference (named source + location, explicit contradiction) | Reverses it: refuting claim prevails; older claim recorded as superseded |
| Conflicting claims or `[!contradiction]` callouts | Same rule; record `> [!contradiction] resolved YYYY-MM-DD` + 1-2 sentences naming the winning source |
| Missing cross-reference (judgment) | List only the most obvious gaps |
| Script exits 1 | Stop and show stderr; never guess a vault |

## Execution Steps

1. **Resolve vault config** — run `node <skill-dir>/scripts/wiki-config.ts --start "$PWD"` (`<skill-dir>` is the directory containing this SKILL.md). Use `wiki_root`, `raw`, `manifest`, `index`, `hot`, `log`. On exit 1 or 2, stop and show stderr. If `node` is missing or older than 22.18, resolve by hand: nearest `.wiki.json` upward, else `Atlas/Wiki/SCHEMA.md` with `type: llm-wiki`, else stop.
2. **Run the lint** — `node <skill-dir>/scripts/wiki-lint.ts --start "$PWD"` (`--exclude GLOB` skips areas). Read the JSON from stdout.
3. **Present the report in the chat** — counts per check, then issues grouped by check with `path:line`. Write no file.
4. **Judgment pass** — read the pages involved; look for duplicate concepts, missing cross-references and contradictions needing a decision. Propose duplicate/conflict survivors with the rule and reason. Add them to the findings.
5. **Plan** — list each fix as `file: change (why)`; ask the user to approve, trim or reject.
6. **Apply** — make only approved edits, then re-run step 2.
7. **Record** — write `{wiki_root}/lint-YYYY-MM-DD.md` or prepend to `{log}` only if asked or fixes were applied.

## Output Contract

- Chat report: summary table (check, issues), issues per check, judgment findings.
- Chat plan: fixes awaiting approval, or none proposed.
- Files: none by default; only approved edits and step 7 records.

## References

- `scripts/wiki-lint.ts` — checks, report, options (`--only ID[,ID]`; pending ingest: `--only manifest-drift`, `kind: unmanifested`)
- `references/survivor-rule.md` — original source, clear reference, examples
- `references/cli-commands.md` — obsidian CLI, manifest format
- `{wiki_root}/SCHEMA.md` (vault) — naming, frontmatter, page types
