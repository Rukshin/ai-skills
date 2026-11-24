# Wiki Fiction page templates ({wiki_root}/Fiction/)

All pages in Spanish. All go under `{wiki_root}/Fiction/`.

## 6a. Fiction MOC (`Fiction.md`, create if missing)

```yaml
---
up: ["[[index]]"]
created: YYYY-MM-DD
modified: YYYY-MM-DD
---
```
Body: `# Ficción` + organized list of all Fiction/ pages as wikilinks, grouped by series/author.

## 6b. Source pages — one per book

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

## 6c. Character concept pages — main cast only (confirmed in the discussion gate)

Same frontmatter as 6b with `tags: [wiki/concept]`.
Sections: `## Rol en la saga`, `## Arco`, `## Función temática`, `## Momentos clave`

## 6d. Theme/worldbuilding concept pages

Same frontmatter as 6c. Sections: `## Concepto central`, `## Cómo aparece en la ficción` (wikilinks to novels)

## 6e. Author person page (if not already in the wiki)

Same frontmatter as 6b with `tags: [wiki/person]`.
Sections: `## Trayectoria`, `## Obras`, `## Aparece en` (wikilinks to source pages)
