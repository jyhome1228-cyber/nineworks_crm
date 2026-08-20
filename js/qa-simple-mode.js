const qaCompactStyle=document.createElement('style');
qaCompactStyle.textContent=`
.qa-page.qa-compact-active>.qa-summary,
.qa-page.qa-compact-active>.qa-guide,
.qa-page.qa-compact-active>.qa-panel{display:none!important}
.qa-page.qa-compact-active .qa-heading{margin-bottom:24px;align-items:flex-end}
.qa-page.qa-compact-active .qa-heading .eyebrow{font-size:11px;letter-spacing:.12em}
.qa-page.qa-compact-active .qa-heading h1{margin-top:7px;font-size:34px;line-height:1.08;letter-spacing:-.045em}
.qa-page.qa-compact-active .qa-heading p:not(.eyebrow){max-width:720px;margin-top:10px;color:#8f8f98;font-size:14px;line-height:1.65}
.qa-page.qa-compact-active .qa-heading-actions #qaAddSite{display:none!important}
.qa-compact-root{display:grid;gap:15px}
.qa-compact-toolbar{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 20px;border:1px solid var(--line-soft);border-radius:12px;background:#1c1c20}
.qa-compact-toolbar__title{display:flex;align-items:baseline;gap:10px}
.qa-compact-toolbar__title strong{color:#f2f2f4;font-size:18px;letter-spacing:-.025em}
.qa-compact-toolbar__title span{color:#73737d;font-size:12px}
.qa-compact-toolbar__actions{display:flex;gap:8px;align-items:center}
.qa-compact-search{width:250px;height:40px;border:1px solid #34343b;border-radius:8px;padding:0 12px;background:#232328;color:#efeff2;font-size:12.5px;outline:0}
.qa-compact-search:focus{border-color:rgba(85,119,255,.7);box-shadow:0 0 0 3px rgba(67,104,245,.08)}
.qa-compact-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.qa-compact-card{display:flex;min-height:310px;flex-direction:column;border:1px solid var(--line-soft);border-radius:12px;padding:18px;background:linear-gradient(145deg,rgba(31,31,35,.98),rgba(25,25,28,.98));transition:border-color .16s ease,transform .16s ease}
.qa-compact-card:hover{border-color:#3a3a42;transform:translateY(-1px)}
.qa-compact-card__top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:16px}
.qa-compact-card__index{color:#5f5f69;font-size:10.5px;font-weight:700;letter-spacing:.06em}
.qa-compact-card__category{overflow:hidden;max-width:68%;color:#797983;font-size:10px;font-weight:700;letter-spacing:.055em;text-overflow:ellipsis;white-space:nowrap}
.qa-compact-card h3{margin:0;color:#f3f3f5;font-size:18px;line-height:1.25;font-weight:720;letter-spacing:-.03em}
.qa-compact-card__client{min-height:20px;margin:5px 0 0;color:#8d8d96;font-size:12px;line-height:1.45}
.qa-compact-card__link{display:inline-flex;width:max-content;max-width:100%;align-items:center;gap:5px;margin-top:11px;color:#b7c2ff;font-size:12.5px;font-weight:650;text-decoration:none}
.qa-compact-card__link span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.qa-compact-card__link:hover{color:#d8deff}
.qa-compact-note{display:grid;gap:7px;margin-top:auto;padding-top:18px}
.qa-compact-note label{color:#aaaab2;font-size:11px;font-weight:650}
.qa-compact-note textarea{width:100%;min-height:94px;border:1px solid #34343b;border-radius:8px;padding:11px 12px;background:#232328;color:#e9e9ed;font-family:"Pretendard",sans-serif;font-size:12.5px;line-height:1.58;resize:vertical;outline:0}
.qa-compact-note textarea:focus{border-color:rgba(85,119,255,.68);box-shadow:0 0 0 3px rgba(67,104,245,.07)}
.qa-compact-note textarea::placeholder{color:#62626b}
.qa-compact-note__footer{display:flex;min-height:32px;align-items:center;justify-content:space-between;gap:8px}
.qa-compact-note__state{overflow:hidden;color:#666670;font-size:10px;text-overflow:ellipsis;white-space:nowrap}
.qa-compact-save{height:32px;border:1px solid #3b3b44;border-radius:7px;padding:0 11px;background:#29292f;color:#c9c9d0;font-size:10.5px;font-weight:700;cursor:pointer}
.qa-compact-save:hover{border-color:#4a4a56;color:#fff}
.qa-compact-save:disabled{opacity:.55;cursor:default}
.qa-compact-empty{grid-column:1/-1;padding:60px 20px;border:1px solid var(--line-soft);border-radius:12px;color:#707079;text-align:center;font-size:13px}
@media(max-width:1120px){.qa-compact-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:760px){
  .qa-page.qa-compact-active .qa-heading{align-items:flex-start}
  .qa-page.qa-compact-active .qa-heading h1{font-size:29px}
  .qa-compact-toolbar{align-items:stretch;flex-direction:column}
  .qa-compact-toolbar__actions{width:100%}
  .qa-compact-search{width:auto;flex:1}
  .qa-compact-grid{grid-template-columns:1fr}
}
`;
document.head.appendChild(qaCompactStyle);

const $=(s,r=document)=>r.querySelector(s);
const esc=(v='')=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const nowIso=()=>new Date().toISOString();

const SOST_SITES=[
  {id:'recelleclore',title:'RECELLÉCLORE',client:'RECELLÉCLORE / 리셀에클로',url:'https://recelleclore.co.kr/',domain:'recelleclore.co.kr',category:'COMMERCE · CONTENT',type:'shop'},
  {id:'thomastone',title:'THOMASTONE',client:'THOMASTONE / 토마스톤',url:'https://thomastone.co.kr/',domain:'thomastone.co.kr',category:'CORPORATE WEBSITE',type:'general'},
  {id:'kekomi',title:'KEKOMI',client:'KEKOMI / 깨꼬미',url:'https://kekomi.co.kr/',domain:'kekomi.co.kr',category:'CAFE24 COMMERCE',type:'shop'},
  {id:'aesost',title:'AESOST',client:'AESOST / 에이소스트',url:'https://aesost.com/index.html',domain:'aesost.com',category:'COMMUNITY PLATFORM',type:'general'},
  {id:'relim',title:'RE:LIM',client:'RE:LIM / 리림',url:'https://re-lim.com/',domain:'re-lim.com',category:'WEB · OPERATIONS',type:'reservation'},
  {id:'tne-epc',title:'TNE',client:'TNE / 티엔이',url:'https://tneepc.com/',domain:'tneepc.com',category:'CORPORATE · DATA',type:'general'},
  {id:'terracle',title:'TERRACLE',client:'TERRACLE / 테라클',url:'https://kr.terracle.im/?redirect=no',domain:'kr.terracle.im',category:'CORPORATE · TECHNOLOGY',type:'general'},
  {id:'the-petrichor',title:'THE PETRICHOR',client:'THE PETRICHOR / 더 페트리셔',url:'https://thepetrichor.co.kr/',domain:'thepetrichor.co.kr',category:'BRAND · COMMERCE',type:'shop'},
  {id:'taepyeong-paper',title:'TAEPYEONG PAPER',client:'TAEPYEONG PAPER / 태평제지',url:'http://tp1977.com/',domain:'tp1977.com',category:'CORPORATE · MANUFACTURING',type:'general'},
  {id:'pentagon-law-office-corporate-center',title:'PTG LAW',client:'PTG LAW / 펜타곤 법률세무회계',url:'https://www.ptglaw.co.kr/',domain:'ptglaw.co.kr',category:'LEGAL · CONSULTING',type:'general'},
  {id:'fineb',title:'FINE.B',client:'FINE.B / 파인비',url:'https://finebpkg.com/',domain:'finebpkg.com',category:'WEB · DIGITAL SYSTEM',type:'general'}
];

let api=null,currentUser=null,sites=[],unsubscribe=null,searchText='',seededFor='';

function normalizeUrl(value=''){
  try{
    const url=new URL(/^https?:\/\//i.test(value)?value:`https://${value}`);
    return `${url.hostname.replace(/^www\./,'')}${url.pathname.replace(/\/$/,'')}`.toLowerCase();
  }catch{return String(value||'').trim().toLowerCase()}
}

function toast(message){
  const el=$('#toast');
  if(!el)return;
  el.textContent=message;
  el.classList.add('is-visible');
  clearTimeout(window.__qaCompactToast);
  window.__qaCompactToast=setTimeout(()=>el.classList.remove('is-visible'),2200);
}

function ensurePage(){
  const page=$('#qaPage');
  if(!page)return false;
  page.classList.add('qa-compact-active');
  const heading=page.querySelector('.qa-heading');
  if(heading){
    const eyebrow=heading.querySelector('.eyebrow');
    const title=heading.querySelector('h1');
    const desc=heading.querySelector('p:not(.eyebrow)');
    if(eyebrow)eyebrow.textContent='WEBSITE MANAGEMENT';
    if(title)title.textContent='웹사이트 관리';
    if(desc)desc.textContent='운영 중인 사이트를 한눈에 보고 바로 접속하거나, 필요한 메모만 간단히 기록합니다.';
  }
  const entry=$('#openQaManagement');
  if(entry)entry.textContent='사이트 관리';
  if(!$('#qaCompactRoot')){
    const root=document.createElement('section');
    root.id='qaCompactRoot';
    root.className='qa-compact-root';
    root.innerHTML=`
      <div class="qa-compact-toolbar">
        <div class="qa-compact-toolbar__title"><strong>관리 사이트</strong><span id="qaCompactCount">0개</span></div>
        <div class="qa-compact-toolbar__actions">
          <input id="qaCompactSearch" class="qa-compact-search" type="search" placeholder="사이트 검색">
          <button id="qaCompactAdd" class="button button--ghost" type="button">＋ 사이트</button>
        </div>
      </div>
      <div id="qaCompactGrid" class="qa-compact-grid"><div class="qa-compact-empty">사이트 목록을 불러오는 중입니다.</div></div>`;
    heading?.insertAdjacentElement('afterend',root);
    $('#qaCompactSearch')?.addEventListener('input',e=>{searchText=e.target.value.trim().toLowerCase();render()});
    $('#qaCompactAdd')?.addEventListener('click',()=>$('#qaAddSite')?.click());
    root.addEventListener('click',handleRootClick);
  }
  return true;
}

function matchProject(project,rows){
  const targetUrl=normalizeUrl(project.url);
  return rows.find(row=>
    row.sostProjectId===project.id
    ||normalizeUrl(row.url||row.siteUrl||'')===targetUrl
    ||String(row.name||row.siteName||'').trim().toLowerCase()===project.title.toLowerCase()
  );
}

async function seedPortfolioSites(){
  if(!api?.auth?.currentUser||seededFor===api.auth.currentUser.uid)return;
  seededFor=api.auth.currentUser.uid;
  try{
    const snap=await api.getDocs(api.collection(api.db,'qaSites'));
    const rows=snap.docs.map(d=>({id:d.id,...d.data()}));
    const writes=[];
    SOST_SITES.forEach(project=>{
      const existing=matchProject(project,rows);
      if(existing){
        if(!existing.sostProjectId){
          writes.push(api.setDoc(api.doc(api.db,'qaSites',existing.id),{
            sostProjectId:project.id,
            source:'sost-portfolio',
            displayDomain:project.domain,
            categoryLabel:project.category
          },{merge:true}));
        }
        return;
      }
      const id=`sost_${project.id.replace(/[^a-z0-9_-]/gi,'_')}`;
      writes.push(api.setDoc(api.doc(api.db,'qaSites',id),{
        id,
        name:project.title,
        siteName:project.title,
        client:project.client,
        url:project.url,
        siteUrl:project.url,
        siteType:project.type,
        status:'testing',
        tester:'',
        note:'',
        quickNote:'',
        sostProjectId:project.id,
        source:'sost-portfolio',
        displayDomain:project.domain,
        categoryLabel:project.category,
        createdAt:api.serverTimestamp(),
        createdAtText:nowIso(),
        updatedAt:api.serverTimestamp(),
        updatedAtText:nowIso()
      },{merge:true}));
    });
    if(writes.length)await Promise.all(writes);
  }catch(error){
    console.error('SOST 포트폴리오 사이트 등록 실패',error);
    toast('사이트 목록을 준비하지 못했습니다.');
  }
}

function projectMeta(site){
  const project=SOST_SITES.find(p=>p.id===site.sostProjectId)||SOST_SITES.find(p=>normalizeUrl(p.url)===normalizeUrl(site.url||site.siteUrl||''));
  if(project)return project;
  let domain='';
  try{domain=new URL(site.url||site.siteUrl||'').hostname.replace(/^www\./,'')}catch{domain=site.displayDomain||''}
  return {
    id:site.id,
    title:site.name||site.siteName||'사이트',
    client:site.client||'',
    url:site.url||site.siteUrl||'#',
    domain:site.displayDomain||domain,
    category:site.categoryLabel||'CUSTOM SITE'
  };
}

function orderedSites(){
  const rank=new Map(SOST_SITES.map((p,i)=>[p.id,i]));
  return [...sites].sort((a,b)=>{
    const ar=rank.has(a.sostProjectId)?rank.get(a.sostProjectId):999;
    const br=rank.has(b.sostProjectId)?rank.get(b.sostProjectId):999;
    if(ar!==br)return ar-br;
    return String(a.name||a.siteName||'').localeCompare(String(b.name||b.siteName||''),'ko');
  });
}

function render(){
  if(!ensurePage())return;
  const grid=$('#qaCompactGrid');
  if(!grid)return;
  const list=orderedSites().filter(site=>{
    if(!searchText)return true;
    const meta=projectMeta(site);
    return `${meta.title} ${meta.client} ${meta.domain}`.toLowerCase().includes(searchText);
  });
  $('#qaCompactCount').textContent=`${sites.length}개`;
  if(!list.length){
    grid.innerHTML='<div class="qa-compact-empty">검색 결과가 없습니다.</div>';
    return;
  }
  grid.innerHTML=list.map((site,index)=>{
    const meta=projectMeta(site);
    const note=site.quickNote??site.note??'';
    const updated=site.quickNoteUpdatedAtText||site.updatedAtText||'';
    const state=updated?`최근 기록 ${esc(updated.slice(0,10))}`:'아직 기록 없음';
    return `<article class="qa-compact-card" data-compact-site-id="${esc(site.id)}">
      <div class="qa-compact-card__top"><span class="qa-compact-card__index">${String(index+1).padStart(2,'0')}</span><span class="qa-compact-card__category">${esc(meta.category)}</span></div>
      <h3>${esc(meta.title)}</h3>
      <p class="qa-compact-card__client">${esc(meta.client)}</p>
      <a class="qa-compact-card__link" href="${esc(meta.url)}" target="_blank" rel="noopener noreferrer"><span>${esc(meta.domain||meta.url)}</span>↗</a>
      <div class="qa-compact-note">
        <label>기록</label>
        <textarea data-compact-note placeholder="수정사항이나 확인할 내용을 간단히 기록하세요.">${esc(note)}</textarea>
        <div class="qa-compact-note__footer"><span class="qa-compact-note__state" data-compact-state>${state}</span><button class="qa-compact-save" type="button" data-compact-save>기록 저장</button></div>
      </div>
    </article>`;
  }).join('');
}

async function saveNote(card){
  const id=card?.dataset.compactSiteId;
  const textarea=card?.querySelector('[data-compact-note]');
  const button=card?.querySelector('[data-compact-save]');
  const state=card?.querySelector('[data-compact-state]');
  if(!id||!textarea||!api?.auth?.currentUser)return;
  const oldText=button?.textContent||'기록 저장';
  if(button){button.disabled=true;button.textContent='저장 중...'}
  try{
    const text=textarea.value.trim();
    const stamp=nowIso();
    await api.setDoc(api.doc(api.db,'qaSites',id),{
      quickNote:text,
      quickNoteUpdatedAt:api.serverTimestamp(),
      quickNoteUpdatedAtText:stamp,
      updatedAt:api.serverTimestamp(),
      updatedAtText:stamp,
      updatedByUid:currentUser.uid
    },{merge:true});
    if(state)state.textContent=`최근 기록 ${stamp.slice(0,10)}`;
    toast('사이트 기록을 저장했습니다.');
  }catch(error){
    console.error('사이트 기록 저장 실패',error);
    toast(String(error?.code||'').includes('permission-denied')?'사이트 기록 저장 권한을 확인해주세요.':'사이트 기록을 저장하지 못했습니다.');
  }finally{
    if(button){button.disabled=false;button.textContent=oldText}
  }
}

function handleRootClick(event){
  const save=event.target.closest('[data-compact-save]');
  if(save){
    saveNote(save.closest('[data-compact-site-id]'));
  }
}

function stop(){
  unsubscribe?.();
  unsubscribe=null;
  sites=[];
  render();
}

async function start(user){
  stop();
  currentUser=user;
  if(!user)return;
  await seedPortfolioSites();
  unsubscribe=api.onSnapshot(api.collection(api.db,'qaSites'),snap=>{
    sites=snap.docs.map(d=>({id:d.id,...d.data()}));
    render();
  },error=>{
    console.error('사이트 관리 목록 불러오기 실패',error);
    toast('사이트 목록을 불러오지 못했습니다.');
  });
}

function init(){
  const wait=()=>{
    api=window.NineworksFirebase;
    if(!api)return setTimeout(wait,80);
    const pageWait=()=>{
      if(!ensurePage())return setTimeout(pageWait,80);
      api.onAuthStateChanged(api.auth,start);
    };
    pageWait();
  };
  wait();
}

window.NineworksQAState={getSiteId:()=>'',getChecklist:()=>({}),refresh:()=>render()};

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
