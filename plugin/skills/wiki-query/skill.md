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

- Read order matters: `hot.md` often has the answer outright; `index.md` summaries let you rule pages in or out without reading them. Don't skip ahead.
- Stop reading as soon as you have enough context — do not read the entire wiki for a narrow question.
- Cite by plain page name only — no `[[` brackets in the answer text.
- If the wiki has genuine gaps, say so explicitly and suggest which source to ingest. Do NOT fill gaps from training data.
- For Deep mode: label web-sourced claims separately from wiki-sourced ones.

## Decision Gates

| Mode | When to use | What to read |
|------|-------------|--------------|
| **Quick** | Simple factual question, clear single-page answer | `hot.md` + `index.md` only |
| **Standard** | Most questions — synthesis across a few pages | `hot.md` + `index.md` + 3–5 relevant pages |
| **Deep** | User says "thorough", "comprehensive", "go deep", or topic spans many pages | All relevant wiki pages + optional web search |

User can specify mode explicitly ("quick query:", "deep query:"). Otherwise infer from the question. Err toward Standard if unsure.

## Execution Steps

1. Read `Atlas/Wiki/hot.md` — check for recent ingests and active threads relevant to the question.
2. Read `Atlas/Wiki/index.md` — use summaries to decide which pages are worth drilling into.
3. *(Standard and Deep only)* Read the 3–5 most relevant pages. For Deep, follow wikilinks one level if clearly relevant.
4. Synthesise and answer using plain page names as citations. Match answer format to the question (paragraph for simple, sections + summary for complex).
5. For Standard and Deep answers worth keeping, offer to file as a question page in the wiki — if the user agrees, create `Atlas/Wiki/[Question].md` using the question page format from SCHEMA.md, then update `index.md`, prepend to `log.md`, and update `hot.md`.

## Output Contract

- Answer with inline citations (plain page names, no brackets)
- Deep mode: clearly distinguish wiki-sourced vs. web-sourced claims
- If filed as a question page: report the wikilink to the new page

## References

- `../_shared/cli-commands.md` — obsidian CLI command syntax
- `Atlas/Wiki/SCHEMA.md` (vault) — question page format and naming conventions
