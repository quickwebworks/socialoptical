import {clean,plain,hashRecord} from './core.ts';
import {SOURCE_API,SOURCE_KEY,normalizeCMSPost,sourceQuery} from './cms-source.js';
const project=Deno.env.get('SUPABASE_URL')!;
const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
async function rpc(name:string,body:unknown){const r=await fetch(project+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:serviceKey,Authorization:'Bearer '+serviceKey,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Database operation failed: '+name+' ('+r.status+')');return r.status===204?null:await r.json();}
async function sourcePosts(query:URLSearchParams){const r=await fetch(SOURCE_API+'/rest/v1/cms_posts?'+query,{headers:{apikey:SOURCE_KEY},signal:AbortSignal.timeout(15000),redirect:'error'});if(!r.ok)throw Error('EarlyNews24 CMS HTTP '+r.status);const text=await r.text();if(text.length>6000000)throw Error('Source page exceeds 6 MB');const data=JSON.parse(text);if(!Array.isArray(data))throw Error('Invalid CMS response');return data;}
Deno.serve(async req=>{
 if(req.method!=='POST')return new Response('Method not allowed',{status:405});
 const token=req.headers.get('x-sync-token');if(!token||token.length!==64)return new Response('Unauthorized',{status:401});
 let start;try{start=await rpc('cms_sync_start',{sync_token:token})}catch{return new Response('Unauthorized',{status:401})}
 if(start.busy)return Response.json({status:'busy'});
 const run=start.run_id,mode='supabase-cms';
 const cutoff=new Date(Date.now()-10000).toISOString();
 const since=new Date(new Date(start.watermark).getTime()-600000).toISOString();
 let cursor:any=null,complete=false;
 try{
  // Keyset pagination survives source edits during a run. The overlap retries late commits.
  for(let page=0;page<80;page++){
   const posts=await sourcePosts(sourceQuery(since,cutoff,cursor));
   const records=[];for(const p of posts){const record=normalizeCMSPost(p,clean,plain);records.push({...record,content_hash:await hashRecord(record)})}
   if(records.length)await rpc('cms_sync_batch',{run_uuid:run,records});
   if(posts.length<25){complete=true;break;}
   const last=posts.at(-1);if(cursor&&last.updated_at===cursor.updated_at&&last.id===cursor.id)throw Error('Source cursor did not advance');cursor={updated_at:last.updated_at,id:last.id};
  }
  if(!complete)throw Error('CMS backlog exceeds 2000 posts; checkpoint retained for retry.');
  await rpc('cms_sync_finish',{run_uuid:run,succeeded:true,sync_mode:mode,new_watermark:cutoff,error_message:null});
  return Response.json({status:'success',mode,run_id:run});
 }catch(e){const error=e instanceof Error?e.message:String(e);try{await rpc('cms_sync_finish',{run_uuid:run,succeeded:false,sync_mode:mode,new_watermark:null,error_message:error.slice(0,900)})}catch{}console.error('CMS sync failed:',error);return Response.json({status:'error',error},{status:502});}
});
