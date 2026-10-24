# Live ads and editor accounts

## Google delivery

Public slots now load official Google Publisher Tag once and use their saved ad-unit paths, unique IDs and fixed 300 × 250 dimensions. The optional targeting key is `socialoptical_placement`. Raw pasted header/body scripts remain admin-only and are not executed.

Slots request once when within 600 pixels of the viewport. Removed slots are destroyed; empty responses collapse. Returning to a tab alone does not recreate ads. The admin preview makes no paid ad requests.

When an IAB TCF CMP exists before `ads-render.js` loads, GPT uses the standard URL and CMP signals. Otherwise it uses Google's limited-ad URL with `limitedAds: true`. No certified CMP was installed. Limited-ad fill requires eligible demand/creatives; this mode is not a claim of universal legal compliance.

Use `window.SocialAds.diagnostics()` for library and slot states. Google Publisher Console and Google Ad Manager provide campaign diagnostics and reporting. Revenue reporting is not integrated into this admin panel. Ad blockers, targeting and unavailable creatives can still prevent delivery.

Run `node tests/google-delivery.cjs`. Browser verification rendered a real Google test-inventory ad and observed its viewability event.

## Editor-only login

Use `/editor/` or `/editor`. It shares Supabase email/password authentication, but shows only Posts, Add post and personal status counts.

`database/editor-role.sql` has already been applied to the connected project. For a new installation, apply it after the original publication/editor setup scripts. Create the intended account in Supabase Authentication, then assign its actual Auth UUID in SQL Editor:

```sql
insert into public.cms_editors(user_id)
values ('REPLACE_WITH_THE_AUTH_USER_UUID'::uuid)
on conflict do nothing;
```

Do not add a restricted editor to `cms_admins`. Membership in both tables still grants administrator privileges. No new editor account or password was created by this update. Role grants are not available to the public client.

Editors can create, edit, schedule and publish their own posts, choose existing categories, add tags and upload images under their own `editors/<user-id>/` prefix. PostgreSQL RLS and the save RPC prevent changes to another owner's posts, category names, ads, imports and roles. Old imported rows remain unassigned. Admin access remains publication-wide. Local draft recovery is scoped to the signed-in account.

Database role tests ran in a rolled-back transaction and checked own-post creation/publication and denied foreign edits, import, ad updates and privilege escalation. Run `node tests/admin-overview.cjs` for count-query checks.

## Source synchronization

Automatic source sync is now scheduled every five minutes. See AUTOMATIC-SYNC.md for authentication, retry behavior, RSS fallback limitations and how to monitor it.
