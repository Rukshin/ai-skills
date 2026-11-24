# `.wiki.json` keys

Copy `wiki.json` to the vault root as `.wiki.json` and edit. Every key is optional; missing keys take the default shown. All paths are vault-relative: absolute paths, `..` segments and symlinks that escape the vault are rejected. Unknown keys produce a warning; wrong types are errors.

| Key | Default | Meaning |
|-----|---------|---------|
| `wiki_root` | `Atlas/Wiki` | Folder holding the compiled wiki pages (and `SCHEMA.md`). |
| `raw` | `+/raw` | Folder where unprocessed sources are dropped. |
| `manifest` | `{raw}/.manifest.json` | Ingest manifest (source path/URL → hash, pages). Follows `raw` when unset: the shipped `wiki.json` spells out the default for `+/raw`; if you change `raw`, change or delete `manifest` too. |
| `attachments` | `x/Images` | Folder for images and other attachments moved out of `raw`. |
| `index` | `index.md` | Wiki index page, relative to `wiki_root`. |
| `hot` | `hot.md` | Hot cache of recent context, relative to `wiki_root`. |
| `log` | `log.md` | Newest-first operations log, relative to `wiki_root`. |
| `language` | `en` | Language wiki pages are written in. |
| `areas` | `[]` | Area subfolders (single folder names). A source under `{raw}/<area>/` or an explicit user instruction routes pages to `{wiki_root}/<area>/`. |
| `fetchers` | `["firecrawl-scrape", "webfetch"]` | URL fetchers to try, in order. |

Resolution: nearest `.wiki.json` walking up from the working directory; otherwise the nearest `Atlas/Wiki/SCHEMA.md` with `type: llm-wiki` (keys `wiki_root`, `raw`, `index`, `hot`, `log`, `areas`); otherwise an error.
