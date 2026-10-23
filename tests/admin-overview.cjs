const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../admin/editor.js'),'utf8');
const elements=new Map();const $=id=>{if(!elements.has(id))elements.set(id,{textContent:'',innerHTML:'',classList:{toggle(){}}});return elements.get(id)};
const calls=[];const counts=[691,680,4,3,2,2,28,57];
const ctx={dbAdmin:true,$,Date,message:(id,text)=>$(id).textContent=text,SocialDB:{count:async p=>{calls.push(p);return counts[calls.length-1]}}};vm.createContext(ctx);
vm.runInContext(source.slice(source.indexOf('async function loadOverview()'),source.indexOf('async function publishNow()')),ctx);
(async()=>{await ctx.loadOverview();assert.equal(calls.length,8);assert.ok(calls[1].includes('status=eq.publish&published_at=lte.'));assert.ok(calls[5].includes('published_at=gt.'));assert.match($('databaseStats').innerHTML,/>691<\/b><span>Total posts/);assert.match($('databaseStats').innerHTML,/>3<\/b><span>Pending review/);assert.match($('databaseStats').innerHTML,/>4<\/b><span>Drafts/);assert.match($('databaseStats').innerHTML,/>28<\/b><span>Categories/);ctx.dbAdmin=false;await ctx.loadOverview();assert.equal(calls.length,8);console.log('PASS: overview exact database counts, publication filters, signed-out guard');})();
