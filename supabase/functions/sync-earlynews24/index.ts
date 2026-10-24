import {ORIGIN,feedItems,articleMetadata,clean,plain,safeURL,sourceURL,hashRecord} from './core.ts';
const project=Deno.env.get('SUPABASE_URL')!;const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
async function rpc(name:string,body:unknown){const r=await fetch(project+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:serviceKey,Authorization:'Bearer '+serviceKey,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Database operation failed: '+name+' ('+r.status+')');return r.status===204?null:await r.json();}
async function get(url:string,timeout=12000){sourceURL(url);const r=await fetch(url,{signal:AbortSignal.timeout(timeout),redirect:'error'});if(!r.ok)throw Error('EarlyNews24 '+new URL(url).pathname+' HTTP '+r.status);const t=await r.text();if(t.length>6000000)throw Error('Source response too large');return {text:t,headers:r.headers};}
async function normalizedRest(p:any){if(!Number.isInteger(p.id)||p.status!=='publish')throw Error('Invalid source post');const taxonomy:any[]=[];for(const group of p._embedded?.['wp:term']||[])for(const t of group){if(!['category','post_tag'].includes(t.taxonomy))continue;taxonomy.push({kind:t.taxonomy==='category'?'category':'tag',slug:t.slug,name:plain(t.name)});}if(!taxonomy.length)throw Error('Missing embedded taxonomy');const date=(s:string)=>new Date(s.endsWith('Z')?s:s+'Z').toISOString();return {source_id:String(p.id),slug:p.slug,title:plain(p.title.rendered),excerpt:plain(p.excerpt.rendered).slice(0,1200),content_html:clean(p.content.rendered),featured_image_url:(p._embedded?.['wp:featuredmedia']?.[0]?.source_url?safeURL(p._embedded['wp:featuredmedia'][0].source_url):null),published_at:date(p.date_gmt),modified_at:date(p.modified_gmt),taxonomy};}
async function batch(run:string,records:any[]){for(let i=0;i<records.length;i+=25){const data=[];for(const record of records.slice(i,i+25))data.push({...record,content_hash:await hashRecord(record)});await rpc('cms_sync_batch',{run_uuid:run,records:data});}}
Deno.serve(async req=>{if(req.method!=='POST')return new Response('Method not allowed',{status:405});const token=req.headers.get('x-sync-token');if(!token||token.length!==64)return new Response('Unauthorized',{status:401});let start;try{start=await rpc('cms_sync_start',{sync_token:token});}catch{return new Response('Unauthorized',{status:401})}if(start.busy)return Response.json({status:'busy'});const run=start.run_id;let mode='rest';let watermark=start.watermark;let warning:string|null=null;const cutoff=new Date(Date.now()-60000).toISOString();
 try{
  // One API probe; use RSS when WordPress REST is unavailable. No auth/protection bypasses.
  let first;const base=ORIGIN+'/wp-json/wp/v2/posts?status=publish&per_page=25&_embed&orderby=modified&order=asc&modified_after='+encodeURIComponent(new Date(new Date(start.watermark).getTime()-600000).toISOString())+'&modified_before='+encodeURIComponent(cutoff);
  try{first=await get(base+'&page=1',8000);const parsed=JSON.parse(first.text);if(!Array.isArray(parsed))throw Error('Invalid REST response');first.posts=parsed;}catch{mode='rss';}
  if(mode==='rest'){
   const pages=Number(first!.headers.get('X-WP-TotalPages')||1);if(pages>12)throw Error('REST backlog exceeds 300 posts; checkpoint preserved for operator review.');
   for(let page=1;page<=pages;page++){const posts=page===1?first!.posts:JSON.parse((await get(base+'&page='+page)).text);await batch(run,await Promise.all(posts.map(normalizedRest)));}watermark=cutoff;
  }else{
   let complete=false;const failures:string[]=[];const seen=new Set<string>();
   for(let page=1;page<=12;page++){
    let response;try{response=await get(ORIGIN+(page===1?'/feed/':'/feed/?paged='+page));}catch(e){if(page>1){warning='Recent-feed sync is active, but the source API and RSS pagination are unavailable. Older backlog and edits outside the feed require source repair.';complete=true;break;}throw Error('RSS page '+page+' failed: '+e.message)}
    const posts=feedItems(response.text);if(posts.length===0){complete=true;break;}
    const oldest=Math.min(...posts.map(p=>new Date(p.published_at).getTime()));const fresh=posts.filter(p=>page===1||new Date(p.published_at).getTime()>=new Date(start.watermark).getTime()-86400000);
    if(posts.every(p=>seen.has(p.id)))throw Error('RSS pagination repeated a page; checkpoint preserved.');
    const records=[];for(const p of fresh){if(seen.has(p.id))continue;seen.add(p.id);let metadata;try{const article=await get(p.link);metadata=articleMetadata(article.text,p.link,p.categories);}catch(e){failures.push(p.id+': '+e.message);continue;}if(!p.content_html.trim())throw Error('RSS full article content missing');records.push({source_id:p.id,slug:p.slug,title:p.title,excerpt:p.excerpt,content_html:p.content_html,...metadata,published_at:p.published_at,modified_at:p.published_at});}
    await batch(run,records);for(const p of posts)if(new Date(p.published_at)>new Date(watermark))watermark=p.published_at;
    if(oldest<new Date(start.watermark).getTime()-86400000){complete=true;break;}
   }
   if(!complete)throw Error('RSS catch-up exceeds 12 pages; checkpoint preserved for retry.');if(failures.length)throw Error('Saved accessible articles; '+failures.length+' source articles failed and will retry. '+failures.slice(0,2).join('; '));
  }
  await rpc('cms_sync_finish',{run_uuid:run,succeeded:true,sync_mode:mode,new_watermark:watermark,error_message:warning||(mode==='rss'?'RSS fallback: older edits outside the feed cannot be detected while the source API is unavailable.':null)});return Response.json({status:'success',mode,run_id:run});
 }catch(e){const message=String(e.message||e).slice(0,900);try{await rpc('cms_sync_finish',{run_uuid:run,succeeded:false,sync_mode:mode,new_watermark:null,error_message:message})}catch{}console.error('Sync failed:',message);return Response.json({status:'error',error:message},{status:502});}
});
