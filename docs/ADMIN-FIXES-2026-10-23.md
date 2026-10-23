# Admin and importer updates

- Overview uses exact Supabase counts for total, published, draft, pending, private and scheduled posts, plus categories and tags. It no longer reads browser-local SQL preview counts.
- Publish now sets the publication time to the current device time. View on website opens a saved published article. Public requests bypass browser caching and refresh after returning to the page.
- Header, footer and admin logos link to the homepage. Public admin links remain removed; use /admin/ directly.
- Database-backed categories use the requested EarlyNews24 menu labels and order. Existing term/post relationships are preserved during normal imports.
- Plain UTF-8 .sql exports up to 400 MiB are accepted by both picker and worker. The worker reads 1 MiB chunks. Individual statements must remain under 32 MiB. The full file is analyzed locally; only reviewed normalized content batches are submitted to Supabase.
- Tests: node tests/admin-overview.cjs and node tests/import-400mb.cjs. The latter uses a generated 400 MiB file; actual maximum memory use depends on retained post and attachment content.

## Database state

Publication posts, categories, tags and relationships were cleared at the owner's request. Admin access and advertisement settings were preserved. A private database recovery copy was retained; it is not part of this repository. Do not re-run database/publication-menu.sql if you want categories to remain empty: that setup migration seeds category records.

## Remaining integration

Automatic EarlyNews24 synchronization is not enabled. Its RSS feed was reachable, but its WordPress posts API returned HTTP 500 during verification. Full article/photo syndication requires ownership or republication permission and an unattended, authenticated sync worker.
