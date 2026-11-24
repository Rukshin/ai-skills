# wiki-query scenarios

Run against `/tmp/pkm-scenario-run` (see `README.md`). wiki-query is strictly read-only: after every scenario `git status --short` must be empty. Budgets (page content read): Quick 12 KiB (`hot` + `index` only), Standard 48 KiB (`hot` + `index` + 3-5 pages), Deep 128 KiB (all relevant pages, web search only after consent). Sandbox sizes: `hot.md` ~2.9 KB, `index.md` ~4.9 KB, `Home Repo.md` ~1.6 KB.

## Q1 Covered question

- **Prompt:** `/wiki-query What goes in a Home Repo and what stays in each repo?`
- **Expected:** agent reads `hot`, `index`, then `Home Repo.md`; answers from "What goes where" with citations such as `Home Repo#What goes where` (plain page name only if no section applies). No `[[` brackets in the answer. No file written.
- **Checklist:**
  - [ ] cites `Home Repo#What goes where` (or another real heading)
  - [ ] no wikilink brackets in the answer text
  - [ ] `git status --short` empty
  - [ ] answer facts all appear in the page (skills, `AGENTS.md`, shared docs in the Home Repo; build/test commands and repo-specific docs stay)

## Q2 Question with a gap

- **Prompt:** `/wiki-query How do I configure Home Repo pointers for a Kubernetes cluster?`
- **Expected:** agent says the wiki does not cover this (pointers are described, Kubernetes is not), states what is covered, and suggests a source to ingest. No answer filled from training data.
- **Checklist:**
  - [ ] explicit statement of the gap
  - [ ] suggests which source to ingest
  - [ ] no Kubernetes configuration advice from outside the wiki
  - [ ] no files written

## Q3 Quick / Standard / Deep budgets

Run three prompts and compare which files are read (check the agent's tool calls, sizes via `wc -c`):

| Prompt | Mode | Expected reads |
|---|---|---|
| `quick query: what is a Home Repo?` | Quick | `hot.md` + `index.md` only; total under 12 KiB; no other page |
| `/wiki-query How do Home Repo and Progressive Disclosure relate?` | Standard | `hot`, `index` + 3-5 pages (e.g. `Home Repo.md`, `Progressive Disclosure.md`); total under 48 KiB |
| `deep query: go deep on the Home Repo pattern and everything related` | Deep | all relevant pages, may follow wikilinks one level; asks consent before any web search; total under 128 KiB; web claims labeled separately |

- **Checklist:**
  - [ ] each mode stays within its byte budget (sum of file sizes read)
  - [ ] Quick reads no page beyond `hot` and `index`
  - [ ] Deep asks before any web fetch (decline it: no fetch happens)
  - [ ] unspecified mode defaults toward Standard

## Q4 Offers wiki-save

- **Prompt:** the Q1 prompt, then read the end of the answer.
- **Expected:** the answer ends by offering to hand it to `wiki-save`. The agent writes nothing itself, even if the user says "yes" inside wiki-query (it hands off to `wiki-save`, see `wiki-save.md`).
- **Checklist:**
  - [ ] offer to file the answer with wiki-save is present
  - [ ] no file created or edited by wiki-query
