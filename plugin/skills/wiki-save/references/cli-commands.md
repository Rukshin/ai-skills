# Wiki Skills — Obsidian CLI Reference

Paths below use config placeholders resolved by `plugin/scripts/wiki-config.ts` (`{wiki_root}`, `{raw}`, `{manifest}`, `{attachments}`, `{index}`, `{hot}`, `{log}`); `index`, `hot` and `log` are relative to `{wiki_root}`. Replace them with the resolved values; paths are vault-relative.

**File tools first.** The Read/Write/Edit tools work with Obsidian closed and are the primary way to touch vault files. The `obsidian` CLI is optional: it needs Obsidian open and focused and hangs indefinitely otherwise, so always wrap it in a time limit (e.g. `timeout 20 obsidian ...`) and fall back to file tools on failure or timeout.

## Reading

```bash
# Read by exact vault path
obsidian read path="{wiki_root}/{hot}"

# Read by wikilink name resolution
obsidian read file="Hexagonal Architecture"

# Get note headings (quick structure check before full read)
obsidian outline path="{wiki_root}/[Page].md" format=json

# List files in a folder
obsidian files folder="{wiki_root}"
obsidian files folder="{raw}"

# Search with context lines
obsidian search:context query="hexagonal" path="{wiki_root}"
```

## Writing

```bash
# Create a new file
obsidian create path="{wiki_root}/[Page].md" content="..." silent

# Overwrite an existing file
obsidian create path="{wiki_root}/[Page].md" content="..." overwrite silent

# Prepend content (newest-first logs)
obsidian prepend path="{wiki_root}/{log}" content="..."

# Set a single frontmatter property
obsidian property:set name="modified" value="YYYY-MM-DD" path="{wiki_root}/[Page].md"
```

## Delta check (manifest)

```bash
# Read manifest
obsidian read path="{manifest}"
# or use Read tool if CLI can't handle .json

# Hash a local file (prints sha256:<hex>; --algo md5 for legacy entries)
node <skill-dir>/../../scripts/wiki-hash.ts "/path/to/file.md"
```

## Cleanup

```bash
# Delete a processed raw file (after user confirmation)
rm "<vaultRoot>/{raw}/[filename].md"

# Move local images instead of deleting: move them to the vault attachments folder
mv "<vaultRoot>/{raw}/[image-file]" "<vaultRoot>/{attachments}/"
```

## Contradiction callout format

```markdown
> [!contradiction] YYYY-MM-DD
> [[Source A]] claims X. [[Source B]] claims Y. Needs resolution.
```

## Manifest entry format

`{manifest}` (default `{raw}/.manifest.json`) maps each source to its ingest record. Keys are the vault-relative path of the raw file or the source URL.

```json
{
  "sources": {
    "<vault-relative path or url>": {
      "hash": "<hex digest>",
      "hash_algo": "sha256",
      "url": "<original URL if applicable>",
      "ingested_at": "YYYY-MM-DD",
      "status": "done",
      "pages_created": ["Page A.md"],
      "pages_updated": ["index.md"]
    }
  }
}
```

- `hash_algo` is `sha256` or `md5`. New entries always use `sha256` (`wiki-hash.ts <file>` prints `sha256:<hex>`; store the hex part).
- Legacy entries have no `hash_algo`: they are md5. Compare them with `wiki-hash.ts --algo md5 <file>`. They migrate to sha256 when their source is re-ingested; there is no bulk rewrite.
- `pages_created` / `pages_updated` are relative to `{wiki_root}`.
- Library: `plugin/lib/manifest.ts` (`readManifest`, `hashFile`, `compareEntry`).

## Log entry format

```
## [YYYY-MM-DD] ingest | [Source Title]
Pages created: [[Page A]], [[Page B]]
Pages updated: [[Page C]]

```

Query entries (written by `wiki-save`):

```
## [YYYY-MM-DD] query | [Question]
Pages created: [[Question Page]]
Sources: [[Page A]], [[Page B]]
```
