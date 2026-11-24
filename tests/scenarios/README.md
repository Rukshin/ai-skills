# Manual behavior scenarios

Skill behavior (what an LLM does with a skill) cannot be unit tested. These scenarios are run by hand and judged with each file's pass/fail checklist. `npm test` only covers the scripts and the static skill checks.

## Setup

Never run against `/tmp/pkm-sandbox` itself or a real vault. Work on a throwaway copy:

```sh
cp -R /tmp/pkm-sandbox /tmp/pkm-scenario-run
cd /tmp/pkm-scenario-run
git init -q && git add -A && git commit -qm baseline   # lets you diff the effects of each scenario
```

Start the agent with the skills under test loaded and its working directory at `/tmp/pkm-scenario-run`. After each scenario run `git status --short` and `git diff` to check the "files changed / untouched" lines. To reset between scenarios, discard the copy and make a fresh one under a new name (for example `/tmp/pkm-scenario-run-2`); never reset or edit the sandbox.

The sandbox has `Atlas/Wiki/` (wiki root), `+/raw/` (raw dir with only `.manifest.json`; raw files are absent), Home Repo pages (`Home Repo.md`, `Progressive Disclosure.md`, `Grilling.md`, `Matt Pocock.md`, `The Home Repo Pattern (article).md`) and a `Fiction/` area. Baseline lint of the sandbox: 6 issues (dead-links 2, frontmatter-gaps 1, up-chain 2, empty-sections 1) plus a marksman coverage warning.

## Files

| File | Skill | Scenarios |
|---|---|---|
| `wiki-ingest.md` | wiki-ingest | I1-I6 |
| `wiki-query.md` | wiki-query | Q1-Q4 |
| `wiki-lint.md` | wiki-lint | L1-L3 |
| `wiki-save.md` | wiki-save | S1-S2 |

## Recording results

For each scenario note: date, model, PASS/FAIL per checklist item, and the transcript. Any single failed item fails the scenario.
