# Socialoptical.in — Next.js + Supabase News CMS

Development-ready PRD and phased coding guide • 17 October 2026

## 1. Deliverable and boundaries

Build a WordPress-like single-publication news CMS using Next.js App Router, TypeScript, Tailwind CSS and Supabase PostgreSQL/Auth/Storage. This document defines the complete target product and includes foundation SQL and starter code. It is not a finished application. The implementation milestones below turn it into a deployable product; do not label unimplemented dashboards or connectors complete.

Single publication in V1; multiple staff users. No WordPress runtime or PHP required. No arbitrary plugin execution. Future expansion: multiple publications, paid memberships, newsletters and mobile apps.

## 2. Google product choice — resolve before integrating

| Product | Purpose | Website implementation | Reports |
|---|---|---|---|
| Google Ad Manager (recommended) | Publisher inventory, direct campaigns and eligible programmatic demand | GPT ad units mapped to website placements | Authorized Ad Manager reporting API |
| AdSense (optional alternative) | Publisher monetization after approval | Approved AdSense code with configured publisher and slot IDs | Separate AdSense Management reporting integration |
| Campaign Manager 360 (CM360) | Advertiser/agency campaign trafficking, serving and measurement | Approved advertiser placement tags, often trafficked as supported third-party creatives in Ad Manager | Separate CM360 reporting API, account/profile authorization required |
| Google Ads | Buying traffic for the news website | Separate advertising account; does not populate publisher ad slots | Advertiser spend/conversion reporting, separate from publisher revenue |

If the client literally has CM360, preserve that requirement: accept its approved tags through a controlled integration and optionally import its reports. Do not replace the account with Ad Manager silently. V1 defaults to Ad Manager for website inventory. V1 supports manual configuration of ad units; changing a campaign in Google can update what serves without redeploying the website. Creating or editing Google orders, creatives and line items from this CMS is a later, separately scoped trafficking feature.

Ad rendering and reporting are independent. Tags may serve before API reporting is authorized. A CMS cannot grant Google account approval, advertiser access, fill, revenue or reporting permissions. Missing credentials must yield a visible “Not connected” state, never fabricated live metrics.

## 3. Product requirements

### Public website

- Responsive editorial homepage: logo, navigation, latest stories, breaking news strip, lead story, category sections and footer.
- Article pages: headline, summary, author, publish/update timestamps, hero media, captions, block content, related articles, category/tag links and share links.
- Category, tag and author archives with pagination; keyword search with accessible filters and empty states.
- Static pages: About, Contact, Privacy, Terms, Editorial Policy, Corrections and Advertise With Us.
- Desktop ad rail; mobile-safe in-article placements; no ads obstructing navigation or article controls.
- English first, UTF-8 support for Hindi and Punjabi; separate language versions/hreflang in a later multilingual milestone.
- Reader login, bookmarks and moderated comments are optional V1.1, not launch blockers.

### Editorial panel

`/admin`: dashboard; Posts; Add Post; Pages; Categories; Tags; Media; Authors/Users; Advertisements; Ad Reports; Menus; SEO; Settings; Audit Log.

Post lifecycle: draft → pending review → scheduled/published → archived. Autosave produces a draft/revision, not an accidental public update. Published edits require intentional Update. Slugs are unique; changed public slugs produce 301 redirects. Deletion uses trash with restore and a deliberate permanent-delete action.

Editor: TipTap with structured JSON, headings, paragraphs, lists, quotes, links, images, captions and approved YouTube embeds. Save structured blocks and render only allowed nodes. Never render unsanitized submitted HTML. Image requirements: alt text, MIME and size validation, compression, width/height and credit/license fields. Private draft assets use signed URLs; publishing copies approved media to the public bucket. Unpublishing an article does not guarantee already-public assets disappear from external caches.

SEO: per-post title/description, canonical URL, robots flags, social image, Article/NewsArticle JSON-LD, BreadcrumbList, sitemap, RSS and redirects. No promise of Google News inclusion. Public query and cache logic must exclude unpublished, future and trashed posts.

### Roles

| Action | Admin | Editor | Author | Ads manager |
|---|---|---|---|---|
| Manage site settings/staff | Yes | No | No | No |
| Write own draft / submit | Yes | Yes | Yes | No |
| Edit any content/publish | Yes | Yes | No | No |
| Own draft previews | Yes | Yes | Yes | No |
| Manage ad configuration | Yes | No | No | Yes |
| Read ad reports | Yes | No | No | Yes |
| Read audit log | Yes | No | No | No |

UI hiding is convenience only. Enforce permission checks in Server Actions/Route Handlers AND database RLS. Staff roles reside in a protected table, never user-editable metadata. Recheck role on every privileged operation. Service-role keys never enter client bundles.

## 4. Advertisement requirements

### Placements

| Placement key | Suggested desktop sizes | Mobile sizes | Location |
|---|---|---|---|
| home_top | 970×250, 728×90 | 320×100, 320×50 | Below header |
| article_top | 728×90 | 320×100 | Below article intro |
| article_inline_1 | 300×250, 336×280 | 300×250 | After eligible paragraph 3 |
| article_inline_2 | 300×250, 336×280 | 300×250 | After paragraph 8 on long articles |
| sidebar_top | 300×250, 300×600 | hidden | Desktop rail |
| article_bottom | 728×90, 300×250 | 300×250 | After article |

These are layout suggestions; actual configured sizes must match the Google inventory. An article with too few paragraphs must not insert duplicate/adjacent ads. Reserve suitable space to reduce layout shift. Size mapping must avoid desktop creatives on small screens. Use stable unique DOM IDs per mounted slot.

### Admin controls

- Choose provider: Ad Manager, AdSense, CM360 approved placement, direct banner or disabled.
- Configure network code/ad unit path or approved provider IDs, placement, allowed sizes, device rules, category targeting, enabled state and start/end timestamps in UTC.
- Preview with clearly marked test inventory and no fake billable traffic. Record who changed configuration and when.
- V1 configuration uses structured fields and allowlisted templates. Do not accept arbitrary executable JavaScript in a general-purpose textarea.
- CM360 tag import requires admin review and a provider-specific renderer; preserve macro/click-tracker semantics per Google documentation. An iframe sandbox must be tested against the supported tag type; arbitrary sandboxing can break delivery.
- Direct banners have image, alt text, destination URL, sponsor label and schedule. Validate HTTPS destinations; redirects resolve stored destinations by ID to avoid open redirect abuse.
- Ads manager can edit provider IDs/configuration, but cannot access raw OAuth credentials or authorize arbitrary domains/scripts.
- Load the provider script once; define/destroy GPT slots with component lifecycle on client navigation. Prevent stale category targeting and duplicate display calls. Do not invent automatic refresh behavior; only use policy-compliant, declared inventory if enabled later.
- Integrate required consent mechanisms for the deployment regions and provider configuration. Test accepted, declined and unknown consent; a provider’s documented consent signals govern whether limited/nonpersonalized requests are permitted. Do not simply assume all requests are allowed.
- Publish ads.txt entries supplied by the actual providers/account; do not invent seller identifiers.

### Reporting

Google delivery/reporting is authoritative for Google-served ads. Browser slot events are diagnostics, not Google billable impressions or revenue. Never attach a competing click handler/overlay to Google ads or read a cross-origin iframe to infer clicks.

Admin dashboard: date range, provider, placement, device and category filters where the selected provider supports compatible dimensions; daily table/chart, CSV export, last successful sync, freshness status, network timezone and currency. Show impressions, clicks, CTR, available revenue and eCPM. Requests, matched requests, fill and viewability appear only when the selected report supports them. CM360 advertiser delivery does not imply publisher earnings; display revenue as unavailable unless an authorized source supplies it.

CTR = 100 × clicks / impressions. eCPM = 1000 × revenue / impressions. Return 0 for zero-denominator rate displays, while keeping missing revenue null. Compute totals from summed numerators/denominators, not averages of daily rates. Do not combine currencies or unlike metric definitions. Record revenue units and convert Google micros exactly once if the chosen API uses them.

Direct-banner diagnostics: a separate authenticated/rate-limited event intake may record an estimated visible impression (at least 50% visible for 1 second) and a click redirect. Deduplicate using expiring pseudonymous tokens; filter obvious bots. These remain first-party estimates and must not be sold as audited billing metrics. Minimize raw identifiers and define retention. Do not mix them with Google figures.

### Google connector flow

1. Admin configures approved Google account/network identifiers and a supported reporting API version.
2. Server authorizes OAuth with state validation, minimum reporting scopes and required account/profile membership. Use a service account only if the chosen API/account explicitly supports it.
3. Keep refresh credentials encrypted in a server secret store. Never expose refresh/access tokens via a public Supabase table or browser environment variable. Provide disconnect/revoke behavior.
4. A worker creates an asynchronous report for a bounded range and supported dimension/metric combination. Store its job ID, status and retries; poll with backoff outside a short web request.
5. Download and normalize report rows with provider/account/timezone/currency dimensions. Transactionally upsert on a stable dimension key; repeat jobs must not duplicate totals.
6. Re-fetch recent days to capture reporting adjustments; show previous successful data on failure with a stale label. Respect quotas and distinguish permission failure from zero activity.
7. Request an hourly or daily sync depending on quotas and expected latency. Ad reporting is not promised in real time. Scheduler/worker availability and cost depend on hosting.

Do not pin a guessed Google API schema in code. The current Ad Manager REST API is documented as beta; verify required metrics/dimensions and account compatibility before choosing it or a supported SOAP version. Pin the selected SDK/API version in the repository and document upgrade/deprecation dates.

## 5. Architecture and repository

Use Next.js server components for public content, client components only for interactive features, and Supabase SSR for cookie sessions. Next.js Route Handlers/Server Actions are the backend; a separate Express server is unnecessary for V1. Use a separate worker process for long reporting jobs when required.

```text
src/app/(public)/page.tsx
src/app/(public)/news/[slug]/page.tsx
src/app/(public)/category/[slug]/page.tsx
src/app/(public)/search/page.tsx
src/app/login/page.tsx
src/app/admin/layout.tsx
src/app/admin/posts/page.tsx
src/app/admin/posts/new/page.tsx
src/app/admin/advertisements/page.tsx
src/app/admin/ad-reports/page.tsx
src/app/api/internal/ad-sync/route.ts
src/components/editor/
src/components/ads/
src/lib/supabase/{client,server,proxy}.ts
src/lib/auth/require-role.ts
src/lib/ads/{providers,reporting}.ts
src/proxy.ts
supabase/migrations/
tests/{rls,editorial,ads}/
docs/{PRD,PROGRESS}.md
```

Tailwind plus accessible headless/native controls; optional shadcn/ui. Strong contrast, large tap controls, visible save status and responsive tables/cards. Reader pages should feel like a news publication; admin should feel familiar to a WordPress user. No 3D effects needed for reading or editing.

## 6. Database design

| Table | Key columns / constraints |
|---|---|
| staff_roles | user_id references auth.users, role enum; only admin can mutate |
| author_profiles | user_id, public display name/bio/avatar; no public email |
| posts | id, author_id, slug unique, title, excerpt, body JSON, status, publish_at, created/updated_at, SEO, deleted_at |
| post_revisions | post_id, actor_id, body/title snapshot, revision number, timestamp; private |
| categories / tags | unique slug, name; admin/editor writes |
| post_categories / post_tags | composite unique keys; authorized through post permission |
| media | owner_id, bucket/path, MIME, bytes, dimensions, alt/credit, visibility |
| pages | slug, title, body, status, SEO |
| redirects | unique old_path, new_path, status=301; prevent loops |
| navigation / site_settings | structured validated values; public-safe projection excludes secrets |
| ad_placements | unique key, layout/size rules, page rules |
| ad_units | provider, placement_id, external identifiers, configuration JSON, enabled, UTC window |
| direct_campaigns | placement/creative, sponsor/destination, UTC window, active |
| ad_report_jobs | provider/account, range, external_job_id, status, retries, error_code, last_sync |
| ad_daily_stats | provider/account/date/timezone/currency + compatible dimension key unique, metrics JSON/version |
| audit_logs | actor_id, action, entity_type/id, redacted change summary, timestamp; append only |

Indexes: posts(status,publish_at desc), posts(author_id), posts(slug), active ad window/placement, stats(provider,account,date), revision(post_id,created_at desc). Add a generated full-text search column with GIN after a language strategy is chosen; use PostgreSQL `simple` configuration for a mixed-script starting point, with quality evaluation.

## 7. Step 1 — scaffold in VS Code

Install Git, a current Node.js LTS supported by the selected Next.js release, and VS Code. Open a terminal:

```bash
npx create-next-app@latest socialoptical --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
cd socialoptical
npm install @supabase/supabase-js @supabase/ssr zod server-only
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image
npm install -D @types/google-publisher-tag
code .
npm run dev
```

Use the generated lockfile, record installed versions and Node engine, and keep one package manager. The starter examples below assume Next.js 16+ (`proxy.ts`, asynchronous cookies/params). If choosing an earlier release, adapt using its official documentation. `@latest` is setup convenience, not a reproducible production version pin.

Create a Supabase project and copy URL/publishable key from its Connect dialog. `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Publishable keys are intentionally client-visible; RLS protects the data. Keep `.env.local` ignored by Git. Add server-only Google/OAuth/worker secrets only when implementing the connector. This starter does not require a service-role key. Configure local and deployed Auth redirect URLs exactly.

## 8. Step 2 — foundation migration

Run once on a new development project through a tracked Supabase migration. This intentionally implements only roles/posts, not the full table list. Extend it in later milestones.

```sql
create type public.staff_role as enum ('admin','editor','author','ads_manager');
create type public.post_status as enum ('draft','pending','scheduled','published','archived');
create table public.staff_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.staff_role not null
);
alter table public.staff_roles enable row level security;

-- Owner-controlled role lookup avoids recursive RLS on staff_roles.
create function public.has_role(allowed public.staff_role[])
returns boolean language sql stable security definer
set search_path = '' as $$
 select exists (
   select 1 from public.staff_roles r
   where r.user_id = (select auth.uid()) and r.role = any(allowed)
 );
$$;
revoke all on function public.has_role(public.staff_role[]) from public;
grant execute on function public.has_role(public.staff_role[]) to authenticated;
grant select, insert, update, delete on public.staff_roles to authenticated;
revoke all on public.staff_roles from anon;
create policy roles_read on public.staff_roles for select to authenticated
using (user_id = (select auth.uid()) or public.has_role(array['admin']::public.staff_role[]));
create policy roles_admin on public.staff_roles for all to authenticated
using (public.has_role(array['admin']::public.staff_role[]))
with check (public.has_role(array['admin']::public.staff_role[]));

create table public.posts (
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null references auth.users(id),
 slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 title text not null check (char_length(title) between 1 and 200),
 excerpt text not null default '',
 body jsonb not null default '{"type":"doc","content":[]}',
 status public.post_status not null default 'draft',
 publish_at timestamptz,
 deleted_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check (status not in ('published','scheduled') or publish_at is not null)
);
create index posts_public_feed on public.posts(status,publish_at desc);
create index posts_author on public.posts(author_id);
alter table public.posts enable row level security;
grant select on public.posts to anon, authenticated;
grant insert, update, delete on public.posts to authenticated;
create policy posts_public on public.posts for select to anon, authenticated
using (status = 'published' and publish_at <= now() and deleted_at is null);
create policy posts_staff_read on public.posts for select to authenticated
using (
 public.has_role(array['admin','editor']::public.staff_role[])
 or (author_id = (select auth.uid()) and public.has_role(array['author']::public.staff_role[]))
);
create policy posts_staff_insert on public.posts for insert to authenticated
with check (
 public.has_role(array['admin','editor']::public.staff_role[])
 or (author_id = (select auth.uid()) and status in ('draft','pending')
     and publish_at is null and deleted_at is null
     and public.has_role(array['author']::public.staff_role[]))
);
create policy posts_staff_update on public.posts for update to authenticated
using (
 public.has_role(array['admin','editor']::public.staff_role[])
 or (author_id = (select auth.uid()) and status in ('draft','pending')
     and deleted_at is null and public.has_role(array['author']::public.staff_role[]))
)
with check (
 public.has_role(array['admin','editor']::public.staff_role[])
 or (author_id = (select auth.uid()) and status in ('draft','pending')
     and publish_at is null and deleted_at is null
     and public.has_role(array['author']::public.staff_role[]))
);
create policy posts_admin_delete on public.posts for delete to authenticated
using (public.has_role(array['admin']::public.staff_role[]));
create function public.touch_post() returns trigger language plpgsql
set search_path = '' as $$
begin
 new.updated_at = now();
 return new;
end;
$$;
create trigger posts_touch before update on public.posts
for each row execute function public.touch_post();
```

Create the first staff login in Supabase Auth. Copy its actual UUID. In a trusted SQL session only:

```sql
-- Replace the placeholder with the existing Auth user's actual UUID.
insert into public.staff_roles (user_id, role)
values ('REPLACE_WITH_AUTH_UUID'::uuid, 'admin');
```

Never expose a “make me admin” endpoint. Role changes require existing admin authority and auditing. Before launch add last-admin protection, revision/audit triggers, and tests of direct REST access. All new tables/buckets must receive explicit RLS policies before use; the foundation policies do not cover future tables automatically.

## 9. Step 3 — Supabase client and session refresh

`src/lib/supabase/client.ts`:

```ts
import { createBrowserClient } from '@supabase/ssr';
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
```

`src/lib/supabase/server.ts`:

```ts
import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
export async function createClient() {
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: {
      getAll: () => jar.getAll(),
      setAll(values) {
        try { values.forEach(({ name, value, options }) => jar.set(name, value, options)); }
        catch { /* Read-only Server Component; proxy performs refresh. */ }
      }
    }}
  );
}
```

`src/proxy.ts`:

```ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }}
  );
  await supabase.auth.getClaims();
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
export const config = {
  matcher: ['/admin/:path*', '/login', '/auth/:path*', '/api/internal/:path*']
};
```

This minimal matcher assumes cookie-authenticated interactions occur under these routes. Extend it if adding reader accounts/other authenticated actions. Do not share-cache authenticated output or refreshed cookies. Build public feed queries with a separate non-cookie publishable client before adding ISR/CDN caching. Copy refreshed cookies/cache headers if adding redirects in proxy.

`src/lib/auth/require-role.ts`:

```ts
import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
type Role = 'admin' | 'editor' | 'author' | 'ads_manager';
export async function requireRole(allowed: Role[]) {
  const db = await createClient();
  const { data, error } = await db.auth.getClaims();
  if (error || !data?.claims?.sub) redirect('/login');
  const { data: member, error: roleError } = await db.from('staff_roles')
    .select('role').eq('user_id', data.claims.sub).single();
  if (roleError || !member || !allowed.includes(member.role as Role)) {
    throw new Error('Forbidden');
  }
  return { db, userId: data.claims.sub };
}
```

Use this in the admin layout for access AND in each mutation with that mutation's allowed roles. An API should map unauthorized/forbidden conditions to HTTP 401/403 instead of exposing a generic 500. A layout check alone does not secure Server Actions.

## 10. Step 4 — first safe draft action

Create `src/app/admin/posts/actions.ts`:

```ts
'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth/require-role';
const Draft = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z.string().min(1).max(180).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  excerpt: z.string().trim().max(500)
});
export async function createDraft(form: FormData) {
  const { db, userId } = await requireRole(['admin', 'editor', 'author']);
  const parsed = Draft.safeParse({
    title: form.get('title'), slug: form.get('slug'),
    excerpt: form.get('excerpt') ?? ''
  });
  if (!parsed.success) return { error: 'Check title, slug and excerpt.' };
  const { error } = await db.from('posts').insert({
    ...parsed.data, author_id: userId, status: 'draft',
    body: { type: 'doc', content: [] }
  });
  if (error) return { error: error.code === '23505' ? 'Slug already exists.' : 'Could not save draft.' };
  revalidatePath('/admin/posts');
  return { success: true };
}
```

Bind through a form action wrapper/useActionState with visible errors and disabled submission while pending. Add the TipTap content payload only after implementing a size-bounded recursive allowed-node schema and safe renderer. Do not use `z.any()` for article HTML. Derive author/status from verified permissions; never accept a posted role or author override from an author.

## 11. Step 5 — first public feed

Replace the generated `src/app/page.tsx` (or move into the public route group later):

```tsx
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
export const dynamic = 'force-dynamic';
export default async function Home() {
  // No session cookies: published-content query cannot leak staff previews.
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { data: posts, error } = await db.from('posts')
    .select('id,slug,title,excerpt,publish_at')
    .eq('status', 'published').is('deleted_at', null)
    .lte('publish_at', new Date().toISOString())
    .order('publish_at', { ascending: false }).limit(20);
  if (error) throw new Error('News feed unavailable');
  return <main className="mx-auto max-w-6xl px-4 py-10">
    <h1 className="mb-8 text-4xl font-bold">Latest News</h1>
    {!posts?.length && <p>No published stories yet.</p>}
    <div className="grid gap-6 md:grid-cols-3">
      {posts?.map(post => <article key={post.id} className="rounded-xl border p-5">
        <h2 className="text-xl font-semibold">
          <Link href={`/news/${post.slug}`}>{post.title}</Link>
        </h2>
        <p className="mt-3">{post.excerpt}</p>
      </article>)}
    </div>
  </main>;
}
```

The links need the article route built in milestone 5. Build the article query using the same public-only client/filters and return `notFound()` for hidden/future/deleted stories. Add safe block rendering, metadata and pagination before treating this as a finished public site.

## 12. Ad rendering implementation contract

Use the official GPT library and `@types/google-publisher-tag`. Implement a root client-side provider and an `AdSlot` component in the ads milestone. The essential lifecycle is:

```ts
// Outline inside the shared provider/AdSlot, not a drop-in complete component.
// Run only after the consent controller permits the relevant request.
window.googletag = window.googletag || { cmd: [] };
window.googletag.cmd.push(() => {
  // Validate path/sizes from trusted published placement configuration.
  const slot = window.googletag.defineSlot(adUnitPath, sizes, uniqueElementId);
  if (!slot) return;
  slot.addService(window.googletag.pubads());
  // Set contextual targeting only from allowed non-sensitive values.
  slot.setTargeting('section', categorySlug);
  // Shared provider enables services once, after initial configuration.
  window.googletag.display(uniqueElementId);
  // Retain `slot`; on unmount queue destroySlots([slot]).
});
```

Load `https://securepubads.g.doubleclick.net/tag/js/gpt.js` once through the shared provider. The actual implementation must coordinate script readiness, initial slot registration, enableServices ordering, responsive mappings, cancelled effects, React Strict Mode and route changes. Do not paste this outline alone and call ads complete. Use Google test inventory during integration, then actual approved ad-unit paths. Reporting API calls belong on the server, never in this component.

## 13. Interfaces and background operations

| Interface | Permission | Behavior |
|---|---|---|
| create/update draft action | admin/editor/own author | Validate structured content; optimistic revision conflict check |
| publish/unpublish action | admin/editor | Transaction/revision/audit, invalidate public caches |
| GET public feed/article | anonymous | Published, due, not deleted; bounded pagination |
| upload media | staff content roles | Validate file; private bucket first; ownership-aware RLS |
| update ad unit action | admin/ads manager | Validate provider-specific schema, audit, invalidate config cache |
| GET admin ad reports | admin/ads manager | Read normalized reports; filter whitelist; no secrets |
| POST /api/internal/ad-sync | worker identity | Reject absent/invalid secret; enqueue bounded job, not long polling |
| Google OAuth callback | admin + valid OAuth state | Exchange tokens server-side; encrypted persistence |
| publishing worker | worker identity | Atomic scheduled→published only when due; cache invalidation |

Draft previews require a staff session/permission or a time-limited signed preview link; never put drafts behind guessable public slugs. Schedule in UTC with Asia/Kolkata in the initial admin UI. A missed scheduler run must be recoverable: idempotent workers publish all overdue records, not only an exact minute.

## 14. VS Code AI implementation plan

Save this file as `docs/PRD.md`. Create `docs/PROGRESS.md` with each milestone, status, commands run, failures and next task. Start with a Git commit and commit after each working milestone. Ask for one milestone at a time; full-repository rewrites waste credits and cause regressions.

| Milestone | Work | Required proof |
|---|---|---|
| 1 | Scaffold, environment example, dependency lockfile | Dev server and production build |
| 2 | Roles/posts migrations and RLS | Anonymous draft denial; author cannot self-promote or publish |
| 3 | Login/logout/reset, session refresh, admin shell | Expired-session refresh, invalid-session denial, correct role navigation |
| 4 | Draft CRUD, TipTap, revisions, media | Own/other author separation; malicious node/file rejected |
| 5 | Public home/article/category/search, pages | Published post visible; drafts/future/trash invisible even via direct REST |
| 6 | Editorial review, scheduling, redirects, trash | Author submits; editor publishes; overdue job recovers once |
| 7 | SEO, RSS/sitemaps, responsive accessibility | Valid metadata; keyboard/touch usability; no draft sitemap leaks |
| 8 | Ad tables/RLS, placement controls, direct banners | Ads manager restricted to ads; UTC windows and mobile placement verified |
| 9 | GPT/approved Google provider rendering | One library load; correct route targeting; slots cleaned on repeated navigation |
| 10 | Authorized Google reporting, job worker, dashboard | Google report reconciles for same timezone/range/dimensions; retry idempotency |
| 11 | Audit, rate limits, headers, backups, cache correctness | XSS/CSRF/privilege tests; backup restore; no authenticated cache leakage |
| 12 | Staging, commercial hosting, launch checklist | Typecheck/lint/build, E2E critical paths and real account integration checks |

First prompt:

```text
Read docs/PRD.md completely. Implement milestone 1 only for Socialoptical.
Use Next.js App Router, TypeScript, Tailwind and npm. Inspect the existing
repository before modifying it. Record actual dependency versions and Node
requirements. Create .env.example without real keys. Run typecheck, lint and
production build with the scripts supported by this project. Report files
changed, validation and blockers, then update docs/PROGRESS.md. Do not claim
later milestones are implemented.
```

Reusable next prompt:

```text
Read docs/PRD.md and docs/PROGRESS.md. Implement the next unfinished milestone.
Preserve working features and design. Make tracked migrations for schema/RLS
changes. Enforce authorization in server code and RLS; never use browser
service-role keys. Use real data, with explicit unconfigured/error states.
Add focused security/integration tests required by that milestone. Run the
relevant checks, fix failures, and update PROGRESS with evidence and blockers.
Do not start another milestone until the current acceptance criteria pass.
```

Ads milestone prompt addition:

```text
Keep Google Ad Manager, CM360, AdSense and direct-banner adapters distinct.
Do not invent Google API endpoints, account IDs, SDK methods, revenue or live
metrics. Verify the supported API/SDK against official documentation and pin
its version. Implement retry-safe asynchronous reporting, encrypted OAuth
credentials, least-privilege access and provider-specific metric definitions.
If account access is unavailable, implement the disconnected state and a
clearly labeled test fixture; record real integration as blocked.
```

## 15. Freeware IDE and AI workflow

Recommended editor: VS Code. It is usable without a paid AI subscription. Git, Node.js, Next.js and the Supabase client libraries can be used without IDE license charges. Hosting, account services and AI inference have separate constraints.

Option A — VS Code + GitHub Copilot Free: easy onboarding; current documentation describes a monthly allowance. Check the allowance in your account rather than assuming unlimited coding. Use targeted edits and one milestone per request.

Option B — VS Code + Continue + local Ollama: local model inference avoids per-request cloud AI charges; speed/quality depend on RAM/GPU and the model license. It is suitable for smaller focused tasks; do not assume a small local model can autonomously build/review the entire CMS. Continue cloud services or remote API providers can have their own charges.

1. Install VS Code, Continue extension and Ollama from official sites.
2. Download a local coding model that fits your computer. A documented modest example is `qwen2.5-coder:7b`; use a smaller model if memory is tight.
3. Run:

```bash
ollama pull qwen2.5-coder:7b
ollama list
```

4. Open Continue's local configuration through its UI. Example YAML (adapt the location/schema to the installed extension):

```yaml
name: Socialoptical Local
version: 1.0.0
schema: v1
models:
  - name: Local Coder
    provider: ollama
    model: qwen2.5-coder:7b
    roles:
      - chat
      - edit
      - apply
```

5. Select Local Coder and send the first milestone prompt with the PRD attached. Use chat/edit if the chosen model does not support agent tools. Do not force a capability flag to pretend unsupported tool use exists.
6. Read changes, run checks, commit and proceed. Keep the local model server bound to localhost.

Continue's guide recommends 16GB+ RAM as a practical starting point; model size and context affect actual needs. A 7B model on a CPU may be slow. If the computer is weak, use the free editor plus a limited hosted assistant, and implement small changes manually.

Free Supabase is suitable for an initial prototype subject to current database/storage/egress/Auth quotas, inactivity and backup limitations; inspect the current plan before launch. A production news business should budget for backups, traffic, email, storage and operations. Vercel Hobby is described as personal/noncommercial, so do not assume it covers an advertisement-supported business. Select an eligible commercial plan or another host with compatible terms. Domain and production services may cost money even when the IDE is free.

## 16. Launch acceptance criteria

- Admin can invite staff and recover access; authors cannot change roles, edit another author's drafts, or publish through REST bypass.
- Editors can publish; scheduling and unpublishing affect feeds, article URLs, RSS/sitemaps and caches correctly.
- Draft content and private media are not exposed through public API, storage paths or shared cached responses.
- Approved ad configuration changes affect the correct placements; mobile layouts have no horizontal overflow; slow/blocked/no-fill ads do not block reading.
- Repeated client navigation does not duplicate GPT slots or leave the previous article's targeting.
- Google reports match the authorized console for the same date, timezone, currency, filter and compatible metric definition, allowing documented reporting lag.
- Missing permissions, disconnected accounts and failed syncs show clear states. No demo statistics appear as live data.
- Latest stable Chrome, Edge, Firefox, Safari, iOS Safari and Android Chrome tested; keyboard navigation, visible focus and touch controls checked.
- Explicit `npm run build`, TypeScript and configured lint checks pass. Inspect actual generated scripts; do not assume `next lint` exists.
- Restore a backup in staging; document secrets, scheduler ownership, deployment rollback and log retention.

## 17. Official implementation references

Consult current documentation at each integration milestone:

- Next.js installation: https://nextjs.org/docs/app/getting-started/installation
- Supabase Next.js SSR: https://supabase.com/docs/guides/auth/server-side/nextjs
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase pricing: https://supabase.com/pricing
- Google Publisher Tag setup: https://developers.google.com/publisher-tag/guides/get-started
- GPT React sample: https://developers.google.com/publisher-tag/samples/integrations/react
- Ad Manager reporting: https://developers.google.com/ad-manager/api/reporting
- Ad Manager REST beta: https://developers.google.com/ad-manager/api/beta
- CM360 trafficking overview: https://developers.google.com/doubleclick-advertisers/guides/trafficking_overview
- CM360 API: https://developers.google.com/doubleclick-advertisers/rest/
- VS Code Copilot setup: https://code.visualstudio.com/docs/copilot/setup
- Continue + Ollama: https://docs.continue.dev/guides/ollama-guide
- Vercel Hobby terms: https://vercel.com/docs/plans/hobby

Implementation status at delivery: PRD and illustrative foundation code prepared. No live Supabase project, Google account connection, deployed website or completed application is claimed. Run the milestone checks in the actual project before production.


## 18. Socialoptical.in homepage design specification

Brand/domain: **Socialoptical / socialoptical.in**, corrected spelling confirmed by the owner. Tagline: “A sharper view of your world.” Fresh concept; existing domain content could not be retrieved during preparation, so no existing news, logo or content migration is claimed.

Visual system: warm off-white #f8f8f3; deep green-black #151a17; lime #d6f46b; muted olive dividers. Manrope headings and DM Sans text with system fallbacks. Desktop max content width 1320px; 18px mobile gutters; strong editorial grid with a 300px desktop ad rail. Breakpoints: 600px and 850px, with intermediate adjustment at 1100px. Design should use clear publication typography, readable story hierarchy and mobile-native touch controls.

Homepage section sequence:

1. Compact utility bar: publication statement, edition and advertising link.
2. Masthead, search, theme switch and newsletter preview.
3. Scrollable topic navigation and an editorial focus strip.
4. Responsive sample billboard (970×250 desktop target); 320×100 mobile alternative. The concept uses a shorter scaled billboard at intermediate widths, labelled as a preview. Production must request actual mapped supported sizes, not scale a Google iframe.
5. The Big Picture: one large image-led story, two secondary stories, 300×250 sample and newsletter panel.
6. Four numbered story recommendations.
7. Latest story grid alongside a 300×600 half-page sample on desktop.
8. 728×90 sample between content rows; 320×100 responsive alternative on mobile.
9. Editor’s feature selection on a deep green background.
10. Ad Format Studio with all listed sample sizes, category filters and actual-dimension inspection dialogs.
11. Footer with publication, advertising and policy links.

All size catalog (CSS pixels):

| Group | Sample sizes |
|---|---|
| Desktop horizontal | 970×250, 970×90, 728×90, 468×60, 234×60 |
| Rectangles/squares | 300×250, 336×280, 250×250, 200×200, 180×150, 125×125 |
| Tall | 300×600, 160×600, 120×600, 300×1050, 120×240 |
| Mobile | 320×100, 320×50 |
| Regional reference only | 240×400, 980×120, 250×360, 930×180, 580×400, 750×300, 750×200, 750×100 |

These are the 26 fixed formats in the referenced Google AdSense size guide, not every possible Google Ad Manager custom size or every Google ad product. Regional availability is provider/country-specific and must not be represented as generally available to this Indian publication. Responsive, native/in-feed and video inventory are distinct capabilities, not additional fixed pixel sizes. The gallery may be available on a design-review mode or `/advertise` in production to keep the reader homepage focused; the updated concept keeps it in an optional advertiser dialog.

Prototype behavior: category filtering, sample-story search, article preview dialogs, theme switching, format filtering, actual-size inspection and a browser-local show/hide sample-placements control. Newsletter signup is explicitly a non-submitting design preview. Production authentication, real article CRUD, Google delivery and reports are future implementation milestones, not functional features of the static design.

Assets in the concept are illustrative external Unsplash images and Google Fonts. Verify asset licensing, credits and availability, then self-host approved assets where appropriate. Sample articles are clearly labelled and do not assert current news events.

Additional acceptance: actual Google creatives must retain supported dimensions; do not CSS-scale live ad iframes. Regional sizes are labelled in the gallery. No ad click overlays, fake Google endorsement, fake revenue, or ad requests in the design prototype. Test all displayed sizes for small-screen overflow and keep actual-size inspection scrolling inside its dialog.


## 19. Confirmed revision — news-integrated advertising

Correct brand: Socialoptical. Correct domain: https://socialoptical.in/.
The revised homepage starts with news instead of a large pre-content billboard.
A leaderboard follows the lead stories and recommendations. A clearly labelled
300×250 sample is inserted among latest-news cards; mobile gives it a full row.
The desktop sidebar retains contextual rectangle/half-page placements. Article
preview content includes a separate labelled 300×250 sample between text blocks.
The full 26-size catalogue is available from Advertise links in an optional dialog,
rather than displayed as the homepage's main feature. Keep the initial layout and
size catalogue in section 18 as design history; this revision takes precedence.


## 20. Final ad size decision — 300 × 250 only

This decision supersedes every earlier ad-size list and multi-format layout.
Use only fixed 300 × 250 CSS pixel medium rectangles for Socialoptical.
Placement priorities: beside lead news, between latest-news rows, in the desktop
sidebar, and within long article content. Mobile uses centered in-flow units
with no scaling of live Google creatives. Desktop sidebar may remain sticky
within its section; it must never overlay the article, navigation or footer.
Use one size in GPT mappings and placement validation: [300,250]. Reject other
sizes in the production admin. Remove the all-size gallery from the reader page;
the optional advertiser dialog shows only the chosen format. Never promise
100% viewability: actual visibility is measured after real ad integration.
Retain clear Advertisement labels, appropriate content spacing, and lazy-load
below-fold slots near the viewport. No auto-refresh is introduced. This static
preview still generates no Google ad impressions.
