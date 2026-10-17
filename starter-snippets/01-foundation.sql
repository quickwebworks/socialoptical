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
