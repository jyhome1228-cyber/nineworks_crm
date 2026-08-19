const journalStyle=document.createElement('link');
journalStyle.rel='stylesheet';
journalStyle.href=new URL('../css/work-journal.css?v=20260819-2',import.meta.url).href;
document.head.appendChild(journalStyle);

const $=(s,r=document)=>r.querySelector(s);
const esc=(v='')=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const uid=(p='log')=>`${p}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
const pad=n=>String(n).padStart(2,'0');
const today=()=>{const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
const nowIso=()=>new Date().toISOString();

const STORES={
  safe:['meta','workLogs','items'],
  primary:['workLogs']
};

let api=null,currentUser=null,profile=null,logs=[],clients=[],unsubs=[];
let safeLogs=[],primaryLogs=[];
let storeState={safe:'pending',primary:'pending'};
let selectedId='',mode='view';

function toast(message){
  const el=$('#toast');
  if(!el)return;
  el.textContent=message;
  el.classList.add('is-visible');
  clearTimeout(window.__worklogToast);
  window.__worklogToast=setTimeout(()=>el.classList.remove('is-visible'),2600);
}
function owner(){return profile?.role==='owner'}
function dateLabel(key){
  if(!key)return '-';
  const [y,m,d]=String(key).split('-').map(Number);
  return `${y}.${pad(m)}.${pad(d)}`;
}
function plainPreview(text=''){
  return String(text).replace(/^#{1,6}\s+/gm,'').replace(/[*_`>-]/g,'').replace(/\s+/g,' ').trim().slice(0,150);
}
function inlineMd(text){
  let out=esc(text);
  out=out.replace(/`([^`]+)`/g,'<code>$1</code>');
  out=out.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
  return out;
}
function markdown(text=''){
  const lines=String(text).replace(/\r/g,'').split('\n');
  let html='',listOpen=false;
  const closeList=()=>{if(listOpen){html+='</ul>';listOpen=false}};
  for(const raw of lines){
    const line=raw.trimEnd();
    if(!line.trim()){closeList();continue}
    let m;
    if((m=line.match(/^###\s+(.+)/))){closeList();html+=`<h3>${inlineMd(m[1])}</h3>`;continue}
    if((m=line.match(/^##\s+(.+)/))){closeList();html+=`<h2>${inlineMd(m[1])}</h2>`;continue}
    if((m=line.match(/^#\s+(.+)/))){closeList();html+=`<h1>${inlineMd(m[1])}</h1>`;continue}
    if(/^---+$/.test(line.trim())){closeList();html+='<hr>';continue}
    if((m=line.match(/^\s*[-*]\s+(.+)/))){
      if(!listOpen){html+='<ul>';listOpen=true}
      html+=`<li>${inlineMd(m[1])}</li>`;
      continue;
    }
    closeList();
    html+=`<p>${inlineMd(line)}</p>`;
  }
  closeList();
  return html;
}
function unique(values){return [...new Set(values.filter(Boolean))]}
function clientTagsFromText(text=''){
  const lower=String(text).toLocaleLowerCase();
  return clients
    .filter(c=>c.name&&lower.includes(String(c.name).toLocaleLowerCase()))
    .map(c=>c.name);
}
function itemShift(item={}){
  if(item.workPeriod==='night'||item.shift==='night')return 'night';
  return 'day';
}
function shiftLabel(item={}){
  return itemShift(item)==='night'?'야간':'주간';
}
function shiftClass(item={}){
  return itemShift(item)==='night'?'is-night':'is-day';
}
function collectionRef(store){
  return api.collection(api.db,...STORES[store]);
}
function docRef(store,id){
  return api.doc(api.db,...STORES[store],id);
}
function permissionDenied(error){
  return String(error?.code||'').includes('permission-denied');
}
function mergedLogs(){
  const map=new Map();
  primaryLogs.forEach(item=>map.set(item.id,item));
  safeLogs.forEach(item=>map.set(item.id,item));
  return [...map.values()];
}
function syncLogs(){
  logs=mergedLogs();
  render();
}
function reportStoreStatus(){
  if(storeState.safe==='error'&&storeState.primary==='error'){
    toast('업무일지 저장 권한을 확인해주세요.');
  }
}

function createNav(){
  const nav=$('.main-nav');
  if(!nav||$('#worklogNavButton'))return;
  const btn=document.createElement('button');
  btn.id='worklogNavButton';
  btn.className='nav-link';
  btn.type='button';
  btn.dataset.route='worklog';
  btn.textContent='업무일지';
  const request=nav.querySelector('[data-route="requests"]');
  nav.insertBefore(btn,request||null);
}

function createPage(){
  if($('#worklogPage'))return;
  const content=$('.app-content');
  if(!content)return;
  const page=document.createElement('main');
  page.id='worklogPage';
  page.className='page worklog-page';
  page.dataset.page='worklog';
  page.innerHTML=`
<section class="page-heading worklog-heading">
  <div>
    <p class="eyebrow">DAILY WORK JOURNAL</p>
    <h1>업무일지</h1>
    <p>날짜와 주간·야간만 선택하고, 오늘 한 일을 내용으로 바로 기록합니다.</p>
  </div>
  <div class="worklog-heading-actions">
    <button id="worklogNew" class="button button--primary" type="button">＋ 업무일지 작성</button>
  </div>
</section>
<section class="worklog-summary">
  <article class="worklog-summary-card"><span>이번 달 업무일지</span><strong id="worklogTotalCount">0</strong><small>팀 전체 기록</small></article>
  <article class="worklog-summary-card"><span>주간 기록</span><strong id="worklogDayCount">0</strong><small>낮 업무 기록</small></article>
  <article class="worklog-summary-card"><span>야간 기록</span><strong id="worklogNightCount">0</strong><small>밤 업무 기록</small></article>
</section>
<section class="worklog-layout">
  <aside class="panel worklog-panel">
    <div class="worklog-panel-head"><div><h2>업무일지 기록</h2><p>날짜·시간대·작성자로 찾아볼 수 있습니다.</p></div></div>
    <div class="worklog-filter">
      <select id="worklogShiftFilter">
        <option value="all">전체 시간대</option>
        <option value="day">주간</option>
        <option value="night">야간</option>
      </select>
      <select id="worklogAuthorFilter"><option value="all">전체 작성자</option></select>
      <select id="worklogClientFilter" class="worklog-client-filter"><option value="all">전체 클라이언트</option></select>
      <input id="worklogSearch" class="worklog-client-filter" type="search" placeholder="업무 내용 검색">
    </div>
    <div id="worklogList" class="worklog-list"></div>
  </aside>
  <section class="panel worklog-panel">
    <div id="worklogEditor" class="worklog-editor">
      <div class="worklog-editor-empty">왼쪽에서 기록을 선택하거나<br>새 업무일지를 작성하세요.</div>
    </div>
  </section>
</section>`;
  content.appendChild(page);
}

function editorForm(item={}){
  mode='edit';
  selectedId=item.id||'';
  const canDelete=!!item.id&&(owner()||item.authorUid===currentUser?.uid);
  const date=item.periodStart||today();
  const shift=itemShift(item);
  $('#worklogEditor').innerHTML=`
<form id="worklogForm" class="worklog-form">
  <input id="worklogId" type="hidden" value="${esc(item.id||'')}">
  <div class="worklog-form-top">
    <label class="worklog-field">
      <span>날짜</span>
      <input id="worklogDate" type="date" value="${esc(date)}">
    </label>
    <label class="worklog-field">
      <span>시간대</span>
      <select id="worklogShift">
        <option value="day" ${shift==='day'?'selected':''}>주간</option>
        <option value="night" ${shift==='night'?'selected':''}>야간</option>
      </select>
    </label>
  </div>
  <label class="worklog-field">
    <span>업무 내용</span>
    <textarea id="worklogBody" placeholder="오늘 진행한 업무 내용을 그대로 붙여넣거나 작성하세요.">${esc(item.body||'')}</textarea>
  </label>
  <p class="worklog-editor-note">제목은 따로 입력하지 않습니다. 날짜와 주간·야간 기준으로 자동 정리되며, 본문에 클라이언트명이 있으면 자동으로 태그됩니다.</p>
  <div class="worklog-form-actions">
    ${canDelete?'<button id="worklogDelete" class="button button--danger" type="button">삭제</button>':''}
    <button id="worklogCancel" class="button button--ghost" type="button">취소</button>
    <button class="button button--primary" type="submit">저장</button>
  </div>
</form>`;
  bindForm();
}

function viewReport(item){
  mode='view';
  selectedId=item.id;
  const canEdit=owner()||item.authorUid===currentUser?.uid;
  $('#worklogEditor').innerHTML=`
<article class="worklog-view">
  <header class="worklog-view-head">
    <div>
      <div class="worklog-view-badges">
        <span class="worklog-type ${shiftClass(item)}">${shiftLabel(item)}</span>
        <span class="worklog-author-badge">${esc(item.authorName||'팀원')}</span>
      </div>
      <h2>${esc(dateLabel(item.periodStart))}</h2>
      <div class="worklog-tags" style="margin-top:10px">${(item.clientNames||[]).map(t=>`<span class="worklog-tag">${esc(t)}</span>`).join('')}</div>
    </div>
    <div class="worklog-view-actions">
      ${canEdit?'<button id="worklogEdit" class="button button--ghost" type="button">수정</button>':''}
      <button id="worklogCopy" class="button button--ghost" type="button">내용 복사</button>
    </div>
  </header>
  <div class="worklog-markdown">${markdown(item.body||'')}</div>
</article>`;
  $('#worklogEdit')?.addEventListener('click',()=>editorForm(item));
  $('#worklogCopy')?.addEventListener('click',async()=>{
    try{
      await navigator.clipboard.writeText(item.body||'');
      toast('업무일지 내용을 복사했습니다.');
    }catch{
      toast('내용을 복사하지 못했습니다.');
    }
  });
}

function bindForm(){
  $('#worklogCancel')?.addEventListener('click',()=>{
    const item=logs.find(x=>x.id===selectedId);
    if(item)viewReport(item);
    else $('#worklogEditor').innerHTML='<div class="worklog-editor-empty">왼쪽에서 기록을 선택하거나<br>새 업무일지를 작성하세요.</div>';
  });
  $('#worklogDelete')?.addEventListener('click',deleteLog);
  $('#worklogForm')?.addEventListener('submit',saveLog);
}

async function writeItem(store,id,item){
  await api.setDoc(docRef(store,id),item,{merge:true});
}

async function saveLog(event){
  event.preventDefault();
  if(!api?.auth?.currentUser)return toast('로그인 상태를 확인해주세요.');
  const button=event.currentTarget.querySelector('button[type="submit"]');
  const oldText=button.textContent;
  button.disabled=true;
  button.textContent='저장 중...';
  try{
    const body=$('#worklogBody').value.trim();
    if(!body){
      toast('업무 내용을 입력해주세요.');
      return;
    }
    const date=$('#worklogDate').value||today();
    const shift=$('#worklogShift').value==='night'?'night':'day';
    const id=$('#worklogId').value||uid('worklog');
    const old=logs.find(x=>x.id===id)||{};
    const tags=unique(clientTagsFromText(body));
    const clientIds=clients.filter(c=>tags.includes(c.name)).map(c=>c.id);
    const item={
      ...old,
      id,
      reportType:'daily',
      workPeriod:shift,
      workPeriodLabel:shift==='night'?'야간':'주간',
      periodStart:date,
      periodEnd:date,
      periodKey:date,
      periodLabel:dateLabel(date),
      title:'',
      body,
      clientNames:tags,
      clientIds,
      manualClientTags:[],
      authorUid:old.authorUid||currentUser.uid,
      authorName:old.authorName||profile?.name||currentUser.email||'팀원',
      updatedAt:api.serverTimestamp(),
      updatedAtText:nowIso()
    };
    if(!old.createdAtText)item.createdAtText=nowIso();

    let target=old._store||(storeState.safe!=='error'?'safe':'primary');
    try{
      await writeItem(target,id,item);
    }catch(error){
      if(!permissionDenied(error))throw error;
      const fallback=target==='safe'?'primary':'safe';
      await writeItem(fallback,id,item);
      target=fallback;
    }
    selectedId=id;
    toast('업무일지를 저장했습니다.');
  }catch(error){
    console.error('업무일지 저장 실패',error);
    toast(permissionDenied(error)?'업무일지 저장 권한을 확인해주세요.':'업무일지를 저장하지 못했습니다.');
  }finally{
    button.disabled=false;
    button.textContent=oldText;
  }
}

async function deleteLog(){
  const item=logs.find(x=>x.id===selectedId);
  if(!item||!(owner()||item.authorUid===currentUser?.uid))return;
  if(!confirm('이 업무일지를 삭제할까요?'))return;
  try{
    await Promise.allSettled([
      api.deleteDoc(docRef('safe',item.id)),
      api.deleteDoc(docRef('primary',item.id))
    ]);
    selectedId='';
    $('#worklogEditor').innerHTML='<div class="worklog-editor-empty">업무일지를 삭제했습니다.</div>';
    toast('삭제했습니다.');
  }catch(error){
    console.error(error);
    toast('삭제하지 못했습니다.');
  }
}

function renderSummary(){
  const month=today().slice(0,7);
  const monthLogs=logs.filter(x=>String(x.periodStart||'').startsWith(month));
  $('#worklogTotalCount').textContent=monthLogs.length;
  $('#worklogDayCount').textContent=monthLogs.filter(x=>itemShift(x)==='day').length;
  $('#worklogNightCount').textContent=monthLogs.filter(x=>itemShift(x)==='night').length;
}

function renderFilters(){
  const author=$('#worklogAuthorFilter');
  const client=$('#worklogClientFilter');
  if(!author||!client)return;
  const av=author.value||'all';
  const cv=client.value||'all';
  const authors=unique(logs.map(x=>x.authorName)).sort((a,b)=>a.localeCompare(b,'ko'));
  author.innerHTML='<option value="all">전체 작성자</option>'+authors.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
  author.value=authors.includes(av)?av:'all';
  const clientNames=unique(logs.flatMap(x=>x.clientNames||[])).sort((a,b)=>a.localeCompare(b,'ko'));
  client.innerHTML='<option value="all">전체 클라이언트</option>'+clientNames.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
  client.value=clientNames.includes(cv)?cv:'all';
}

function renderList(){
  const root=$('#worklogList');
  if(!root)return;
  const shift=$('#worklogShiftFilter')?.value||'all';
  const author=$('#worklogAuthorFilter')?.value||'all';
  const client=$('#worklogClientFilter')?.value||'all';
  const q=($('#worklogSearch')?.value||'').trim().toLocaleLowerCase();
  const list=[...logs]
    .filter(x=>
      (shift==='all'||itemShift(x)===shift)
      &&(author==='all'||x.authorName===author)
      &&(client==='all'||(x.clientNames||[]).includes(client))
      &&(!q||`${x.body||''} ${(x.clientNames||[]).join(' ')}`.toLocaleLowerCase().includes(q))
    )
    .sort((a,b)=>
      String(b.periodStart||'').localeCompare(String(a.periodStart||''))
      ||(itemShift(a)==='night'?1:-1)
      ||String(b.updatedAtText||'').localeCompare(String(a.updatedAtText||''))
    );
  root.innerHTML=list.length?list.map(x=>`
<button class="worklog-card ${x.id===selectedId?'is-active':''}" type="button" data-worklog-id="${esc(x.id)}">
  <span class="worklog-card-top">
    <strong>${esc(dateLabel(x.periodStart))}</strong>
    <i class="worklog-type ${shiftClass(x)}">${shiftLabel(x)}</i>
  </span>
  <span class="worklog-card-meta">${esc(x.authorName||'팀원')}</span>
  <span class="worklog-card-preview">${esc(plainPreview(x.body||''))}</span>
  <span class="worklog-tags">${(x.clientNames||[]).slice(0,5).map(t=>`<i class="worklog-tag">${esc(t)}</i>`).join('')}</span>
</button>`).join(''):'<p class="worklog-list-empty">저장된 업무일지가 없습니다.</p>';
}

function render(){
  renderSummary();
  renderFilters();
  renderList();
  if(mode==='view'&&selectedId){
    const item=logs.find(x=>x.id===selectedId);
    if(item)viewReport(item);
  }
}

function bindPage(){
  document.addEventListener('click',e=>{
    const card=e.target.closest('[data-worklog-id]');
    if(!card)return;
    selectedId=card.dataset.worklogId;
    mode='view';
    const item=logs.find(x=>x.id===selectedId);
    renderList();
    if(item)viewReport(item);
  });
  $('#worklogNew')?.addEventListener('click',()=>editorForm({}));
  ['#worklogShiftFilter','#worklogAuthorFilter','#worklogClientFilter'].forEach(s=>$(s)?.addEventListener('change',renderList));
  $('#worklogSearch')?.addEventListener('input',renderList);
}

function stop(){
  unsubs.forEach(f=>f?.());
  unsubs=[];
  safeLogs=[];
  primaryLogs=[];
  storeState={safe:'pending',primary:'pending'};
}

function subscribeStore(store){
  try{
    const unsub=api.onSnapshot(
      collectionRef(store),
      snap=>{
        storeState[store]='ok';
        const next=snap.docs.map(d=>({id:d.id,...d.data(),_store:store}));
        if(store==='safe')safeLogs=next;
        else primaryLogs=next;
        syncLogs();
      },
      error=>{
        console.warn(`업무일지 ${store} 저장소 읽기 실패`,error);
        storeState[store]='error';
        if(store==='safe')safeLogs=[];
        else primaryLogs=[];
        syncLogs();
        reportStoreStatus();
      }
    );
    unsubs.push(unsub);
  }catch(error){
    console.warn(`업무일지 ${store} 저장소 연결 실패`,error);
    storeState[store]='error';
    reportStoreStatus();
  }
}

async function start(user){
  stop();
  currentUser=user;
  if(!user){
    profile=null;
    logs=[];
    clients=[];
    render();
    return;
  }
  try{
    const p=await api.getDoc(api.doc(api.db,'users',user.uid));
    profile=p.exists()?p.data():{name:user.email||'팀원',role:'staff'};
  }catch{
    profile={name:user.email||'팀원',role:'staff'};
  }
  try{
    unsubs.push(api.onSnapshot(api.collection(api.db,'clients'),snap=>{
      clients=snap.docs.map(d=>({id:d.id,...d.data()}));
    }));
  }catch(error){
    console.warn('클라이언트 목록 연결 실패',error);
  }
  subscribeStore('safe');
  subscribeStore('primary');
}

function init(){
  createNav();
  createPage();
  bindPage();
  const wait=()=>{
    api=window.NineworksFirebase;
    if(!api)return setTimeout(wait,80);
    api.onAuthStateChanged(api.auth,start);
  };
  wait();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
