-- Accept stable IDs from the current EarlyNews24 CMS. Existing WordPress IDs remain valid.
create or replace function public.cms_sync_batch(run_uuid uuid,records jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare r jsonb;t jsonb; pid uuid; tid uuid; existing_hash text; candidates integer; n integer:=0; ins integer:=0; upd integer:=0; begin
 perform 1 from cms_sync_private.settings where source='earlynews24' and run_id=run_uuid and lease_until>now() for update;
 if not found then raise exception 'No active sync lease'; end if;
 if jsonb_typeof(records)<>'array' or jsonb_array_length(records)>25 then raise exception 'Maximum 25 records'; end if;
 for r in select value from jsonb_array_elements(records) loop
  if r->>'source_id' !~ '^(\d+|cms-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$' or coalesce(r->>'title','')='' or coalesce(r->>'content_hash','')='' then raise exception 'Invalid post'; end if;
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
