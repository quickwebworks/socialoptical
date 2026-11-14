begin;
alter table public.cms_ad_units drop constraint if exists cms_ad_units_placement_check;
alter table public.cms_ad_units add constraint cms_ad_units_placement_check
 check(placement in ('lead_sidebar','lead_sidebar_second','feed','article_sidebar','article_inline'));
insert into public.cms_ad_units(placement,name,provider,enabled,width,height,image_url,target_url,ad_unit_path,label,starts_at,ends_at)
select 'lead_sidebar_second','Homepage second sidebar ad',provider,enabled,300,250,image_url,target_url,ad_unit_path,label,starts_at,ends_at from public.cms_ad_units where placement='lead_sidebar'
on conflict(placement) do nothing;
insert into public.cms_ad_tags(placement,header_code,body_code)
select 'lead_sidebar_second',header_code,body_code from public.cms_ad_tags where placement='lead_sidebar'
on conflict(placement) do nothing;
commit;
select placement,name,provider,enabled,width,height,ends_at from public.cms_ad_units where placement in ('lead_sidebar','lead_sidebar_second') order by placement;