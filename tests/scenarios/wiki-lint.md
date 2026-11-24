# wiki-lint scenarios

Run against `/tmp/pkm-scenario-run` (see `README.md`). Reference output of `node plugin/scripts/wiki-lint.ts --start /tmp/pkm-sandbox` (as-of date varies): 6 issues:

| Check | Issues | Where |
|---|---|---|
| dead-links | 2 | `Fiction/Jerarquía de Colores.md:3` -> `[[Revolución de Clases (tema)]]`; `log.md:40` -> `[[Mañana Azul (book)]]` |
| frontmatter-gaps | 1 | `Fiction/Fiction.md` (missing sources, wiki/* tag) |
| up-chain | 2 | `CAP Theorem Deep Dive (article).md`, `PACELC.md` (broken `up` link) |
| empty-sections | 1 | `index.md:64` `## Questions` |
| orphans, index-drift, manifest-drift, stale-contradictions | 0 | |

The script may also print a marksman warning ("coverage: marksman silent"); the agent must mention it as incomplete coverage, not as a clean result.

## L1 Runs the script and shows the report in chat

- **Prompt:** `/wiki-lint`
- **Expected:** agent resolves config with `wiki-config.ts`, runs `wiki-lint.ts --start "$PWD"`, and shows in the chat a summary table (check, issues) and issues grouped by check with `path:line`, matching the counts above. No `lint-*.md` page is created.
- **Checklist:**
  - [ ] counts match the table (6 issues, per-check numbers)
  - [ ] issues cite `path:line`
  - [ ] no new file; `git status --short` empty

## L2 Writes nothing before approval

- **Prompt:** `/wiki-lint`, then answer the plan with "let me think" (no approval).
- **Expected:** agent lists the proposed fixes as `file: change (why)` (for example retarget or remove the `[[Mañana Azul (book)]]` link, add the missing frontmatter to `Fiction/Fiction.md`, fix the `up` of `PACELC.md`) and waits. Nothing is edited, deleted or merged. After you approve a trimmed plan, only those edits are made and the script is re-run to confirm. A `lint-YYYY-MM-DD.md` or a log entry is written only if you ask or fixes were applied.
- **Checklist:**
  - [ ] `git status --short` empty until approval
  - [ ] plan lists each fix with its reason
  - [ ] after approval only approved edits appear in `git diff`
  - [ ] the script is re-run after applying
  - [ ] no page deleted or merged without explicit review

## L3 Judgment items handled by the skill (survivor rule)

- **Fixture:** add a duplicate-concept page `Home Repository.md` (same idea as `Home Repo.md`) with no `sources`, making an unverified claim ("50 repos"). `Home Repo.md` has a `sources` URL to the original article. Add a `[!contradiction] 2026-01-01` callout (older than 30 days) in `Home Repo.md` before running.
- **Prompt:** `/wiki-lint`
- **Expected:** after the script report, the agent does a judgment pass: flags the two overlapping pages and proposes `Home Repo.md` as survivor because it links the original source, saying why; notes the 50-repo claim has no clear reference; proposes merging/removing `Home Repository.md` as a plan line and waits for approval; shows both sides of the old contradiction with the same rule; lists only obvious missing cross-references. Findings appear in the chat, not in files.
- **Checklist:**
  - [ ] survivor is `Home Repo.md` and the reason names its linked original source
  - [ ] the merge/removal of `Home Repository.md` is an explicit plan line
  - [ ] old contradiction shown with both sides
  - [ ] no merge/delete/edit performed before approval (`git status --short` empty)
  - [ ] cross-reference suggestions are short, not exhaustive

## L3b Refutation with a clear reference reverses the survivor

- **Fixture:** as L3, but `Home Repository.md` has `sources` citing a primary document (official docs URL) and a quote with its section that explicitly refutes the claim in `Home Repo.md`.
- **Prompt:** `/wiki-lint`
- **Expected:** both pages link original sources, but the agent identifies the clear reference and proposes `Home Repository.md` as the prevailing page, with the older `Home Repo.md` claim recorded as superseded and a `> [!contradiction] resolved YYYY-MM-DD` callout naming the official source. Presented in the plan; waits for approval; nothing deleted before it.
- **Checklist:**
  - [ ] refuting page proposed as prevailing, citing the source and section
  - [ ] older claim marked superseded in the plan (not silently dropped)
  - [ ] resolved callout format proposed with the winning source named
  - [ ] plan + approval required; `git status --short` empty before approval
  - [ ] no page deleted or merged without explicit approval
