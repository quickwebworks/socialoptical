# Socialoptical Supabase connection

The hosted preview is connected to project totzocwtklrzgjnxnoqx. The browser uses
only its publishable API key; database grants and RLS protect private content.

## First admin account

1. In the Supabase project, open Authentication → Users. Create or use your own
   email/password account. No default account or password is supplied.
2. Open /admin/ and use the Supabase sign-in button. If the account is not an
   admin, the panel shows only your own user UUID and a one-line SQL grant.
3. Run that statement in the project's SQL Editor as the project owner:
   `insert into public.cms_admins(user_id) values ('YOUR_AUTH_USER_UUID') on conflict do nothing;`
4. Sign out and sign in again. Never put service-role keys into the page.

## Import and publication

Choose a UTF-8 WordPress SQL file up to 250 MB, choose dates and analyse locally.
Review the posts, then click Import posts + categories + tags. The importer calls
an authenticated, SECURITY INVOKER database function in batches of 25 records.
Each batch is transactional; prior successful batches remain after a later failure.
A retry updates matching source origin + WordPress IDs instead of adding duplicates.
Published posts with past dates become public immediately; drafts/future/private
posts remain protected by RLS. Import only content you intend to publish.

Posts/categories/tags are stored in cms_posts/cms_terms/cms_post_terms.
The homepage loads published records from Supabase; category and tag links use
shareable query URLs and database filters. No sample stories are substituted when
the database is empty. Article HTML is rebuilt with an element/URL allowlist.

Attachments keep their source URLs. Retain access to /wp-content/uploads/ on the
original media server after changing hosts, or provide an equivalent media route.
Import does not copy image bytes. Source-local WordPress dates without valid GMT
values are interpreted in Asia/Kolkata; confirm this matches the original site.

## Verification and remaining limits

Database tests confirmed anonymous reads exclude drafts and future posts, and
non-admin imports are rejected. Security Advisor reported no lints after setup.
Browser script syntax and SQL parser checks passed, including a synthetic 200 MB
file and chunk-boundary cases. No real SQL export has been supplied and no real
posts are imported yet. Live admin login and successful authorized import still
need to be verified with the owner's own account and source file. Browser visual
QA has not been performed. The frontend is currently static HTML/JS using the
Supabase REST API, not a completed Next.js application. Google ads remain samples.
