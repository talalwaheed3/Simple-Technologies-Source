# POST-LAUNCH: Full ChatGPT Historical Content Audit

Status: deferred solely until the actual ChatGPT export is supplied. It does not block engineering, database setup, authentication, deployment, or application launch.

## Correct scope

Conversation creation date: **April 5, 2026 through the export date**, inclusive. The default start is midnight in Pakistan (`2026-04-05T00:00:00+05:00`). Supply an explicit ISO timestamp with offset to override this. Conversations created before this boundary are excluded; messages outside the selected range are excluded. Missing conversation dates are listed for manual review, not silently assumed. Missing message dates within an eligible conversation are retained and flagged.

This supersedes the original brief's opposite interpretation. The eight pre-April-5 candidates remain untouched as private legacy drafts. They do not establish coverage of the corrected range and are not evidence of successful repairs.

## Accepted input and private preparation

Use the actual ChatGPT export ZIP with `conversations.json` and any accompanying assets, or the original extracted `conversations.json`. An HTML-only export is not automatically parsed. Never paste secrets into commands or upload raw transcripts into public storage, the Git repository, or deployed assets.

```bash
# Choose a new empty private location outside this source repository.
python3 scripts/prepare-export.py /private/chatgpt-export.zip /private/export-2026-09
npm run import:history -- /private/export-2026-09/conversations.json /private/history-review --until=2026-09-23T23:59:59+05:00
```

The example end date must be replaced with the actual export date/time. Without `--until`, the parser uses the preparation time and records it. Extraction rejects path traversal, symlinks, oversized members and nonempty destinations; files get private permissions. `export-files.json` records SHA-256 hashes and asset paths. No script calls an AI API, writes to Supabase, or publishes an article.

The parser writes private source files, `inventory.json` and `coverage.json`. It retains **all** in-range conversations, including ones without technical keywords, so heuristic filtering cannot silently hide cases from the later completeness review. Original branches, node/parent IDs and active-branch flags remain available to distinguish suggestions, regenerated answers and confirmed outcomes. Missing dates and exclusions are explicitly reported.

## Match and deduplicate

Pass `--existing=/private/current-case-inventory.json` with an up-to-date admin-exported inventory when available. The bundled inventory is the default. Match source conversation IDs first, then flag exact normalized titles or identical normalized user text as candidates. Hashes provide stable import identifiers; repeated imports target the same private filenames. No automatic merge is performed: similar symptoms can have different root causes. Review device/model, symptoms, diagnosis and repair steps to select canonical articles. Retain multiple source references for merged cases and preserve original article IDs/slugs on updates.

## Evidence and publication gate

For every candidate, read the full applicable thread and classify the outcome as confirmed repair, confirmed diagnosis, proposed procedure, unresolved, or irrelevant. Record unsuccessful attempts, actual commands/settings, how the user verified success, device/OS and source dates. An assistant suggestion is not evidence it worked. Produce structured drafts with source references; publish only after outcome verification, technical source validation, editorial review and privacy checks. Unresolved cases remain Needs Verification/private.

## Screenshots and privacy

The export manifest inventories files without publishing them. Message asset/file references are preserved in the private inventory; match these to export paths/IDs and hashes. Do not fetch arbitrary URLs embedded in messages. Missing assets remain explicitly missing. Inspect each candidate image visually; redact/crop private names, account details, serials, keys, customer documents and unrelated material. Keep the original privately; upload only reviewed redacted images through the existing admin pipeline. It validates actual MIME/size, strips metadata from web derivatives and requires alt text/privacy review before public use.

The text redaction helper handles common email/number/secret/path patterns only. It is not a complete privacy audit. A person must review commands, code, filenames and screenshots before publication. Never overwrite source evidence with redacted text; maintain a private source and separate safe editorial copy.

## Completion comparison

Reconcile total export conversations with in-range conversations, before/after exclusions and unknown dates. Review non-keyword conversations as well as keyword candidates. Reconcile every relevant case to an existing article, new draft, canonical duplicate, unresolved case or documented exclusion. Only then mark `exhaustive_audit_complete` true in the final reviewed report. Publish a count summary without exposing raw transcripts or private file references.

## When the export arrives

Start with secure extraction and a manifest, run the corrected date filter, compare against the then-current content database, inspect outcomes/assets, prepare and verify missing articles, and reconcile coverage. Continue from the existing application and content IDs; do not rebuild the site.
