# Obsidian CLI commands

The CLI is optional: file tools are primary. It talks to the running app and hangs if Obsidian is closed or backgrounded; prefix with `timeout 20` and fall back to file tools on failure. It cannot handle JSON files (use Read/Write).

```bash
# Orient (step 2)
obsidian read path="{wiki_root}/{hot}"
obsidian read path="{wiki_root}/{index}"
# Create notes and pages (steps 4, 5, 6)
obsidian create path="Atlas/Dots/Fiction/[Título] (book).md" content="..." silent
obsidian create path="{wiki_root}/Fiction/[Page].md" content="..." silent
# Index (step 7)
obsidian create path="{wiki_root}/{index}" content="..." overwrite silent
# Log (step 8)
obsidian prepend path="{wiki_root}/{log}" content="## [$(date +%Y-%m-%d)] ingest | [Título]\nPages created: [[Page A]], [[Page B]]\nPages updated: [[Page C]]\n\n"
# Hot (step 9)
obsidian create path="{wiki_root}/{hot}" content="..." overwrite silent
# Delete raw (step 11, after confirmation)
rm "<vaultRoot>/{raw}/[filename].json"
```
