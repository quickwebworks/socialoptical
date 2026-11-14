import {readdir,readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(process.argv[2]||'dist');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon'};
const assets={};
async function collect(dir,prefix=''){
 for(const entry of await readdir(dir,{withFileTypes:true})){
  if(!prefix&&['news','server','.openai'].includes(entry.name))continue;
  const relative=prefix+entry.name,file=path.join(dir,entry.name);
  if(entry.isDirectory()){await collect(file,relative+'/');continue}
  const type=types[path.extname(entry.name)];if(!type)continue;
  assets['/'+relative]={type,data:(await readFile(file)).toString('base64')};
 }
}
await collect(root);
if(!assets['/index.html']||!assets['/admin/index.html'])throw Error('Missing publication entry pages');
const worker=`const assets=${JSON.stringify(assets)};
export default {async fetch(request){
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
 let pathname;try{pathname=decodeURIComponent(new URL(request.url).pathname)}catch{return new Response('Invalid path',{status:400})}
 let file=pathname;
 if(/^\\/news\\/[^/]+\\/?$/.test(pathname))file='/index.html';
 else if(pathname.endsWith('/'))file=pathname+'index.html';
 else if(!assets[file]&&assets[file+'/index.html'])file+='/index.html';
 const asset=assets[file];if(!asset)return new Response('Not found',{status:404});
 const bytes=Uint8Array.from(atob(asset.data),c=>c.charCodeAt(0));
 return new Response(request.method==='HEAD'?null:bytes,{headers:{'Content-Type':asset.type,'Cache-Control':asset.type.startsWith('text/html')?'no-store':'public, max-age=3600','X-Content-Type-Options':'nosniff'}});
}};
`;
await mkdir(path.join(root,'server'),{recursive:true});
await writeFile(path.join(root,'server/index.js'),worker);
console.log('Built shared article router with '+Object.keys(assets).length+' publication assets');
