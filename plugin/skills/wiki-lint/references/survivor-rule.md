# Survivor rule

Among duplicate pages and conflicting claims, the survivor is always the one whose ORIGINAL source is linked, unless there is a refutation with a clear reference.

The rule decides the **proposal**. Present it in the plan as `file: change (why)` and apply it only after approval. Merging or deleting a page is always its own plan line.

## What is an original source

The first-hand document: the paper, official documentation, spec, original article, dataset or repository. Linked as a `sources` URL in frontmatter or as a link to a source page of the wiki (which itself points to the original).

Not original: a summary, a blog repost, a forum thread quoting the document, an unattributed web page, or another wiki page without a source. When a source page only summarises, follow its link to the document; if none exists, treat the page as having no original source.

## What is a clear reference

A named source plus the place in it (section, page, heading, line, timestamp) that explicitly contradicts the claim. "I read that it is 50" is an assertion, not a reference. A source named without location, or one that only implies the contradiction, is not clear: ask the user.

## Outcomes

| Case | Result |
|------|--------|
| Only one page links an original source | It survives |
| Both link one | Keep both unless one clearly supersedes (newer edition, errata, official doc) |
| Neither | Ask the user; do not pick |
| Clear refutation | Refuting claim prevails; older claim recorded as superseded |

Resolved conflicts: replace the open callout with `> [!contradiction] resolved YYYY-MM-DD` followed by one or two sentences naming the winning source and why.

## Example 1: Home Repo vs Home Repository

`Home Repo.md` has `sources: [https://example.com/articles/home-repo]` (the original article) and says the setup uses a single repo. `Home Repository.md` has no sources and says it spans 50 repos, citing "an unverified web page" with no location.

- Home Repo links the original article, so it survives; propose merging `Home Repository.md` into it (plan line, user approves).
- The 50-repo claim has no clear reference (no named source, no location), so it does not reverse the outcome. Mention it in the plan as unverified.

## Example 2: reversed

Same pages, but `Home Repository.md` has `sources: [https://docs.example.com/home-repo]` and states: "Official docs, section 'Layout': 'the home setup must use a single repo per vault'", contradicting `Home Repo.md`'s claim that several repos are fine.

- Both link original sources, but the second cites the official documentation section that explicitly contradicts the first: a clear reference.
- The refuting page prevails; record the older claim as superseded and write `> [!contradiction] resolved YYYY-MM-DD` naming the official docs 'Layout' section as the winner. Still a plan line; wait for approval.
