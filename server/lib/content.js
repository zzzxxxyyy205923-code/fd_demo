/* FD content adapters. Seed files remain unchanged; serialized atomic snapshots are private. */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const {validate, fail} = require('./content-validate');
const ROOT = path.join(__dirname, '../../assets/data');
const FILE = process.env.CONTENT_STORE_FILE || path.join(__dirname, '../data/content.json');
const clone = x => JSON.parse(JSON.stringify(x));
const seed = Object.fromEntries(['site-content','course-products','courses_academic','courses_industry','offers','resources'].map(f => [f, JSON.parse(fs.readFileSync(path.join(ROOT,f+'.json')))]));
const configs = {};
function add(kind, label, file, keys, extra={}) { configs[kind]={label,file,keys,...extra}; }
add('subjects','学科介绍','site-content',['data','subjects']);
add('stories','视频故事','site-content',['data','stories']);
add('partners','校企资源','resources',['partners']);
for (const country of Object.keys(seed['site-content'].data.school_db)) add('schools_'+country,'院校 · '+country,'site-content',['data','school_db',country]);
for (const group of Object.keys(seed.offers.groups)) add('offers_'+group,'Offer · '+group,'offers',['groups',group]);
for (const group of ['longform','catalog','overseas']) add('products_'+group,group==='longform'?'长线课程产品':group==='overseas'?'境外项目与留学服务':'课程目录产品','course-products',[group]);
for (const file of ['courses_academic','courses_industry']) for(const group of Object.keys(seed[file])) add(group,({summerwinter:'海外冬夏校',masterclass:'海外大师课',bizpractice:'商业实践',internship:'就业实习'})[group],file,[group,'curriculum']);
const at=(d,keys)=>keys.reduce((v,k)=>v[k],d);
const put=(d,keys,v)=>{at(d,keys.slice(0,-1))[keys.at(-1)]=v;};
const initial={};
for(const [kind,c] of Object.entries(configs)) initial[kind]=at(seed[c.file],c.keys).filter(r=>kind!=='products_longform'||!r.placeholder).map((r,i)=>({...clone(r),id:r.id||`${kind}-${i+1}`,...(kind==='subjects'?{image:seed['site-content'].data.subject_images[r.id]||''}:{})}));
function infer(values,key='') {
 const types=[...new Set(values.filter(x=>x!==null&&x!==undefined).map(x=>Array.isArray(x)?'array':typeof x))];
 if(types.length>1)return {anyOf:types.map(t=>infer(values.filter(x=>x!==null&&(Array.isArray(x)?'array':typeof x)===t),key))};
 const v=values.find(x=>x!==null&&x!==undefined);
 if(v===undefined)return {type:'string',nullable:true};
 if(Array.isArray(v))return {type:'array',items:infer(values.filter(Array.isArray).flat())};
 if(typeof v==='object') {const props={}; for(const k of new Set(values.filter(x=>x&&typeof x==='object').flatMap(Object.keys))) props[k]=infer(values.map(x=>x&&x[k]).filter(x=>x!==undefined),k); return {type:'object',properties:props};}
 return {type:typeof v,...(values.includes(null)?{nullable:true}:{}),...(/^(image|img|cover|poster|posterFull|portrait|logo)$/.test(key)?{format:'image'}:key==='pdf'?{format:'pdf'}:{})};
}
const schemas=Object.fromEntries(Object.entries(initial).map(([k,v])=>[k,infer(v)]));
let state; let queue=Promise.resolve();
function current(){if(!state)state=fs.existsSync(FILE)?{...clone(initial),...JSON.parse(fs.readFileSync(FILE))}:clone(initial);return state;}
function config(k){if(!Object.hasOwn(configs,k))throw fail(404,'内容分类不存在');return configs[k];}
const version=r=>crypto.createHash('sha256').update(JSON.stringify(r)).digest('hex');
const title=r=>r.zh||r.title||r.nameCn||r.nameEn||r.meta?.titleCn||r.id;
function editorSchema(k){config(k);return {...schemas[k],template:clone(initial[k][0]),label:configs[k].label};}
function list(k,q={}){config(k);let all=current()[k];let rows=all.filter(r=>JSON.stringify(r).toLowerCase().includes(String(q.q||'').toLowerCase()));return {all:all.length,total:rows.length,items:rows.map(r=>({id:r.id,title:title(r),subtitle:r.en||r.program||r.meta?.titleEn||'',image:r.image||r.logo||r.poster||r.cover||''}))};}
function get(k,id){config(k);const r=current()[k].find(r=>r.id===id);if(!r)throw fail(404,'内容不存在');return {record:clone(r),version:version(r)};}
function mutate(k,id,record,expected,action){const task=queue.catch(()=>{}).then(()=>{
 config(k); const next=clone(current()),rows=next[k],i=rows.findIndex(r=>r.id===id);
 if(action!=='create'){if(i<0)throw fail(404,'内容不存在');if(version(rows[i])!==expected)throw fail(409,'内容已被其他管理员修改，请重新打开后编辑。');}
 if(action==='delete')rows.splice(i,1);else{
 const r=clone(record);if(action==='create')r.id=k+'-'+crypto.randomUUID();else if(r.id!==id)throw fail(400,'编号不能修改');
 validate(r,schemas[k]);if(!String(title({...r,id:''})||'').trim())throw fail(400,'请填写名称');
 if(k==='stories'){if(r.video&&!/^(https?:\/\/|assets\/|uploads\/)/.test(r.video))throw fail(400,'视频地址无效');if(!/^[a-zA-Z0-9_-]+$/.test(r.slug))throw fail(400,'故事路径只能使用字母、数字、下划线和连字符');if(rows.some(x=>x.id!==id&&x.slug===r.slug))throw fail(400,'故事路径重复');}
 if(k.startsWith('offers_')){for(const n of Object.values(r.seasonCounts||{}))if(!/^\d+$/.test(String(n)))throw fail(400,'Offer 数必须为非负整数');}
 const checkUrls=(v,key='')=>{if(v&&typeof v==='object')Object.entries(v).forEach(([k,x])=>checkUrls(x,k));else if(typeof v==='string'&&/^(video|href|url|pdf|poster|image|img|cover|logo)$/.test(key)&&v&&!/^(https?:\/\/|assets\/|uploads\/|#\/)/i.test(v))throw fail(400,'媒体和链接请使用本站路径或 https 地址');};checkUrls(r);
 if(action==='create')rows.push(r);else rows[i]=r;record=r;
 }
 fs.mkdirSync(path.dirname(FILE),{recursive:true});fs.writeFileSync(FILE+'.bak',JSON.stringify(current()),{mode:0o600});fs.writeFileSync(FILE+'.tmp',JSON.stringify(next),{mode:0o600});fs.renameSync(FILE+'.tmp',FILE);state=next;
 return action==='delete'?{ok:true}:get(k,record.id);
 });queue=task;return task;}
function data(file){const name=file.replace('assets/data/','');if(!seed[name])throw fail(404,'数据不存在');const d=clone(seed[name]);
 for(const [k,c] of Object.entries(configs))if(c.file===name){let rows=clone(current()[k]);if(k==='products_longform')rows.push(...clone(seed[name].longform.filter(r=>r.placeholder)));put(d,c.keys,rows);}
 if(name==='site-content'){d.data.subject_images=Object.fromEntries(d.data.subjects.map((r,i)=>{r.num=String(i+1).padStart(2,'0');return [r.id,r.image];}));const ids=new Set(current().products_longform.concat(current().products_catalog).map(r=>r.id));d.data.home_courses=d.data.home_courses.filter(id=>ids.has(id));}
 if(name==='course-products'){
 const catalogs={...data('assets/data/courses_academic'),...data('assets/data/courses_industry')};
 for(const group of Object.values(d).filter(Array.isArray))for(const p of group){
 if(catalogs[p.id]){const n=catalogs[p.id].curriculum.length;p.meta.chips=(p.meta.chips||[]).map(x=>x.replace(/\d+\s*个(?:岗位|真实项目)|\d+\s*门[^·]*/g,`${n} 门课程`));}
 const sections=p.detail?.sections||[];
 for(const section of sections)if(section.variant==='stats')for(const item of section.items||[]){
 const source=item.title==='内容页'?sections:item.title==='特色赛道'?sections.find(x=>x.type==='deckTracks')?.tracks:item.title==='申请成长步骤'?sections.find(x=>x.id==='deck-p5')?.items:item.title==='核心培养优势'?sections.find(x=>x.id==='deck-p6')?.items:null;
 if(source)item.value=String(source.length);
 }
 for(const section of sections)if(section.type==='courseCards')for(const g of section.groups||[]){if(catalogs[g.source]){g.cards=catalogs[g.source].curriculum.filter(c=>String(c.facets?.status||c.facets?.program_type||'').includes('招募中')&&(!p.levels?.includes('pg')||JSON.stringify(c.tags||[]).includes('研究生')));g.note=`共 ${g.cards.length} 门 · 招募中`;}}
 }
 }
 if(name==='courses_industry')for(const [key,v] of Object.entries(d)){const n=v.curriculum.length;v.desc=key==='internship'?`共 ${n} 个岗位机会，覆盖实地实习与线上行业导师带训。`:`共 ${n} 个商业实践项目，以企业真实命题为起点。`;v.chips[0]=`${n} 个${key==='internship'?'岗位':'真实项目'}`;if(v.snapshot[0])v.snapshot[0].v=`${n} 个`;}
 if(name==='offers'){const rows=Object.values(d.groups).flat();rows.forEach(r=>{r.count=String(Object.values(r.seasonCounts||{}).reduce((s,n)=>s+Number(n),0));r.seasons=Object.keys(r.seasonCounts||{});});d.seasonFilters=[...new Set(rows.flatMap(r=>r.seasons))].sort();d.hero.desc=`${d.seasonFilters.join('、')} 累计 ${rows.reduce((s,r)=>s+Number(r.count),0)} 枚 offer，覆盖 ${rows.length} 所院校。`;}
 return d;}
module.exports={configs,editorSchema,list,get,mutate,data,DATA_FILES:Object.keys(seed).map(f=>'assets/data/'+f)};
