# Ingest plan template

Show ONE plan per ingest, then ask a single approval. Nothing is written before approval.

```text
Ingest plan: <source title>

Create
- {wiki_root}/<Page>.md — <one-line reason>
Update
- {wiki_root}/<Page>.md — sections: <Heading A>, <Heading B> — <one-line reason>
Append
- <file> — <what is appended and why>

Housekeeping (in this order)
1. {index} — <entry added or changed>
2. {log} — `## [YYYY-MM-DD] ingest | <title>`
3. {hot} — <what changes; stays under ~500 words>
4. {manifest} — <new entry, hash_algo sha256>

Raw file: <path> — retained (default)
```

If the user asks to delete the raw file, record that in the plan line and, for local images, move them to `{attachments}` instead of deleting.
