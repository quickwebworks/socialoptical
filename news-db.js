const main=document.getElementById('databaseNews');
let currentPage=0,activeTerms=[],busy=false,homeGeneration=0;
const query=new URLSearchParams(location.search),category=query.get('category'),tag=query.get('tag'),postId=query.get('post');
const PAGE_SIZE=24,fields='id,title,slug,excerpt,featured_image_url,published_at,cms_post_terms(cms_terms(id,name,slug,kind))';
function escapeHTML(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function textOnly(html){return new DOMParser().parseFromString(String(html||''),'text/html').body.textContent||''}
function webURL(value){try{const u=new URL(value);return ['http:','https:'].includes(u.protocol)?u.href:null}catch{return null}}
function terms(p,kind){return (p.cms_post_terms||[]).map(x=>x.cms_terms).filter(t=>t?.kind===kind)}
function termLink(t){return '/?'+(t.kind==='tag'?'tag':'category')+'='+encodeURIComponent(t.slug)}
function postLink(p){return '/?post='+encodeURIComponent(p.id)}
function ad(placement='feed'){return window.renderAdMarkup(placement)}
function formatDate(date){return date?new Date(date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):''}
function age(date){if(!date)return '';const days=Math.max(0,Math.floor((Date.now()-new Date(date).getTime())/86400000));if(days===0)return 'Today';if(days===1)return '1 day ago';return days<31?days+' days ago':formatDate(date)}
function metadata(p){const t=terms(p,'category')[0];return '<div class="story-meta">'+(t?'<a href="'+termLink(t)+'">'+escapeHTML(t.name)+'</a><span class="divider">/</span>':'')+'<time datetime="'+escapeHTML(p.published_at||'')+'">'+escapeHTML(age(p.published_at))+'</time></div>'}
function imageMarkup(p,eager=false){const image=webURL(p.featured_image_url);return '<a class="story-image" href="'+postLink(p)+'" tabindex="-1" aria-hidden="true">'+(image?'<img '+(eager?'fetchpriority="high"':'loading="lazy"')+' src="'+escapeHTML(image)+'" alt="" onerror="this.hidden=true;this.parentElement.classList.add(\'no-image\');this.parentElement.textContent=\'Socialoptical\'">':'<div class="no-image">Socialoptical</div>')+'</a>'}
function newsCard(p){return '<article class="story-card">'+imageMarkup(p)+'<div>'+metadata(p)+'<h3><a href="'+postLink(p)+'">'+escapeHTML(textOnly(p.title))+'</a></h3><p>'+escapeHTML(textOnly(p.excerpt).slice(0,190))+'</p></div></article>'}
function compactCard(p){return '<article class="compact-story">'+imageMarkup(p)+'<div>'+metadata(p)+'<h3><a href="'+postLink(p)+'">'+escapeHTML(textOnly(p.title))+'</a></h3></div></article>'}
function leadCard(p,i){return '<article class="lead-story">'+imageMarkup(p,i===0)+'<div class="lead-copy">'+metadata(p)+'<h2><a href="'+postLink(p)+'">'+escapeHTML(textOnly(p.title))+'</a></h2>'+(p.excerpt?'<p>'+escapeHTML(textOnly(p.excerpt).slice(0,170))+'</p>':'')+'</div></article>'}
function rankedCard(p,i){return '<article class="ranked-story">'+imageMarkup(p)+'<div class="ranked-copy"><span class="rank-number">'+(i+1)+'</span><div>'+metadata(p)+'<h3><a href="'+postLink(p)+'">'+escapeHTML(textOnly(p.title))+'</a></h3></div></div></article>'}
const sourceMenu=[['National','national','देश','main'],['Punjab','punjab','पंजाब','main'],['Chandigarh','chandigarh','चंडीगढ़','main'],['Delhi','delhi','दिल्ली','main'],['Haryana','haryana','हरियाणा','main'],['Uttar Pradesh','uttar-pradesh','उत्तर प्रदेश','main'],['Himachal','himachal','हिमाचल','main'],['international','international','विदेश','main'],['Entertainment','entertainment','मनोरंजन','main'],['Business','business-news','बिज़नेस','main'],['Lifestyle','lifestyle','लाइफस्टाइल','main'],['Health and Fitness','health-and-fitness','सेहत','lifestyle'],['Blog','blog','ब्लॉग','more'],['Sports','sports-news','खेल','more'],['Weather','weather','मौसम','more'],['Religion','religion','धर्म','more'],['Politics','politics','राजनीति','more'],['Technology','technology-news','टेक्नोलॉजी','more']];
function menuTerm(t){if(t.kind!=='category'||t.menu_position!=null)return t;const i=sourceMenu.findIndex(([name,slug,label])=>t.slug===slug||[name,label].some(n=>n.toLowerCase()===t.name.toLowerCase()));return i<0?t:{...t,menu_label:sourceMenu[i][2],menu_position:i+1,menu_group:sourceMenu[i][3]}}

async function loadTerms(){
 activeTerms=await SocialDB.request('/rest/v1/cms_terms?select=id,kind,name,slug,menu_label,menu_position,menu_group&order=name&limit=1000');
 const aliases={'world':'international','health':'health-and-fitness','religious':'religion','himachal pradesh':'himachal'};
 activeTerms=activeTerms.map(t=>{const alias=aliases[t.name.toLowerCase()];if(t.kind==='category'&&alias&&t.menu_position==null){const i=sourceMenu.findIndex(x=>x[1]===alias);if(i>=0)return {...t,menu_label:sourceMenu[i][2],menu_position:i+1,menu_group:sourceMenu[i][3]}}return menuTerm(t)});
 const link=t=>'<a class="'+(category===t.slug?'selected':'')+'" href="'+termLink(t)+'">'+escapeHTML(t.menu_label||t.name)+'</a>';
 const menu=activeTerms.filter(t=>t.kind==='category'&&t.menu_position!=null).sort((a,b)=>a.menu_position-b.menu_position).filter((t,i,all)=>all.findIndex(x=>x.menu_position===t.menu_position)===i);
 const more=menu.filter(t=>t.menu_group==='more');
 document.getElementById('navigation').innerHTML='<a class="'+(!category&&!tag&&!postId?'selected':'')+'" href="/">होम</a>'+menu.filter(t=>t.menu_group==='main').map(t=>t.slug==='lifestyle'?'<details class="nav-dropdown"><summary>'+escapeHTML(t.menu_label)+'</summary><div>'+link(t)+menu.filter(t=>t.menu_group==='lifestyle').map(link).join('')+'</div></details>':link(t)).join('')+(more.length?'<details class="nav-dropdown"><summary>More</summary><div>'+more.map(link).join('')+'</div></details>':'');
 document.getElementById('menuPanel').innerHTML='<a href="/">होम</a>'+menu.map(link).join('');
 document.getElementById('footerCategories').innerHTML=menu.slice(0,10).map(link).join('');
 const topic=document.getElementById('topicLinks');if(topic)topic.innerHTML=activeTerms.filter(t=>t.kind==='tag').slice(0,24).map(t=>'<a class="chip" href="'+termLink(t)+'">#'+escapeHTML(t.name)+'</a>').join('');
}
async function queryPosts({term=null,search='',offset=0,limit=PAGE_SIZE}={}){
 const params=new URLSearchParams({select:fields,status:'eq.publish',published_at:'lte.'+new Date().toISOString(),order:'published_at.desc,id',limit:String(limit),offset:String(offset)});
 if(search)params.set('title','ilike.*'+search.replace(/[*,()]/g,'')+'*');
 if(term){params.set('select','id,published_at,cms_post_terms!inner(cms_terms!inner(slug,kind))');params.set('cms_post_terms.cms_terms.slug','eq.'+term.slug);params.set('cms_post_terms.cms_terms.kind','eq.'+term.kind)}
 let posts=await SocialDB.request('/rest/v1/cms_posts?'+params);
 if(term&&posts.length){const details=new URLSearchParams({select:fields,id:'in.('+posts.map(p=>p.id).join(',')+')',order:'published_at.desc,id'});posts=await SocialDB.request('/rest/v1/cms_posts?'+details)}return posts;
}
function renderHomeTop(posts){
 const top=document.getElementById('homeTop');top.hidden=!posts.length;
 document.getElementById('leadPosts').innerHTML=posts.slice(0,3).map(leadCard).join('');
 const breaking=posts.filter(p=>terms(p,'category').some(t=>/breaking/i.test(t.name)));
 document.getElementById('trendingPosts').innerHTML=(breaking.length>=3?breaking:posts.slice(3)).slice(0,5).map(rankedCard).join('');
 document.getElementById('latestPosts').innerHTML=posts.slice(3,9).map(compactCard).join('');
 document.getElementById('sideLatest').innerHTML=posts.slice(0,5).map(compactCard).join('');
 document.getElementById('homepageAdSlot').innerHTML=ad('lead_sidebar');
 document.getElementById('sidebarAdSlot').innerHTML=ad('article_sidebar');
}
async function loadCategorySections(generation){
 const groups=[['National news',['national']],['World',['international','world']],['Business',['business','business-news']]];
 const blocks=await Promise.all(groups.map(async([label,slugs])=>{const term=activeTerms.find(t=>t.kind==='category'&&(slugs.includes(t.slug)||slugs.includes(t.name.toLowerCase())));if(!term)return '';try{const posts=await queryPosts({term,limit:4});if(!posts.length)return '';const first=posts[0];return '<section class="category-block"><h2 class="section-label"><span>'+label+'</span></h2><article class="feature-card">'+imageMarkup(first)+metadata(first)+'<h3><a href="'+postLink(first)+'">'+escapeHTML(textOnly(first.title))+'</a></h3></article>'+posts.slice(1).map(compactCard).join('')+'<a class="category-more" href="'+termLink(term)+'">More '+label+' →</a></section>'}catch{return ''}}));
 if(generation===homeGeneration)document.getElementById('categorySections').innerHTML=blocks.join('');
}
async function loadFeed(append=false){
 if(busy)return;busy=true;
 try{
  const search=document.getElementById('search').value.trim();const isHome=!category&&!tag&&!search;
  if(!append){currentPage=0;homeGeneration++;document.getElementById('homeTop').hidden=true;document.getElementById('categorySections').innerHTML='';document.getElementById('livePosts').innerHTML='<p class="empty">Loading stories…</p>'}
  const term=(category||tag)?activeTerms.find(t=>t.kind===(tag?'tag':'category')&&t.slug===(tag||category)):null;
  const heading=document.getElementById('feedHeading');heading.hidden=isHome;heading.textContent=term?(tag?'#':'')+(term.menu_label||term.name):(search?'Search: '+search:'');
  document.getElementById('moreHeading').hidden=!isHome;
  if((category||tag)&&!term){renderEmpty('No stories are linked to this category or tag yet.');return}
  if(term)document.title=term.name+' — Socialoptical';
  const posts=await queryPosts({term,search,offset:currentPage*PAGE_SIZE});
  if(!posts.length&&!append){renderEmpty('No published stories match this selection yet.');return}
  const grid=document.getElementById('livePosts');if(!append)grid.innerHTML='';
  let feedPosts=posts;
  if(isHome&&!append&&posts.length>=4){renderHomeTop(posts);feedPosts=posts.slice(3);loadCategorySections(homeGeneration).catch(()=>{})}
  else if(!append){document.getElementById('sideLatest').innerHTML=posts.slice(0,5).map(compactCard).join('');document.getElementById('sidebarAdSlot').innerHTML=ad('article_sidebar')}
  feedPosts.forEach((p,i)=>{grid.insertAdjacentHTML('beforeend',newsCard(p));if(i===5)grid.insertAdjacentHTML('beforeend',ad('feed'))});
  document.getElementById('loadMore').hidden=posts.length<PAGE_SIZE;document.getElementById('feedState').textContent='';currentPage++;
 }catch(e){renderEmpty('Could not load stories: '+e.message)}finally{busy=false}
}
function renderEmpty(message){document.getElementById('homeTop').hidden=true;document.getElementById('categorySections').innerHTML='';document.getElementById('livePosts').innerHTML='<div class="db-empty"><p>'+escapeHTML(message)+'</p></div>';document.getElementById('loadMore').hidden=true;document.getElementById('feedState').textContent=''}
async function showArticle(){if(!/^[0-9a-f-]{36}$/i.test(postId)){main.innerHTML='<p class="empty">Article not found.</p>';return}try{const posts=await SocialDB.request('/rest/v1/cms_posts?select=*,cms_post_terms(cms_terms(id,name,slug,kind))&id=eq.'+encodeURIComponent(postId)+'&limit=1');const p=posts[0];if(!p){main.innerHTML='<p class="empty">Article not found or not published.</p>';return}document.title=(p.seo_title||textOnly(p.title))+' — Socialoptical';if(p.seo_description)document.querySelector('meta[name=description]').content=p.seo_description;const image=webURL(p.featured_image_url);main.innerHTML='<div class="article-layout"><article class="article-page"><a class="category" href="/">← All news</a><div class="category" style="margin-top:24px">'+terms(p,'category').map(t=>'<a href="'+termLink(t)+'">'+escapeHTML(t.name)+'</a>').join(' · ')+'</div><h1>'+escapeHTML(textOnly(p.title))+'</h1><p class="meta">'+escapeHTML(formatDate(p.published_at))+'</p>'+(image?'<img class="article-hero" src="'+escapeHTML(image)+'" alt="'+escapeHTML(textOnly(p.title))+'">':'')+'<div id="articleBody" class="article-body"></div><div class="tag-links">'+terms(p,'tag').map(t=>'<a class="chip" href="'+termLink(t)+'">#'+escapeHTML(t.name)+'</a>').join(' ')+'</div></article><aside class="article-rail">'+ad('article_sidebar')+'</aside></div>';
 const body=document.getElementById('articleBody');body.appendChild(safeArticle(p.content_html));const blocks=body.querySelectorAll(':scope > p');if(blocks.length>=4)blocks[2].insertAdjacentHTML('afterend',ad('article_inline'));}catch(e){main.innerHTML='<p class="empty">'+escapeHTML(e.message)+'</p>'}}

function toggleSearch(){const bar=document.getElementById('searchbar');bar.hidden=!bar.hidden;if(!bar.hidden)document.getElementById('search').focus()}
function toggleMenu(){const panel=document.getElementById('menuPanel');panel.hidden=!panel.hidden;document.querySelector('.menu-toggle').setAttribute('aria-expanded',String(!panel.hidden))}
function clearSearch(){document.getElementById('search').value='';if(postId)location.href='/';else loadFeed()}
let searchDelay;document.getElementById('search').addEventListener('input',()=>{clearTimeout(searchDelay);searchDelay=setTimeout(()=>{if(!postId)loadFeed()},400)});
(async()=>{try{await Promise.all([loadPublicAds(),loadTerms().catch(e=>{document.getElementById('navigation').innerHTML='<a href="/">होम</a>';document.getElementById('navigation').title='Categories unavailable: '+e.message})]);if(postId)await showArticle();else await loadFeed()}catch(e){if(!postId)renderEmpty(e.message);else main.textContent='Unable to load this article.'}})();
async function refreshPublication(){if(postId||busy)return;try{await loadTerms()}catch{}await loadFeed()}
window.addEventListener('pageshow',e=>{if(e.persisted)refreshPublication()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshPublication()});
window.addEventListener('storage',e=>{if(e.key==='socialoptical-publication-updated')refreshPublication()});
