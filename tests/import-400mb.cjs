const assert=require('node:assert/strict');
const {parseFile,statementStream}=require('../admin/import-worker.js');
const sql="-- a comment\nINSERT INTO wp_posts (ID,post_author,post_type,post_status,post_date,post_date_gmt,post_modified,post_name,post_title,post_content,post_excerpt,guid,post_parent,post_mime_type) VALUES (1,2,'post','publish','2026-08-01','','','one','हिंदी ਪੰਜਾਬੀ','It\\'s; a ''quote'' (inside)','','',0,'');/* block; comment */\n";
for(let n=1;n<=64;n++){
 const got=[],s=statementStream(v=>got.push(v));for(let i=0;i<sql.length;i+=n)s.feed(sql.slice(i,i+n));s.feed('',true);
 assert.equal(got.length,2,'chunk size '+n);assert.ok(got[0].includes("It\\'s;"));assert.ok(got[1].includes('block; comment'));
}
(async()=>{
 const filler="INSERT INTO wp_options (option_value) VALUES ('"+'x'.repeat(8192)+"');\n";
 const target=400*1024*1024,parts=[sql];let bytes=Buffer.byteLength(sql);while(bytes+filler.length<target){parts.push(filler);bytes+=filler.length}parts.push(' '.repeat(target-bytes));
 const file=new Blob(parts);let progress=0;
 const r=await parseFile(file,{source:'https://socialoptical.in',publishedOnly:true,from:'2026-07-18',to:'2026-10-18'},()=>progress++);
 assert.equal(r.posts.length,1);assert.equal(r.posts[0].title,'हिंदी ਪੰਜਾਬੀ');assert.ok(progress>=400);
 await assert.rejects(parseFile({size:target+1},{ }),/400 MB/);
 console.log('Passed: 64 chunk-boundary cases and '+(file.size/1024/1024).toFixed(1)+' MB synthetic SQL file; 1 post retained, unrelated options excluded.');
})().catch(e=>{console.error(e);process.exit(1)});
