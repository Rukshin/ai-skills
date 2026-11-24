# Fiction conventions (copied verbatim)

Source: pkm `Atlas/Wiki/SCHEMA.md`, section "8. Fiction — Mirrored Domain" (sandbox copy). Copied on 2026-11-24. The section is not removed from SCHEMA.md.

# 8. Fiction — Mirrored Domain

Fiction is a **first-class domain** mirrored across both vault layers:

- `Atlas/Dots/Fiction/` — Jordi's personal book notes (human-owned, do not modify without instruction)
- `Atlas/Wiki/Fiction/` — LLM analytical content (LLM-owned)

This is a permanent split. Fiction and tech content never mix at the root level of either layer.

## Language

**All Fiction pages are written in Spanish** — page names, headings, and body content. Jordi reads speculative fiction in Spanish and engages with it in that language. Character names and in-world terms keep their original form (not translated).

## Page types in Atlas/Wiki/Fiction/

| Type | Tag | Convention | Example |
|------|-----|-----------|---------|
| Novela | `wiki/source` | Título español + (novela) | `Amanecer Rojo (novela).md` |
| Personaje | `wiki/concept` | Nombre en el mundo | `Darrow au Andromedus.md` |
| Tema | `wiki/concept` | Tema en español + (tema) | `Revolución de Clases (tema).md` |
| Worldbuilding | `wiki/concept` | Título en español | `Jerarquía de Colores.md` |
| Autor | `wiki/person` | Nombre completo | `Pierce Brown.md` |

Note: character pages use `wiki/concept`, not `wiki/person` — they are fictional constructs, not real people.

## Page structure for Atlas/Wiki/Fiction/

**Novela (source):**
```markdown
# Título (novela)
Autor. Año.

## Arco narrativo

## Momentos clave

## Personajes
[[Personaje A]], [[Personaje B]]

## Temas
[[Tema A]], [[Tema B]]
```

**Personaje (concept):**
```markdown
# Nombre del Personaje
Una frase sobre quién es.

## Rol en la saga

## Arco

## Función temática

## Momentos clave
```

**Tema/Worldbuilding (concept):**
```markdown
# Nombre del Tema
Una frase definitoria.

## Concepto central

## Cómo aparece en la ficción
[[Novela A]], [[Novela B]]
```

## `up` chain for Fiction/

Fiction pages chain up to `[[Fiction]]` (at `Atlas/Wiki/Fiction/Fiction.md`), which chains up to `[[index]]`. `Fiction.md` is the MOC for all Fiction/ pages.

## Atlas/Dots/Fiction/ conventions

Book notes in `Atlas/Dots/Fiction/` follow the standard book template:
- One note per book (not per series by default)
- Frontmatter: `up`, `related`, `published_at`, `author`, `title`, `total`, `cover`, `genre`, `status`, `rating`, `in: [[📚 Books]]`
- Body sections: `## Impresión`, `## Ideas destacadas`, `## Citas`, `## Conexiones`
- Saga notes (`[Series] (saga).md`) created only when the full series is read and earns dedicated analysis

