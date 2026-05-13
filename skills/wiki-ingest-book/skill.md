---
name: wiki-ingest-book
description: Ingests a ChatGPT Exporter JSON file (a book club conversation) into Jordi's PKM vault. Creates personal book notes at Atlas/Dots/Fiction/ (Jordi's layer) and analytical wiki pages at Atlas/Wiki/Fiction/ (LLM layer) — characters, themes, worldbuilding, author, and source pages. Use when the user drops a JSON file from ChatGPT Exporter and wants it compiled into the vault, says "ingest this book conversation", or "process this reading conversation".
allowed-tools: Bash, Read, Write, Edit, AskUserQuestion
---

# Wiki Ingest — Book Conversation

Process a ChatGPT Exporter JSON file into Jordi's PKM vault. The conversation is a reading club discussion between Jordi and a custom GPT about one or more books.

> **Prerequisite**: Obsidian must be open and focused. The CLI communicates via IPC to the running app — if Obsidian is closed or backgrounded, commands hang indefinitely. Ask Jordi to open it first if needed.

Read `Atlas/Wiki/SCHEMA.md` section 8 before starting — it defines the Fiction domain conventions, language rules (Spanish), page types, and folder structure.

## Input

A JSON file path in `+/raw/` exported by ChatGPT Exporter. Format:
```json
{
  "metadata": { "title": "...", "dates": {...}, "link": "https://chatgpt.com/..." },
  "messages": [
    { "role": "Prompt", "say": "...", "time": "..." },
    { "role": "Response", "say": "...", "time": "..." }
  ]
}
```

## Workflow

### 1. Parse the JSON

Read the file directly (Read tool — Obsidian CLI can't handle JSON).

Split messages by role:
- `Prompt` turns = Jordi's voice → personal layer (Impresión, Citas, Conexiones in Dots)
- `Response` turns = GPT analysis → analytical layer (Wiki pages)

Extract:
- Books and series covered
- Date range of conversation
- Original conversation URL (from `metadata.link`)
- Characters mentioned with enough analysis to warrant pages
- Themes and worldbuilding concepts discussed

### 2. Orient

Check what already exists:

```bash
obsidian read path="Atlas/Wiki/hot.md"
obsidian read path="Atlas/Wiki/index.md"
```

If `Atlas/Wiki/Fiction/Fiction.md` exists, read it too to avoid duplicating existing pages.

### 3. Discuss with Jordi before writing

Share a brief summary:
- Books identified (with proposed Spanish titles for Dots notes)
- Main cast characters found (propose main cast only by default)
- Themes and worldbuilding concepts to create pages for
- Whether a saga note is warranted

Use `AskUserQuestion` to confirm. Jordi may want to steer emphasis or skip certain pages.

### 4. Create Atlas/Dots/Fiction/ book notes

One note per book. Path: `Atlas/Dots/Fiction/[Título] (book).md`.

Frontmatter (follow the existing book template exactly — reference `Atlas/Dots/Fiction/Carl el Mazmorrero (book).md`):
```yaml
---
up:
  - "[[Red Rising (saga)]]"   # link to saga note if one is being created; otherwise link to [[📖 Lectura (OE)]] or omit
related: []
published_at: YYYY
author: "[[Author Name]]"
title: "Full title in Spanish"
total: ""
cover: ""
genre: "[[SFF]]"
status: read
rating: ""
in:
  - "[[📚 Books]]"
---
```

Body — extract from Jordi's `Prompt` turns only (his voice, not paraphrased):
```markdown
## Impresión

<!-- ¿Qué te dejó este libro? Una frase, una imagen, un sentimiento. -->
[Jordi's emotional reactions in his own words, distilled from Prompt turns]

## Ideas destacadas

- 

## Citas

> [passages Jordi quoted or referenced]

## Conexiones

- [cross-references Jordi made to other authors/works, e.g. Abercrombie, Sanderson]
```

Leave `## Ideas destacadas` empty — that's for Jordi to fill manually.

Create via:
```bash
obsidian create path="Atlas/Dots/Fiction/[Título] (book).md" content="..." silent
```

### 5. Create saga note (if warranted)

A saga note earns its place when the full series is read and the conversation covers the complete arc. Path: `Atlas/Dots/Fiction/[Series] (saga).md`.

Minimal frontmatter:
```yaml
---
up:
  - "[[📖 Lectura (OE)]]"
related: []
author: "[[Author Name]]"
in:
  - "[[📚 Books]]"
---
```

Body: wikilinks to individual book notes + one-line arc summary.

### 6. Create Atlas/Wiki/Fiction/ pages

All pages in Spanish. All go under `Atlas/Wiki/Fiction/`.

**6a. Fiction MOC** — create `Atlas/Wiki/Fiction/Fiction.md` if it doesn't exist yet:
```yaml
---
up: ["[[index]]"]
created: YYYY-MM-DD
modified: YYYY-MM-DD
---
```
Body: `# Ficción` + organized list of all Fiction/ pages as wikilinks, grouped by series/author.

**6b. Source pages** — one per book:
```yaml
---
up: ["[[Fiction]]"]
related: []
created: YYYY-MM-DD
modified: YYYY-MM-DD
sources: ["https://chatgpt.com/..."]
tags: [wiki/source]
---
```
Sections: `## Arco narrativo`, `## Momentos clave`, `## Personajes` (wikilinks), `## Temas` (wikilinks)

**6c. Character concept pages** — main cast only (confirm with Jordi in step 3):
```yaml
---
up: ["[[Fiction]]"]
related: []
created: YYYY-MM-DD
modified: YYYY-MM-DD
sources: ["https://chatgpt.com/..."]
tags: [wiki/concept]
---
```
Sections: `## Rol en la saga`, `## Arco`, `## Función temática`, `## Momentos clave`

**6d. Theme/worldbuilding concept pages**:
Same frontmatter as characters. Sections: `## Concepto central`, `## Cómo aparece en la ficción` (wikilinks to novels)

**6e. Author person page** (if not already in wiki):
```yaml
tags: [wiki/person]
```
Sections: `## Trayectoria`, `## Obras`, `## Aparece en` (wikilinks to source pages)

Create all pages:
```bash
obsidian create path="Atlas/Wiki/Fiction/[Page].md" content="..." silent
```

### 7. Update Atlas/Wiki/index.md

Add or update a `## Fiction` section listing `[[Fiction]]` with a one-line description. The Fiction.md MOC holds the detailed listing — index just points to it.

```bash
obsidian read path="Atlas/Wiki/index.md"
obsidian create path="Atlas/Wiki/index.md" content="..." overwrite silent
```

### 8. Append to log.md

```bash
obsidian prepend path="Atlas/Wiki/log.md" content="## [$(date +%Y-%m-%d)] ingest | [Título]\nPages created: [[Page A]], [[Page B]]\nPages updated: [[Page C]]\n\n"
```

### 9. Update hot.md

Add this ingest to "Recent ingests". Update "Active threads" with the new fiction domain. Keep hot.md under ~500 words.

```bash
obsidian read path="Atlas/Wiki/hot.md"
obsidian create path="Atlas/Wiki/hot.md" content="..." overwrite silent
```

### 10. Update +/raw/.manifest.json

Read the manifest, add entry for the JSON file, write back:

```json
{
  "sources": {
    "<path/to/file.json>": {
      "hash": "<md5 of file>",
      "url": "<chatgpt conversation link>",
      "ingested_at": "YYYY-MM-DD",
      "pages_created": ["Fiction/Amanecer Rojo (novela).md", "..."],
      "pages_updated": ["index.md"]
    }
  }
}
```

Use Write tool if Obsidian CLI can't handle `.json` files.

### 11. Delete raw file (with confirmation)

Ask before deleting:
> All pages created and manifest updated. Safe to delete `+/raw/[filename].json`?

If confirmed:
```bash
rm ~/Code/mine/pkm/+/raw/[filename].json
```

## Context discipline

Read a maximum of 5 existing wiki pages per ingest. Use `hot.md` and `Fiction.md` MOC to decide which ones matter. Surgical edits where possible; full rewrites only when structure needs to change.
