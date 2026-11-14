# Shared article routes

Published posts are loaded from Supabase by slug at request time in the browser. New posts must not depend on generated news/<slug>/index.html files.

Vercel: vercel.json routes /news/:path* to api/article.mjs. This public page shell preserves the browser URL; the existing published-only/RLS-protected client resolves the story. Admin routes and static assets keep their existing paths. When changing index.html, update the page shell in api/article.mjs too.

Sites: node scripts/build-article-router.mjs packages the current dist assets in one Worker with a shared /news/<slug> entrypoint. It returns real 404s for missing assets and serves admin/editor pages as before. Build this Worker before publishing; .openai/hosting.json intentionally omits static.

Tests cover new/unbuilt article slugs, trailing slash variants, existing admin/editor paths, exact asset content, HEAD requests and missing assets.
