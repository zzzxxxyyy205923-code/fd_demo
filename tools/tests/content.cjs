const assert=require('node:assert/strict'),fs=require('fs'),os=require('os'),path=require('path');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'fd-content-'));
process.env.CONTENT_STORE_FILE=path.join(temp,'content.json');process.env.CONTENT_UPLOAD_DIR=path.join(temp,'uploads');process.env.AUTH_AUDIT_FILE=path.join(temp,'audit');process.env.AUTH_SESSION_SECRET='test-secret-not-for-production';
const hash=require('bcryptjs').hashSync('Testing-only-123',4);
process.env.AUTH_STAFF_JSON=JSON.stringify(['admin','research_mentor','visitor'].map(role=>({id:role,username:role,name:role,role,hash})));
const content=require('../../server/lib/content'),{validate}=require('../../server/lib/content-validate');
const navigation=require('../../server/lib/content-navigation');
const mapped=navigation.PAGES.flatMap(p=>p.kinds);
assert.equal(new Set(mapped).size,mapped.length);
assert.deepEqual([...mapped].sort(),Object.keys(content.configs).sort());
(async()=>{
for(const k of Object.keys(content.configs))for(const r of content.list(k).items)validate(content.get(k,r.id).record,content.editorSchema(k));
for(const file of content.DATA_FILES)assert.ok(content.data(file));
const uploads=require('../../server/lib/uploads');
const media=await uploads.save(Buffer.from('%PDF-1.4 test'),'application/pdf');assert.ok(await uploads.locate(path.basename(media.url)));
await assert.rejects(uploads.save(Buffer.from('<script>bad</script>'),'image/png'),e=>e.status===415);
assert.equal(await uploads.locate('../accounts.json'),null);
const original=content.list('partners').all;
const added=await content.mutate('partners',null,{nameCn:'测试资源',nameEn:'Test',logo:'',intro:'Test',collab:[]},null,'create');
assert.equal(content.data('assets/data/resources').partners.length,original+1);
const updated=await content.mutate('partners',added.record.id,{...added.record,nameCn:'已修改'},added.version,'update');
await assert.rejects(content.mutate('partners',added.record.id,added.record,added.version,'update'),e=>e.status===409);
await content.mutate('partners',added.record.id,null,updated.version,'delete');assert.equal(content.list('partners').all,original);assert.equal(JSON.parse(fs.readFileSync(process.env.CONTENT_STORE_FILE)).partners.length,original);
const offer=content.get('offers_US',content.list('offers_US').items[0].id);await content.mutate('offers_US',offer.record.id,{...offer.record,seasonCounts:{'26Fall':'2'}},offer.version,'update');assert.equal(content.data('assets/data/offers').groups.US[0].count,'2');
const c=content.get('summerwinter',content.list('summerwinter').items[0].id);await content.mutate('summerwinter',c.record.id,null,c.version,'delete');assert.equal(content.data('assets/data/courses_academic').summerwinter.curriculum.length,10);
if(!process.argv.includes('--http')){console.log('PASS: all seed schemas, all published files, CRUD, conflict detection, offer totals, course deletion');fs.rmSync(temp,{recursive:true,force:true});return;}
const app=require('../../server/app').createApp();const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
try{const base=`http://127.0.0.1:${server.address().port}`;
for(const role of ['admin','research_mentor','visitor']){
 const login=await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:role,password:'Testing-only-123'})});assert.equal(login.status,200);const cookie=login.headers.get('set-cookie').split(';')[0];
 const res=await fetch(base+'/api/content-kinds',{headers:{Cookie:cookie}});assert.equal(res.status,role==='visitor'?403:200);
 for(const section of navigation.PAGES){
 const page=await fetch(base+'/admin/'+section.key,{headers:{Cookie:cookie}});assert.equal(page.status,role==='visitor'?403:200);
 if(role!=='visitor'){
   const html=await page.text();assert.ok(html.includes('data-page="'+section.key+'"'));assert.ok(html.includes('href="admin/'+section.key+'" aria-current="page"'));
   const views=await (await fetch(base+'/api/content-kinds?page='+section.key,{headers:{Cookie:cookie}})).json();assert.deepEqual(views.map(v=>v.kind),section.kinds);assert.ok(views.every(v=>Number.isInteger(v.count)));
 }
}
 const data=await fetch(base+'/assets/data/site-content.json',{headers:{Cookie:cookie}});assert.equal(data.status,200);
 if(role==='admin'){
  const upload=await fetch(base+'/api/content/upload',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/pdf'},body:'%PDF-1.4 test'});assert.equal(upload.status,201);const file=await upload.json();assert.equal((await fetch(base+'/'+file.url,{headers:{Cookie:cookie}})).status,200);
  const cross=await fetch(base+'/api/content/partners',{method:'POST',headers:{Cookie:cookie,Origin:'https://other.example','Content-Type':'application/json'},body:'{}'});assert.equal(cross.status,403);
 }
}
assert.equal((await fetch(base+'/api/content-kinds')).status,401);
console.log('PASS: seed schemas, publication, CRUD, conflict, counts, deletion, role access, uploads, same-origin checks');
}finally{await new Promise(r=>server.close(r));fs.rmSync(temp,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
