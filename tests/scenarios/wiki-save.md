# wiki-save scenarios

Run against `/tmp/pkm-scenario-run` (see `README.md`). Precondition: a wiki-query answer is in the conversation (use Q1 from `wiki-query.md`: "What goes in a Home Repo and what stays in each repo?"). The sandbox `index.md` has an empty `## Questions` section (line 64). Question page naming follows SCHEMA (question as title, e.g. `What goes in a Home Repo and what stays in each repo.md`), tag `wiki/question`. Housekeeping order: index (Questions section), log, hot. Log entry format: `## [YYYY-MM-DD] query | <question>`.

## S1 Files an answer as a question page after approval

- **Prompt:** `/wiki-save` (after Q1, or accepting the wiki-query offer)
- **Expected:**
  - Agent runs `wiki-config.ts`, reads `SCHEMA.md` for the question format, drafts the page.
  - Presents ONE plan: the question page (path, reason), housekeeping (index Questions entry, log entry, hot) and sources cited (`Home Repo#What goes where` as wikilinks inside the page). Asks once; writes nothing before approval.
  - After approval: creates the question page in `Atlas/Wiki/` with full frontmatter (`up`, `sources`, `wiki/question` tag), no claims beyond the answer; adds the page under `## Questions` in `index.md`; prepends `## [YYYY-MM-DD] query | <question>` to `log.md`; updates `hot.md` (under ~500 words).
  - Untouched: `+/raw/.manifest.json`, all other wiki pages.
- **Checklist:**
  - [ ] no write before approval
  - [ ] question page exists with correct frontmatter and wikilink citations
  - [ ] index, log, hot updated in that order
  - [ ] log entry matches `## [YYYY-MM-DD] query | ...`
  - [ ] manifest untouched
  - [ ] final report: wikilink, confirmations, sources cited
  - [ ] re-running `wiki-lint.ts` shows no new issues and the `## Questions` empty-section issue is gone

## S2 Declined or unsupported

- **Prompt A:** `/wiki-save`, then reject the plan. **Expected:** reports that nothing was written; `git status --short` empty.
- **Prompt B:** `/wiki-save` in a fresh conversation with no answer to save. **Expected:** asks which answer to file; stops if none.
- **Prompt C:** `/wiki-save save this paragraph about Rust lifetimes as a note`. **Expected:** refuses: v1 files only wiki-query answers.
- **Checklist:**
  - [ ] A: nothing written, says so
  - [ ] B: asks, does not invent content
  - [ ] C: states it is not supported in v1, no write
