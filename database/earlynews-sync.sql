-- Dedicated machine access; public clients can read status only when publication admins.
create schema if not exists cms_sync_private;
revoke all on schema cms_sync_private from public,anon,authenticated;
grant usage on schema cms_sync_private to service_role;
create table if not exists cms_sync_private.settings (
 source text primary key, token_hash text not null, watermark timestamptz not null,
 lease_until timestamptz, run_id uuid
);
alter table cms_sync_private.settings enable row level security;
create policy sync_service on cms_sync_private.settings for all to service_role using(true) with check(true);
grant all on cms_sync_private.settings to service_role;
create table public.cms_sync_runs (
 id uuid primary key, source text not null, started_at timestamptz not null default now(), finished_at timestamptz,
 status text not null check(status in ('running','success','error')), mode text,
 processed integer not null default 0, inserted integer not null default 0, updated integer not null default 0,
 error text, warning text
);
alter table public.cms_sync_runs enable row level security;
revoke all on public.cms_sync_runs from public,anon,authenticated;
grant select on public.cms_sync_runs to authenticated;
grant all on public.cms_sync_runs to service_role;
create policy sync_admin_read on public.cms_sync_runs for select to authenticated using(exists(select 1 from public.cms_admins where user_id=(select auth.uid())));
create policy sync_service on public.cms_sync_runs for all to service_role using(true) with check(true);
create index cms_sync_runs_started on public.cms_sync_runs(started_at desc);
create table cms_sync_private.post_map (
 source_id text primary key, post_id uuid not null unique references public.cms_posts(id) on delete cascade,
 content_hash text not null, source_modified_at timestamptz
);
alter table cms_sync_private.post_map enable row level security;
create policy sync_service on cms_sync_private.post_map for all to service_role using(true) with check(true);
grant all on cms_sync_private.post_map to service_role;
-- Token is generated inside PostgreSQL, stored encrypted in Vault, and never returned.
do $$ declare secret text:=encode(extensions.gen_random_bytes(32),'hex'); begin
 perform vault.create_secret(secret,'earlynews24_sync_token');
 insert into cms_sync_private.settings(source,token_hash,watermark)
 values('earlynews24',encode(extensions.digest(secret,'sha256'),'hex'),coalesce((select max(published_at)-interval '1 day' from public.cms_posts),now()-interval '90 days'));
end $$;
create function public.cms_sync_start(sync_token text) returns jsonb language plpgsql security invoker set search_path='' as $$
declare s cms_sync_private.settings; rid uuid:=gen_random_uuid(); begin
 select * into s from cms_sync_private.settings where source='earlynews24' for update;
 if s.token_hash is distinct from encode(extensions.digest(sync_token,'sha256'),'hex') then raise exception 'Unauthorized' using errcode='42501'; end if;
 if s.lease_until>now() then return jsonb_build_object('busy',true); end if;
 update public.cms_sync_runs set status='error',finished_at=now(),error='Previous run exceeded its lease; retrying safely.' where status='running' and source='earlynews24';
 insert into public.cms_sync_runs(id,source,status) values(rid,'earlynews24','running');
 update cms_sync_private.settings set run_id=rid,lease_until=now()+interval '4 minutes' where source='earlynews24';
 return jsonb_build_object('run_id',rid,'watermark',s.watermark);
end $$;
create function public.cms_sync_batch(run_uuid uuid,records jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare r jsonb;t jsonb; pid uuid; tid uuid; existing_hash text; candidates integer; n integer:=0; ins integer:=0; upd integer:=0; begin
 perform 1 from cms_sync_private.settings where source='earlynews24' and run_id=run_uuid and lease_until>now() for update;
 if not found then raise exception 'No active sync lease'; end if;
 if jsonb_typeof(records)<>'array' or jsonb_array_length(records)>25 then raise exception 'Maximum 25 records'; end if;
 for r in select value from jsonb_array_elements(records) loop
  if r->>'source_id' !~ '^\d+$' or coalesce(r->>'title','')='' or coalesce(r->>'content_hash','')='' then raise exception 'Invalid post'; end if;
  pid:=null;existing_hash:=null;
  select m.post_id,m.content_hash into pid,existing_hash from cms_sync_private.post_map m where m.source_id=r->>'source_id';
  if pid is null then
   select p.id into pid from public.cms_posts p where p.source_origin='https://earlynews24.com' and p.source_id=r->>'source_id';
  end if;
  -- The old SQL import relabelled origins. Match unowned imported rows by both source ID and slug.
  if pid is null then
   select count(*) into candidates from public.cms_posts p where p.source_origin='https://socialoptical.in' and p.slug=r->>'slug' and p.created_by is null and p.source_id=r->>'source_id';
   if candidates=1 then select p.id into pid from public.cms_posts p where p.source_origin='https://socialoptical.in' and p.slug=r->>'slug' and p.created_by is null and p.source_id=r->>'source_id'; end if;
  end if;
  if existing_hash is not distinct from r->>'content_hash' then n:=n+1;continue;end if;
  if pid is null then
   insert into public.cms_posts(source_origin,source_id,slug,title,excerpt,content_html,featured_image_url,status,published_at)
   values('https://earlynews24.com',r->>'source_id',r->>'slug',r->>'title',coalesce(r->>'excerpt',''),coalesce(r->>'content_html',''),nullif(r->>'featured_image_url',''),'publish',(r->>'published_at')::timestamptz) returning id into pid;ins:=ins+1;
  else
   update public.cms_posts set title=r->>'title',excerpt=coalesce(r->>'excerpt',''),content_html=coalesce(r->>'content_html',''),featured_image_url=nullif(r->>'featured_image_url',''),published_at=(r->>'published_at')::timestamptz,imported_at=now() where id=pid;upd:=upd+1;
   -- Local draft/private status, owner, slug and SEO overrides are preserved.
  end if;
  delete from public.cms_post_terms where post_id=pid;
  for t in select value from jsonb_array_elements(coalesce(r->'taxonomy','[]'::jsonb)) loop
   if t->>'kind' not in ('category','tag') or coalesce(t->>'slug','')='' or coalesce(t->>'name','')='' then continue;end if;
   insert into public.cms_terms(kind,name,slug) values(t->>'kind',t->>'name',t->>'slug') on conflict(kind,slug) do update set name=excluded.name returning id into tid;
   insert into public.cms_post_terms(post_id,term_id) values(pid,tid) on conflict do nothing;
  end loop;
  insert into cms_sync_private.post_map(source_id,post_id,content_hash,source_modified_at) values(r->>'source_id',pid,r->>'content_hash',(r->>'modified_at')::timestamptz) on conflict(source_id) do update set content_hash=excluded.content_hash,source_modified_at=excluded.source_modified_at;
  n:=n+1;
 end loop;
 update public.cms_sync_runs set processed=processed+n,inserted=inserted+ins,updated=updated+upd where id=run_uuid;
 return jsonb_build_object('processed',n,'inserted',ins,'updated',upd);
end $$;
create function public.cms_sync_finish(run_uuid uuid,succeeded boolean,sync_mode text,new_watermark timestamptz,error_message text default null) returns void language plpgsql security invoker set search_path='' as $$
begin
 perform 1 from cms_sync_private.settings where source='earlynews24' and run_id=run_uuid for update;
 if not found then raise exception 'Unknown sync run';end if;
 update public.cms_sync_runs set status=case when succeeded then 'success' else 'error' end,finished_at=now(),mode=sync_mode,error=case when not succeeded then left(error_message,1000) end,warning=case when succeeded then left(error_message,1000) end where id=run_uuid;
 update cms_sync_private.settings set watermark=case when succeeded then greatest(watermark,coalesce(new_watermark,watermark)) else watermark end,run_id=null,lease_until=null where source='earlynews24';
end $$;
revoke all on function public.cms_sync_start(text),public.cms_sync_batch(uuid,jsonb),public.cms_sync_finish(uuid,boolean,text,timestamptz,text) from public,anon,authenticated;
grant execute on function public.cms_sync_start(text),public.cms_sync_batch(uuid,jsonb),public.cms_sync_finish(uuid,boolean,text,timestamptz,text) to service_role;
