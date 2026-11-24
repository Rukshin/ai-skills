# wiki-save details

## Back-link rules

- Page names come from the citations (`Page#Heading` -> `Page`).
- Resolve each consulted page path from the vault files; area pages and subfolders are common. If a page cannot be found, stop and report instead of guessing.
- Append `[[<question page name>]]` to the page's `related` frontmatter list; create `related` if absent.
- Never touch other fields, never duplicate an entry, never edit operational files (index, hot, log, SCHEMA).
- Plan line per page: `Update <path> — sections: related (frontmatter) — back-link so the question page is not an orphan`.

## Manual fallback for Step 1

If `node` is unavailable or older than 22.18, apply the same rules by hand: nearest `.wiki.json` walking up, else nearest `Atlas/Wiki/SCHEMA.md` with `type: llm-wiki`, else stop.
