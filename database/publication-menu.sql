alter table public.cms_terms add column if not exists menu_label text;
alter table public.cms_terms add column if not exists menu_position integer;
alter table public.cms_terms add column if not exists menu_group text;
insert into public.cms_terms(kind,name,slug) values
('category','Chandigarh','chandigarh'),('category','Uttar Pradesh','uttar-pradesh'),
('category','Himachal','himachal'),('category','Entertainment','entertainment'),
('category','Lifestyle','lifestyle'),('category','Religion','religion')
on conflict(kind,slug) do nothing;
update public.cms_terms t set menu_label=v.label,menu_position=v.position,menu_group=v.group_name
from (values
('national','देश',1,'main'),('punjab','पंजाब',2,'main'),('chandigarh','चंडीगढ़',3,'main'),
('delhi','दिल्ली',4,'main'),('haryana','हरियाणा',5,'main'),('uttar-pradesh','उत्तर प्रदेश',6,'main'),
('himachal','हिमाचल',7,'main'),('international','विदेश',8,'main'),('entertainment','मनोरंजन',9,'main'),
('business-news','बिज़नेस',10,'main'),('lifestyle','लाइफस्टाइल',11,'main'),
('health-and-fitness','सेहत',12,'lifestyle'),('blog','ब्लॉग',13,'more'),
('sports-news','खेल',14,'more'),('weather','मौसम',15,'more'),('religion','धर्म',16,'more'),
('politics','राजनीति',17,'more'),('technology-news','टेक्नोलॉजी',18,'more')
) as v(slug,label,position,group_name) where t.kind='category' and t.slug=v.slug;
alter policy cms_terms_public on public.cms_terms using
(kind='category' or exists(select 1 from public.cms_post_terms pt join public.cms_posts p on p.id=pt.post_id where pt.term_id=cms_terms.id and p.status='publish' and p.published_at<=now()));
