# EarlyNews24 to Socialoptical automatic synchronization

The source is now the current EarlyNews24 Supabase CMS (jwyclfnduvavzdjosdlq), not WordPress REST or RSS. The existing Socialoptical cron job invokes sync-earlynews24 every five minutes. No browser or admin tab needs to remain open.

## What copies
Published posts whose publication date has arrived: title, excerpt, sanitized body, publication date, featured image URL, categories and tags. New posts and changes to published post rows are checked using updated_at and published_at, a fixed cutoff and ten-minute overlap. Scheduled posts become eligible once their date arrives. Keyset pagination handles up to 2000 changed records in one run. A failed run retains its checkpoint for retry.

Stable numeric import IDs continue matching existing imported posts. Posts created in the new CMS use cms- followed by the source post UUID. Destination mapping plus a content hash makes repeated runs idempotent. Existing local Socialoptical draft/private status, owner, slug and SEO overrides are preserved. No destination posts or accounts are deleted.

Photos remain on Hostinger. Old earlynews24.com/wp-content/uploads/YYYY/MM references are rewritten to https://media.earlynews24.com/YYYY/MM in featured and inline images. New cms-uploads image URLs are retained. No photo binary is copied to GitHub, Vercel or Supabase Storage.

## Security
Only the source publication's public, RLS-filtered published content is read, using its public publishable key. Draft/private data and editor accounts are not read. Destination writes use the Edge Function's built-in service credential, never browser code. The existing Vault-backed x-sync-token is checked by cms_sync_start; unauthenticated invocation is rejected. No new key is created or revealed. All sync RPCs remain service-role-only; admin-only run logs are protected with RLS.

## Status
Socialoptical admin > Overview > EarlyNews24 automatic sync shows last run, success/error, added/updated/checked counts and source mode supabase-cms. Reader pages load current database posts when opened or refreshed. An already-open reader tab is not a live subscription.

## Limits
Only publicly published source posts can be read. Removing, unpublishing or deleting a source post is not propagated as a destination deletion or unpublish. Category/tag changes saved with a post are copied; editing a term independently does not advance the post's update timestamp. This is one-way synchronization; edits made only on Socialoptical are not written back to EarlyNews24.

## Source and database migration
supabase/functions/sync-earlynews24 contains the deployed code. database/earlynews-cms-sync.sql updates the existing batch RPC to accept stable CMS UUID-based source identifiers while preserving legacy mappings and access controls. It is an incremental migration after earlynews-sync.sql, not a replacement database installer.
