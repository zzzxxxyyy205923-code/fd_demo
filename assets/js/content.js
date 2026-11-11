(() => {
const $=s=>document.querySelector(s),clone=x=>JSON.parse(JSON.stringify(x));
const labels={zh:'中文名称',en:'英文名称',title:'标题',nameCn:'中文名称',nameEn:'英文名称',desc:'简介',intro:'介绍',body:'正文',sub:'副标题',slug:'页面路径（唯一）',date:'日期',video:'视频',image:'图片',posterFull:'完整海报',portrait:'竖版图片',poster:'海报',pdf:'PDF',cover:'封面',logo:'标志',meta:'卡片信息',titleCn:'中文标题',titleEn:'英文标题',chips:'标签',snapshot:'速览',curriculum:'课程内容',detail:'详情',sections:'内容区块',items:'条目',points:'要点',areas:'细分领域',seasonCounts:'各申请季 Offer 数',tags:'标签',collab:'合作内容',levels:'适用阶段',program:'院校 / 项目',facets:'分类筛选',closing:'结语',whySFK:'优势',badge:'分类名称',k:'关键词',v:'说明',t:'标题',d:'说明',img:'图片',note:'备注',city:'城市'};
let kind, schema, record, expected, dirty=false, generation=0, page=1;
async function api(url,options={}){const res=await fetch(url,{...options,headers:options.body instanceof Blob?{'Content-Type':options.body.type}:{'Content-Type':'application/json'}});const d=await res.json();if(!res.ok)throw Error(d.error||'请求失败');return d;}
const msg=e=>$('#status').textContent=e.message||e;
function blank(s){if(s.anyOf)s=s.anyOf[0];if(s.type==='object')return Object.fromEntries(Object.entries(s.properties).filter(([k])=>k!=='id').map(([k,v])=>[k,blank(v)]));if(s.type==='array')return [];return s.type==='number'?0:s.type==='boolean'?false:'';}
function field(value,s,key,set){
 if(s.anyOf)s=s.anyOf.find(x=>x.type===(Array.isArray(value)?'array':typeof value))||s.anyOf[0];
 const wrap=document.createElement(s.type==='object'||s.type==='array'?'details':'label');
 if(s.type==='object'||s.type==='array'){
 const summary=document.createElement('summary');summary.textContent=(labels[key]||key)+(Array.isArray(value)?` · ${value.length} 项`:'');wrap.append(summary);
 if(s.type==='object'&&value.type==='courseCards'){const note=document.createElement('p');note.textContent='课程列表及数量由海外冬夏校 / 大师课等目录自动同步，请在对应分类编辑。';wrap.append(note);return wrap;}
 if(s.type==='object'){for(const [k,sub] of Object.entries(s.properties||{})){if((k==='id'&&key==='内容')||['searchText','num','count','seasons','hero','_glass','_ph'].includes(k))continue; if(value[k]===undefined){const add=document.createElement('button');add.type='button';add.className='admin-btn';add.textContent='＋ '+(labels[k]||k);add.onclick=()=>{value[k]=blank(sub);add.replaceWith(field(value[k],sub,k,v=>{value[k]=v;dirty=true;}));dirty=true;};wrap.append(add);continue;}wrap.append(field(value[k],sub,k,v=>{value[k]=v;dirty=true;}));}}
 else {const render=()=>{while(wrap.children.length>1)wrap.lastChild.remove();summary.textContent=(labels[key]||key)+` · ${value.length} 项`;value.forEach((item,i)=>{const row=document.createElement('div');row.className='array-item';row.append(field(item,s.items,`${i+1}`,v=>{value[i]=v;dirty=true;}));for(const [text,action] of [['移除',()=>value.splice(i,1)],['上移',()=>{if(i>0)[value[i-1],value[i]]=[value[i],value[i-1]];}]]){const b=document.createElement('button');b.type='button';b.className='admin-btn';b.textContent=text;b.onclick=()=>{action();dirty=true;render();};row.append(b);}wrap.append(row);});const add=document.createElement('button');add.type='button';add.className='admin-btn';add.textContent='＋ 添加条目';add.onclick=()=>{value.push(blank(s.items));dirty=true;render();};wrap.append(add);};render();}return wrap;
 }
 const caption=document.createElement('span');caption.textContent=labels[key]||key;wrap.append(caption);const input=document.createElement(s.type==='string'&&String(value||'').length>90?'textarea':'input');input.type=s.type==='boolean'?'checkbox':s.type==='number'?'number':'text';if(input.type==='checkbox')input.checked=value;else input.value=value??'';input.oninput=()=>{set(s.type==='boolean'?input.checked:s.type==='number'?Number(input.value):input.value);dirty=true;};wrap.append(input);
 if(s.format==='image'||s.format==='pdf'||key==='video'){
 const preview=document.createElement(s.format==='image'?'img':'a');if(s.format==='image')preview.src=value||'';else{preview.href=value||'';preview.textContent='查看当前媒体';preview.target='_blank';preview.rel='noopener';}wrap.append(preview);
 const upload=document.createElement('input');upload.type='file';upload.accept=key==='video'?'video/mp4,video/webm':s.format==='pdf'?'application/pdf':'image/jpeg,image/png,image/webp,image/gif';upload.onchange=async()=>{if(!upload.files[0])return;$('#save').disabled=true;try{const d=await api('api/content/upload',{method:'POST',body:upload.files[0]});input.value=d.url;input.oninput();if(s.format==='image')preview.src=d.url;else preview.href=d.url;$('#edit-status').textContent='上传完成，保存后生效。';}catch(e){$('#edit-status').textContent=e.message;}finally{$('#save').disabled=false;}};wrap.append(upload);
 const clear=document.createElement('button');clear.type='button';clear.textContent='移除媒体';clear.className='admin-btn';clear.onclick=()=>{input.value='';input.oninput();preview.removeAttribute('src');preview.removeAttribute('href');};wrap.append(clear);
 }return wrap;
}
async function listing(){const ticket=++generation;const d=await api('api/content/'+encodeURIComponent(kind)+'?q='+encodeURIComponent($('#search').value));if(ticket!==generation)return;$('#counts').textContent=`共 ${d.all} 条 · 筛选结果 ${d.total} 条`;const badge=document.querySelector('#kinds [data-kind="'+CSS.escape(kind)+'"] .content-kinds__n');if(badge)badge.textContent=d.all;$('#rows').replaceChildren();const pages=Math.max(1,Math.ceil(d.items.length/25));page=Math.min(page,pages);for(const r of d.items.slice((page-1)*25,page*25)){const row=document.createElement('article');if(r.image){const img=document.createElement('img');img.src=r.image;img.alt='';row.append(img);}const text=document.createElement('div');text.textContent=r.title;const sub=document.createElement('small');sub.textContent=r.subtitle;text.append(sub);const button=document.createElement('button');button.className='admin-btn';button.textContent='编辑';button.onclick=()=>open(r.id).catch(msg);row.append(text,button);$('#rows').append(row);}const pager=document.createElement('div');pager.textContent=`第 ${page} / ${pages} 页 `;for(const [label,delta] of [['上一页',-1],['下一页',1]]){const b=document.createElement('button');b.className='admin-btn';b.textContent=label;b.disabled=page+delta<1||page+delta>pages;b.onclick=()=>{page+=delta;listing().catch(msg);};pager.append(b);}$('#rows').append(pager);}
async function open(id){schema=await api(`api/content/${encodeURIComponent(kind)}/schema`);const d=id?await api(`api/content/${encodeURIComponent(kind)}/${encodeURIComponent(id)}`):{record:blank(schema)};record=d.record;expected=d.version;dirty=false;$('#edit-title').textContent=(id?'编辑 · ':'新增 · ')+schema.label;$('#fields').replaceChildren(field(record,schema,'内容',v=>record=v));$('#fields').firstChild.open=true;$('#delete').hidden=!id;$('#edit-status').textContent='';$('#editor').showModal();}
function close(){if(dirty&&!confirm('放弃尚未保存的修改？'))return;$('#editor').close();dirty=false;}
$('#cancel').onclick=close;
$('#editor').addEventListener('cancel',e=>{e.preventDefault();close();});
$('#edit-form').onsubmit=async e=>{e.preventDefault();$('#save').disabled=true;try{await api('api/content/'+encodeURIComponent(kind)+(expected?'/'+encodeURIComponent(record.id):''),{method:expected?'PUT':'POST',body:JSON.stringify({record,version:expected})});dirty=false;$('#editor').close();await listing();msg('已保存，刷新前台即可查看。');}catch(e){$('#edit-status').textContent=e.message;}finally{$('#save').disabled=false;}};
$('#delete').onclick=async()=>{if(!confirm('确定删除这条内容？'))return;try{await api(`api/content/${encodeURIComponent(kind)}/${encodeURIComponent(record.id)}`,{method:'DELETE',body:JSON.stringify({version:expected})});dirty=false;$('#editor').close();await listing();msg('已删除。');}catch(e){$('#edit-status').textContent=e.message;}};
$('#create').onclick=()=>open().catch(msg);$('#search').oninput=()=>{page=1;listing().catch(msg);};window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
// The server exposes only views belonging to this primary admin page (IST pattern).
api('api/content-kinds?page='+encodeURIComponent(document.body.dataset.page)).then(d=>{
  if(!d.length)throw Error('当前页面没有可编辑内容');
  $('#page-title').textContent=d[0].pageTitle;
  document.title='后台 · '+d[0].pageTitle+'｜SFK 时尚科系';
  $('#page-hint').textContent=d[0].hint+' 保存后刷新前台即可查看。';
  $('#kinds').hidden=d.length<2;
  for(const c of d){
    const b=document.createElement('button');b.type='button';b.className='admin-tab';b.dataset.kind=c.kind;
    const label=document.createElement('span');label.textContent=c.label;
    const count=document.createElement('span');count.className='content-kinds__n';count.textContent=c.count;
    b.append(label,count);
    b.onclick=()=>{
      kind=c.kind;page=1;$('#heading').textContent=c.label;$('#search').value='';$('#status').textContent='';
      $('#search').placeholder='搜索'+c.label;
      $('#kinds').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
      const url=new URL(location.href);url.searchParams.set('kind',kind);history.replaceState(null,'',url);
      listing().catch(msg);
    };
    $('#kinds').append(b);
  }
  const requested=new URLSearchParams(location.search).get('kind');
  const selected=[...$('#kinds').children].find(b=>b.dataset.kind===requested)||$('#kinds').firstChild;
  selected.click();
}).catch(msg);
})();
