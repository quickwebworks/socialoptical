# EarlyNews24 → Socialoptical source sync

The production Supabase project `totzocwtklrzgjnxnoqx` runs Edge Function `sync-earlynews24`, called every five minutes by Cron job `earlynews24-to-socialoptical`. Authentication is a random scheduler token stored encrypted in Vault, compared against a private hash; only server-side service credentials can invoke the database sync RPCs. Browser clients cannot invoke them or read the token. Do not copy Vault contents or server credentials into GitHub.

The importer first tries WordPress REST with modification windows and embedded terms/media. When REST is unavailable it uses the public RSS feed and article HTML metadata. All HTML is sanitized. RSS includes full content but not featured pictures, so source article pages must load for pictures and exact tag metadata. Inaccessible articles are skipped and retried; successfully fetched articles remain saved. A run with skipped articles is marked error/partial and does not advance its checkpoint. A private backup of pre-sync posts exists in `cms_sync_private.posts_before_sync`.

Existing imported records are matched by stable source ID + slug (the previous SQL import used Socialoptical as source origin), and future runs use a private post map + content hash. This preserves UUID article URLs and avoids duplicate rows on retries. Local statuses, owners, slugs and SEO overrides are preserved. Source-owned content and taxonomy update when it changes. No source deletion/unpublish propagation is implemented. No ads or roles are changed by the importer.

## Current source limitation

At installation, WordPress REST and paginated RSS endpoints returned HTTP 500. Some individual article pages also return HTTP 500. Accessible recent RSS articles are imported with pictures; other articles remain retryable failures. Older backlog cannot be guaranteed while paginated endpoints fail. RSS cannot reliably detect edits outside its recent window. Source server PHP/error logs must be repaired for complete historical and modification coverage. No checkpoint is advanced after a partial article failure.

## Monitor

Admin → Overview → EarlyNews24 automatic sync shows last attempt, last complete success, counts and source errors. Publication editors cannot read these logs. The history also appears in `public.cms_sync_runs` in the Supabase SQL Editor. Cron job history proves scheduling; application run history proves actual import results. These are different checks.

## Pause before replacing WordPress

The importer fetches https://earlynews24.com. If that domain is switched to the new database-backed frontend, WordPress's feed and API disappear at that address. Both new frontends already share the same database and need no cross-site import for CMS-created posts. Pause the importer before that cutover:

```sql
select cron.alter_job(job_id := (select jobid from cron.job where jobname='earlynews24-to-socialoptical'), active := false);
```

If WordPress must remain the authoring source, retain it at a separate source hostname and change the importer's fixed origin and normalization rules before enabling it again. Do not point the source importer at its own destination frontend.

## Deployment source

`database/earlynews-sync.sql` installs the tables and RPCs in a fresh configured database, once. `supabase/functions/sync-earlynews24` contains the Edge Function. `database/earlynews-sync-schedule.sql` enables the scheduling extensions and creates the five-minute job. The schema has already been applied in production; do not run the initial installer again against production. Secret creation is server-side only.
