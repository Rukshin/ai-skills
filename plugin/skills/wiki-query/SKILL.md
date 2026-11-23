---
name: wiki-query
description: "Trigger: /wiki-query or 'what does my wiki say about X', 'look up in the wiki'. Answers questions from compiled LLM Wiki pages with citations."
license: MIT
metadata:
  author: jordi.pulido
  version: 2.0.0
allowed-tools: Bash, Read, WebFetch, AskUserQuestion
---

## Activation Contract

Load when the user invokes `/wiki-query`, asks "what does my wiki say about X", "look up in the wiki", "search my knowledge base", or asks a domain-specific question after having ingested sources on that topic.

## Hard Rules

- File tools (Read/Write/Edit/Bash) are primary. The `obsidian` CLI is optional: it hangs indefinitely when Obsidian is closed, so run it with a time limit (e.g. `timeout 20 obsidian ...`) and fall back to file tools on failure or timeout.
- Read order matters: `{hot}` often has the answer outright; `{index}` summaries let you rule pages in or out without reading them. Don't skip ahead.
- Stop reading as soon as you have enough context — do not read the entire wiki for a narrow question.
- Cite by plain page name only — no `[[` brackets in the answer text.
- If the wiki has genuine gaps, say so explicitly and suggest which source to ingest. Do NOT fill gaps from training data.
- For Deep mode: label web-sourced claims separately from wiki-sourced ones.

## Decision Gates

| Mode | When to use | What to read |
|------|-------------|--------------|
| **Quick** | Simple factual question, clear single-page answer | `{hot}` + `{index}` only |
| **Standard** | Most questions — synthesis across a few pages | `{hot}` + `{index}` + 3–5 relevant pages |
| **Deep** | User says "thorough", "comprehensive", "go deep", or topic spans many pages | All relevant wiki pages + optional web search |

User can specify mode explicitly ("quick query:", "deep query:"). Otherwise infer from the question. Err toward Standard if unsure.

## Execution Steps

1. **Resolve vault config** — run `node <skill-dir>/../../scripts/wiki-config.ts --start "$PWD"` (`<skill-dir>` is the directory containing this SKILL.md; the script is at `plugin/scripts/wiki-config.ts` from the plugin root). Read the JSON from stdout and use these keys: `wiki_root`, `index`, `hot`, `log`, `areas`, `language`. Paths are vault-relative to `vaultRoot`; `index`, `hot` and `log` are relative to `{wiki_root}`. On exit 1 or 2, stop and show stderr to the user — never guess a vault. If `node` is unavailable or older than 22.18, apply the same rules by hand: nearest `.wiki.json` walking up, else nearest `Atlas/Wiki/SCHEMA.md` with `type: llm-wiki`, else stop.
2. Read `{wiki_root}/{hot}` — check for recent ingests and active threads relevant to the question.
3. Read `{wiki_root}/{index}` — use summaries to decide which pages are worth drilling into.
4. *(Standard and Deep only)* Read the 3–5 most relevant pages. For Deep, follow wikilinks one level if clearly relevant.
5. Synthesise and answer using plain page names as citations. Match answer format to the question (paragraph for simple, sections + summary for complex).
6. For Standard and Deep answers worth keeping, offer to file as a question page in the wiki — if the user agrees, create `{wiki_root}/[Question].md` using the question page format from SCHEMA.md, then update `{index}`, prepend to `{log}`, and update `{hot}`.

## Output Contract

- Answer with inline citations (plain page names, no brackets)
- Deep mode: clearly distinguish wiki-sourced vs. web-sourced claims
- If filed as a question page: report the wikilink to the new page

## References

- `../../_shared/cli-commands.md` — obsidian CLI command syntax
- `{wiki_root}/SCHEMA.md` (vault) — question page format and naming conventions
