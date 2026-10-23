-- Categories omitted by a content-only import because they currently have no posts.
-- Existing post relationships and existing category rows are retained.
insert into public.cms_terms(kind,name,slug,menu_label,menu_position,menu_group) values
('category','Uttar Pradesh','uttar-pradesh','उत्तर प्रदेश',6,'main'),
('category','Himachal','himachal','हिमाचल',7,'main'),
('category','Entertainment','entertainment','मनोरंजन',9,'main'),
('category','Lifestyle','lifestyle','लाइफस्टाइल',11,'main'),
('category','Health','health','सेहत',12,'lifestyle'),
('category','Religion','religion','धर्म',16,'more')
on conflict(kind,slug) do nothing;
