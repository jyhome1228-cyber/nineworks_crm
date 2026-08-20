const qaCompactStyle=document.createElement('style');
qaCompactStyle.textContent=`
.qa-page.qa-compact-active>.qa-summary,
.qa-page.qa-compact-active>.qa-guide,
.qa-page.qa-compact-active>.qa-panel{display:none!important}
.qa-page.qa-compact-active .qa-heading{margin-bottom:22px;align-items:flex-end}
.qa-page.qa-compact-active .qa-heading .eyebrow{font-size:11px;letter-spacing:.12em}
.qa-page.qa-compact-active .qa-heading h1{margin-top:7px;font-size:36px;line-height:1.08;letter-spacing:-.045em}
.qa-page.qa-compact-active .qa-heading p:not(.eyebrow){max-width:760px;margin-top:10px;color:#92929b;font-size:15px;line-height:1.65}
.qa-page.qa-compact-active .qa-heading-actions #qaAddSite{display:none!important}
.qa-compact-root{display:grid;gap:15px}
.qa-qa-guide{border:1px solid var(--line-soft);border-radius:12px;background:#1c1c20;overflow:hidden}
.qa-qa-guide__summary{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:20px;cursor:pointer;list-style:none}
.qa-qa-guide__summary::-webkit-details-marker{display:none}
.qa-qa-guide__copy{display:grid;gap:5px}
.qa-qa-guide__copy strong{color:#f2f2f4;font-size:17px;letter-spacing:-.025em}
.qa-qa-guide__copy span{color:#8e8e98;font-size:13px;line-height:1.55}
.qa-qa-guide__more{flex:0 0 auto;color:#b9c3ff;font-size:12px;font-weight:700}
.qa-qa-guide[open] .qa-qa-guide__more::after{content:'접기'}
.qa-qa-guide:not([open]) .qa-qa-guide__more::after{content:'상세히 보기'}
.qa-qa-guide__body{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:1px;border-top:1px solid var(--line-soft);background:var(--line-soft)}
.qa-qa-guide__item{min-height:120px;padding:17px 18px;background:#1d1d21}
.qa-qa-guide__item b{display:block;margin-bottom:7px;color:#ededf0;font-size:13px}
.qa-qa-guide__item p{margin:0;color:#85858f;font-size:11.5px;line-height:1.6}
.qa-compact-toolbar{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 20px;border:1px solid var(--line-soft);border-radius:12px;background:#1c1c20}
.qa-compact-toolbar__title{display:flex;align-items:baseline;gap:10px}
.qa-compact-toolbar__title strong{color:#f2f2f4;font-size:19px;letter-spacing:-.025em}
.qa-compact-toolbar__title span{color:#73737d;font-size:12px}
.qa-compact-toolbar__actions{display:flex;gap:8px;align-items:center}
.qa-compact-search{width:250px;height:42px;border:1px solid #34343b;border-radius:8px;padding:0 12px;background:#232328;color:#efeff2;font-size:13px;outline:0}
.qa-compact-search:focus{border-color:rgba(85,119,255,.7);box-shadow:0 0 0 3px rgba(67,104,245,.08)}
.qa-compact-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.qa-compact-card{display:flex;min-height:218px;flex-direction:column;border:1px solid var(--line-soft);border-radius:12px;padding:20px;background:linear-gradient(145deg,rgba(31,31,35,.98),rgba(25,25,28,.98));cursor:pointer;transition:border-color .16s ease,transform .16s ease,background .16s ease}
.qa-compact-card:hover{border-color:#44444d;background:#202025;transform:translateY(-1px)}
.qa-compact-card__top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:20px}
.qa-compact-card__index{color:#676771;font-size:11px;font-weight:700;letter-spacing:.06em}
.qa-compact-card__category{overflow:hidden;max-width:70%;color:#7e7e88;font-size:10.5px;font-weight:700;letter-spacing:.055em;text-overflow:ellipsis;white-space:nowrap}
.qa-compact-card h3{margin:0;color:#f3f3f5;font-size:20px;line-height:1.25;font-weight:740;letter-spacing:-.035em}
.qa-compact-card__client{margin:7px 0 0;color:#94949d;font-size:13px;line-height:1.45}
.qa-compact-card__footer{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-top:auto;padding-top:22px}
.qa-compact-card__domain{display:inline-flex;align-items:center;gap:5px;color:#b7c2ff;font-size:13px;font-weight:650;text-decoration:none}
.qa-compact-card__domain:hover{color:#d8deff}
.qa-compact-card__status{display:inline-flex;min-height:27px;align-items:center;border:1px solid #3a3a42;border-radius:999px;padding:0 9px;color:#9b9ba4;font-size:10px;font-weight:700}
.qa-compact-card__status.is-done{border-color:rgba(78,190,126,.38);color:#9ed9b7}
.qa-compact-card__status.is-retest{border-color:rgba(255,184,76,.4);color:#e8c58a}
.qa-compact-card__status.is-issue{border-color:rgba(255,108,108,.4);color:#ffaaaa}
.qa-compact-card__hint{margin-top:13px;color:#6f6f78;font-size:11px}
.qa-compact-empty{grid-column:1/-1;padding:60px 20px;border:1px solid var(--line-soft);border-radius:12px;color:#707079;text-align:center;font-size:13px}
.qa-detail{display:grid;gap:14px}
.qa-detail[hidden]{display:none!important}
.qa-detail-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding:22px;border:1px solid var(--line-soft);border-radius:12px;background:#1c1c20}
.qa-detail-head__main{display:grid;gap:6px}
.qa-detail-head__meta{color:#7c7c86;font-size:10.5px;font-weight:700;letter-spacing:.08em}
.qa-detail-head h2{margin:0;color:#f5f5f7;font-size:30px;line-height:1.15;letter-spacing:-.045em}
.qa-detail-head p{margin:0;color:#91919b;font-size:13px}
.qa-detail-head__actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.qa-detail-link{display:inline-flex;min-height:40px;align-items:center;border:1px solid #3b3b43;border-radius:8px;padding:0 13px;background:#242429;color:#c9d1ff;font-size:12px;font-weight:700;text-decoration:none}
.qa-detail-link:hover{border-color:#4a4a56;color:#fff}
.qa-detail-body{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(300px,.8fr);gap:14px;align-items:start}
.qa-detail-panel{border:1px solid var(--line-soft);border-radius:12px;background:#1c1c20;overflow:hidden}
.qa-detail-panel__head{padding:18px 20px;border-bottom:1px solid var(--line-soft)}
.qa-detail-panel__head h3{margin:0;color:#efeff2;font-size:17px;letter-spacing:-.025em}
.qa-detail-panel__head p{margin:5px 0 0;color:#7f7f89;font-size:11.5px;line-height:1.55}
.qa-detail-checks{display:grid}
.qa-detail-check-row{display:grid;grid-template-columns:minmax(0,1fr) 145px 145px;align-items:center;min-height:62px;border-bottom:1px solid var(--line-soft)}
.qa-detail-check-row:last-child{border-bottom:0}
.qa-detail-check-row>div{padding:12px 16px}
.qa-detail-check-row>div+div{border-left:1px solid var(--line-soft)}
.qa-detail-check-label strong{display:block;color:#d9d9de;font-size:13px}
.qa-detail-check-label span{display:block;margin-top:3px;color:#70707a;font-size:10.5px}
.qa-detail-check-title{color:#777781;font-size:10px;font-weight:700;text-align:center}
.qa-detail-select{width:100%;height:38px;border:1px solid #383840;border-radius:8px;padding:0 9px;background:#242429;color:#c8c8cf;font-size:11.5px;outline:0}
.qa-detail-select[data-state="ok"]{border-color:rgba(78,190,126,.4);color:#9ed9b7}
.qa-detail-select[data-state="issue"]{border-color:rgba(255,108,108,.42);color:#ffaaaa}
.qa-detail-select[data-state="none"]{color:#74747e}
.qa-detail-side{display:grid;gap:14px}
.qa-detail-form{display:grid;gap:14px;padding:20px}
.qa-detail-field{display:grid;gap:7px}
.qa-detail-field>span{color:#aaaab2;font-size:11px;font-weight:650}
.qa-detail-field select,.qa-detail-field textarea{width:100%;border:1px solid #383840;border-radius:8px;background:#242429;color:#eeeef1;outline:0}
.qa-detail-field select{height:42px;padding:0 11px}
.qa-detail-field textarea{min-height:210px;padding:13px 14px;font-family:"Pretendard",sans-serif;font-size:13px;line-height:1.65;resize:vertical}
.qa-detail-field select:focus,.qa-detail-field textarea:focus{border-color:rgba(85,119,255,.7);box-shadow:0 0 0 3px rgba(67,104,245,.08)}
.qa-detail-save-row{display:flex;align-items:center;justify-content:space-between;gap:10px}
.qa-detail-updated{color:#6f6f78;font-size:10.5px}
.qa-detail-save{min-height:40px;border:0;border-radius:8px;padding:0 16px;background:var(--primary);color:#fff;font-size:12px;font-weight:750;cursor:pointer}
.qa-detail-save:disabled{opacity:.55;cursor:default}
@media(max-width:1120px){.qa-compact-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.qa-qa-guide__body{grid-template-columns:repeat(2,minmax(0,1fr))}.qa-detail-body{grid-template-columns:1fr}}
@media(max-width:760px){
  .qa-page.qa-compact-active .qa-heading{align-items:flex-start}.qa-page.qa-compact-active .qa-heading h1{font-size:30px}
  .qa-qa-guide__summary{align-items:flex-start;flex-direction:column}.qa-qa-guide__body{grid-template-columns:1fr}
  .qa-compact-toolbar{align-items:stretch;flex-direction:column}.qa-compact-toolbar__actions{width:100%}.qa-compact-search{width:auto;flex:1}.qa-compact-grid{grid-template-columns:1fr}
  .qa-detail-head{flex-direction:column}.qa-detail-head__actions{width:100%;justify-content:flex-start}.qa-detail-head h2{font-size:26px}
  .qa-detail-check-row{grid-template-columns:minmax(150px,1fr) 112px 112px}.qa-detail-check-row>div{padding:10px}.qa-detail-check-title{font-size:9px}
}
@media(max-width:560px){.qa-detail-panel{overflow-x:auto}.qa-detail-checks{min-width:520px}}
`;
document.head.appendChild(qaCompactStyle);

const $=(s,r=document)=>r.querySelector(s);
const esc=(v='')=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const nowIso=()=>new Date().toISOString();
const STATUS_LABEL={testing:'검수 전',retest:'재검수',done:'완료',issue:'문제 있음'};
const CHECKS=[
  ['navigation','메뉴 · 버튼 · 링크','이동, CTA, 외부 링크'],
  ['responsive','화면 · 반응형','잘림, 겹침, 터치 영역'],
  ['content','글자 · 이미지 · 정보','오탈자, 이미지, 연락처, 가격'],
  ['forms','문의 · 가입 · 입력폼','필수값, 오류문구, 제출'],
  ['function','주요 기능 · 예외','팝업, 주문, 예약, 빈 화면']
];

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

let api=null,currentUser=null,sites=[],unsubscribe=null,searchText='',seededFor='',selectedSiteId='';

function normalizeUrl(value=''){
  try{const url=new URL(/^https?:\/\//i.test(value)?value:`https://${value}`);return `${url.hostname.replace(/^www\./,'')}${url.pathname.replace(/\/$/,'')}`.toLowerCase()}catch{return String(value||'').trim().toLowerCase()}
}
function toast(message){const el=$('#toast');if(!el)return;el.textContent=message;el.classList.add('is-visible');clearTimeout(window.__qaCompactToast);window.__qaCompactToast=setTimeout(()=>el.classList.remove('is-visible'),2200)}
function qaHash(id=''){return id?`#qa/site/${encodeURIComponent(id)}`:'#qa'}
function hashSiteId(){const match=location.hash.match(/^#qa\/site\/(.+)$/);return match?decodeURIComponent(match[1]):''}
function statusLabel(status){return STATUS_LABEL[status]||STATUS_LABEL.testing}
function statusClass(status){if(status==='done')return'is-done';if(status==='retest')return'is-retest';if(status==='issue')return'is-issue';return''}

function ensurePage(){
  const page=$('#qaPage');
  if(!page)return false;
  page.classList.add('qa-compact-active');
  const heading=page.querySelector('.qa-heading');
  if(heading){
    const eyebrow=heading.querySelector('.eyebrow');
    const title=heading.querySelector('h1');
    const desc=heading.querySelector('p:not(.eyebrow)');
    if(eyebrow)eyebrow.textContent='WEBSITE QA';
    if(title)title.textContent='웹사이트 QA';
    if(desc)desc.textContent='운영 중인 사이트를 빠르게 열어보고, WEB · MOBILE 기준으로 필요한 내용만 간단히 기록합니다.';
  }
  const entry=$('#openQaManagement');
  if(entry)entry.textContent='웹사이트 QA';
  if(!$('#qaCompactRoot')){
    const root=document.createElement('section');
    root.id='qaCompactRoot';
    root.className='qa-compact-root';
    root.innerHTML=`
      <details class="qa-qa-guide">
        <summary class="qa-qa-guide__summary">
          <div class="qa-qa-guide__copy"><strong>QA는 이렇게 확인하면 됩니다.</strong><span>사이트를 실제 사용자처럼 처음부터 끝까지 이용하면서 WEB · MOBILE을 각각 확인합니다.</span></div>
          <span class="qa-qa-guide__more"></span>
        </summary>
        <div class="qa-qa-guide__body">
          <div class="qa-qa-guide__item"><b>01. 이동</b><p>메뉴, 로고, 버튼, CTA와 외부 링크가 정확한 페이지로 이동하는지 확인합니다.</p></div>
          <div class="qa-qa-guide__item"><b>02. 화면</b><p>PC와 모바일에서 글자·이미지·버튼이 잘리거나 겹치지 않는지 확인합니다.</p></div>
          <div class="qa-qa-guide__item"><b>03. 내용</b><p>오탈자, 가격, 연락처, 운영시간, 이미지 화질처럼 실제 노출 정보를 확인합니다.</p></div>
          <div class="qa-qa-guide__item"><b>04. 기능</b><p>문의·가입·주문·예약·팝업 등 해당 사이트의 핵심 기능을 직접 끝까지 실행합니다.</p></div>
          <div class="qa-qa-guide__item"><b>05. 기록</b><p>문제가 있으면 어느 화면에서 어떤 현상이 생기는지 짧게 적고 수정 후 다시 확인합니다.</p></div>
        </div>
      </details>
      <div id="qaCompactListView">
        <div class="qa-compact-toolbar">
          <div class="qa-compact-toolbar__title"><strong>QA 사이트</strong><span id="qaCompactCount">0개</span></div>
          <div class="qa-compact-toolbar__actions"><input id="qaCompactSearch" class="qa-compact-search" type="search" placeholder="사이트 검색"><button id="qaCompactAdd" class="button button--ghost" type="button">＋ 사이트</button></div>
        </div>
        <div id="qaCompactGrid" class="qa-compact-grid"><div class="qa-compact-empty">사이트 목록을 불러오는 중입니다.</div></div>
      </div>
      <section id="qaCompactDetail" class="qa-detail" hidden></section>`;
    heading?.insertAdjacentElement('afterend',root);
    $('#qaCompactSearch')?.addEventListener('input',e=>{searchText=e.target.value.trim().toLowerCase();renderList()});
    $('#qaCompactAdd')?.addEventListener('click',()=>$('#qaAddSite')?.click());
    root.addEventListener('click',handleRootClick);
    root.addEventListener('change',handleRootChange);
  }
  return true;
}

function matchProject(project,rows){
  const targetUrl=normalizeUrl(project.url);
  return rows.find(row=>row.sostProjectId===project.id||normalizeUrl(row.url||row.siteUrl||'')===targetUrl||String(row.name||row.siteName||'').trim().toLowerCase()===project.title.toLowerCase());
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
        if(!existing.sostProjectId)writes.push(api.setDoc(api.doc(api.db,'qaSites',existing.id),{sostProjectId:project.id,source:'sost-portfolio',displayDomain:project.domain,categoryLabel:project.category},{merge:true}));
        return;
      }
      const id=`sost_${project.id.replace(/[^a-z0-9_-]/gi,'_')}`;
      writes.push(api.setDoc(api.doc(api.db,'qaSites',id),{id,name:project.title,siteName:project.title,client:project.client,url:project.url,siteUrl:project.url,siteType:project.type,status:'testing',tester:'',note:'',quickNote:'',quickChecklist:{},sostProjectId:project.id,source:'sost-portfolio',displayDomain:project.domain,categoryLabel:project.category,createdAt:api.serverTimestamp(),createdAtText:nowIso(),updatedAt:api.serverTimestamp(),updatedAtText:nowIso()},{merge:true}));
    });
    if(writes.length)await Promise.all(writes);
  }catch(error){console.error('SOST 포트폴리오 사이트 등록 실패',error);toast('사이트 목록을 준비하지 못했습니다.')}
}

function projectMeta(site){
  const project=SOST_SITES.find(p=>p.id===site.sostProjectId)||SOST_SITES.find(p=>normalizeUrl(p.url)===normalizeUrl(site.url||site.siteUrl||''));
  if(project)return project;
  let domain='';
  try{domain=new URL(site.url||site.siteUrl||'').hostname.replace(/^www\./,'')}catch{domain=site.displayDomain||''}
  return {id:site.id,title:site.name||site.siteName||'사이트',client:site.client||'',url:site.url||site.siteUrl||'#',domain:site.displayDomain||domain,category:site.categoryLabel||'CUSTOM SITE'};
}
function orderedSites(){
  const rank=new Map(SOST_SITES.map((p,i)=>[p.id,i]));
  return [...sites].sort((a,b)=>{const ar=rank.has(a.sostProjectId)?rank.get(a.sostProjectId):999;const br=rank.has(b.sostProjectId)?rank.get(b.sostProjectId):999;if(ar!==br)return ar-br;return String(a.name||a.siteName||'').localeCompare(String(b.name||b.siteName||''),'ko')});
}

function renderList(){
  if(!ensurePage())return;
  const grid=$('#qaCompactGrid');
  if(!grid)return;
  const list=orderedSites().filter(site=>{if(!searchText)return true;const meta=projectMeta(site);return `${meta.title} ${meta.client} ${meta.domain}`.toLowerCase().includes(searchText)});
  $('#qaCompactCount').textContent=`${sites.length}개`;
  if(!list.length){grid.innerHTML='<div class="qa-compact-empty">검색 결과가 없습니다.</div>';return}
  grid.innerHTML=list.map((site,index)=>{
    const meta=projectMeta(site);
    const updated=site.quickNoteUpdatedAtText||site.updatedAtText||'';
    return `<article class="qa-compact-card" data-open-qa-site="${esc(site.id)}" tabindex="0" role="button" aria-label="${esc(meta.title)} QA 상세 보기">
      <div class="qa-compact-card__top"><span class="qa-compact-card__index">${String(index+1).padStart(2,'0')}</span><span class="qa-compact-card__category">${esc(meta.category)}</span></div>
      <h3>${esc(meta.title)}</h3><p class="qa-compact-card__client">${esc(meta.client)}</p>
      <div class="qa-compact-card__footer"><a class="qa-compact-card__domain" href="${esc(meta.url)}" target="_blank" rel="noopener noreferrer" data-external-site>${esc(meta.domain||meta.url)} ↗</a><span class="qa-compact-card__status ${statusClass(site.status)}">${esc(statusLabel(site.status))}</span></div>
      <div class="qa-compact-card__hint">${updated?`최근 기록 ${esc(updated.slice(0,10))}`:'카드를 눌러 QA 기록하기'} · 상세 보기 →</div>
    </article>`;
  }).join('');
}

function checkSelect(key,site){
  const value=String(site.quickChecklist?.[key]||'');
  return `<select class="qa-detail-select" data-qa-check-key="${key}" data-state="${esc(value)}"><option value="" ${!value?'selected':''}>미확인</option><option value="ok" ${value==='ok'?'selected':''}>정상</option><option value="issue" ${value==='issue'?'selected':''}>문제</option><option value="none" ${value==='none'?'selected':''}>해당 없음</option></select>`;
}

function renderDetail(){
  const detail=$('#qaCompactDetail');
  const listView=$('#qaCompactListView');
  if(!detail||!listView)return;
  const site=sites.find(x=>x.id===selectedSiteId);
  if(!site){selectedSiteId='';detail.hidden=true;listView.hidden=false;return}
  const meta=projectMeta(site);
  const updated=site.quickNoteUpdatedAtText||site.updatedAtText||'';
  listView.hidden=true;detail.hidden=false;
  detail.innerHTML=`
    <div class="qa-detail-head">
      <div class="qa-detail-head__main"><div class="qa-detail-head__meta">${esc(meta.category)} · WEBSITE QA</div><h2>${esc(meta.title)}</h2><p>${esc(meta.client)}</p></div>
      <div class="qa-detail-head__actions"><button class="button button--ghost" type="button" data-qa-back>← 사이트 목록</button><a class="qa-detail-link" href="${esc(meta.url)}" target="_blank" rel="noopener noreferrer">사이트 열기 ↗</a></div>
    </div>
    <div class="qa-detail-body">
      <section class="qa-detail-panel">
        <div class="qa-detail-panel__head"><h3>간단 QA 체크</h3><p>WEB과 MOBILE을 각각 확인하고 정상 · 문제 · 해당 없음만 선택합니다.</p></div>
        <div class="qa-detail-checks">
          <div class="qa-detail-check-row"><div class="qa-detail-check-label"><strong>확인 항목</strong><span>실제 사용자 흐름 기준</span></div><div class="qa-detail-check-title">WEB</div><div class="qa-detail-check-title">MOBILE</div></div>
          ${CHECKS.map(([key,label,desc])=>`<div class="qa-detail-check-row"><div class="qa-detail-check-label"><strong>${esc(label)}</strong><span>${esc(desc)}</span></div><div>${checkSelect(`${key}_desktop`,site)}</div><div>${checkSelect(`${key}_mobile`,site)}</div></div>`).join('')}
        </div>
      </section>
      <div class="qa-detail-side">
        <section class="qa-detail-panel"><div class="qa-detail-panel__head"><h3>QA 기록</h3><p>문제 위치나 수정할 내용을 짧게 적어두면 됩니다.</p></div><div class="qa-detail-form">
          <label class="qa-detail-field"><span>현재 상태</span><select id="qaDetailStatus"><option value="testing" ${site.status==='testing'?'selected':''}>검수 전 / 진행 중</option><option value="issue" ${site.status==='issue'?'selected':''}>문제 있음</option><option value="retest" ${site.status==='retest'?'selected':''}>재검수</option><option value="done" ${site.status==='done'?'selected':''}>완료</option></select></label>
          <label class="qa-detail-field"><span>메모</span><textarea id="qaDetailNote" placeholder="예) 모바일 상품 상세에서 옵션 버튼 간격 수정 필요. 수정 후 재확인.">${esc(site.quickNote??site.note??'')}</textarea></label>
          <div class="qa-detail-save-row"><span class="qa-detail-updated">${updated?`최근 저장 ${esc(updated.slice(0,10))}`:'아직 저장된 기록이 없습니다.'}</span><button class="qa-detail-save" type="button" data-qa-detail-save>QA 기록 저장</button></div>
        </div></section>
      </div>
    </div>`;
  detail.querySelectorAll('[data-qa-check-key]').forEach(select=>select.addEventListener('change',()=>select.dataset.state=select.value));
  detail.scrollIntoView({block:'start',behavior:'smooth'});
}

async function saveDetail(){
  const site=sites.find(x=>x.id===selectedSiteId);
  const button=$('[data-qa-detail-save]');
  if(!site||!api?.auth?.currentUser||!button)return;
  const oldText=button.textContent;button.disabled=true;button.textContent='저장 중...';
  try{
    const quickChecklist={};
    document.querySelectorAll('#qaCompactDetail [data-qa-check-key]').forEach(select=>{quickChecklist[select.dataset.qaCheckKey]=select.value||''});
    const stamp=nowIso();
    await api.setDoc(api.doc(api.db,'qaSites',site.id),{status:$('#qaDetailStatus')?.value||'testing',quickNote:$('#qaDetailNote')?.value.trim()||'',quickChecklist,quickNoteUpdatedAt:api.serverTimestamp(),quickNoteUpdatedAtText:stamp,updatedAt:api.serverTimestamp(),updatedAtText:stamp,updatedByUid:currentUser.uid},{merge:true});
    toast('QA 기록을 저장했습니다.');
  }catch(error){console.error('QA 기록 저장 실패',error);toast(String(error?.code||'').includes('permission-denied')?'QA 기록 저장 권한을 확인해주세요.':'QA 기록을 저장하지 못했습니다.')}finally{button.disabled=false;button.textContent=oldText}
}

function openDetail(id,push=true){selectedSiteId=id;if(push&&location.hash!==qaHash(id))history.pushState(null,'',qaHash(id));renderDetail()}
function closeDetail(push=true){selectedSiteId='';if(push&&location.hash.startsWith('#qa/site/'))history.pushState(null,'',qaHash());$('#qaCompactDetail').hidden=true;$('#qaCompactListView').hidden=false;$('#qaCompactListView').scrollIntoView({block:'start',behavior:'smooth'})}
function handleRootClick(event){
  if(event.target.closest('[data-external-site]'))return;
  if(event.target.closest('[data-qa-back]')){closeDetail();return}
  if(event.target.closest('[data-qa-detail-save]')){saveDetail();return}
  const card=event.target.closest('[data-open-qa-site]');if(card)openDetail(card.dataset.openQaSite);
}
function handleRootChange(event){const select=event.target.closest('[data-qa-check-key]');if(select)select.dataset.state=select.value}

function syncFromHash(){const id=hashSiteId();if(id&&sites.some(x=>x.id===id)){selectedSiteId=id;renderDetail()}else if(selectedSiteId){closeDetail(false)}}
function stop(){unsubscribe?.();unsubscribe=null;sites=[];renderList()}
async function start(user){
  stop();currentUser=user;if(!user)return;await seedPortfolioSites();
  unsubscribe=api.onSnapshot(api.collection(api.db,'qaSites'),snap=>{sites=snap.docs.map(d=>({id:d.id,...d.data()}));renderList();syncFromHash();if(selectedSiteId)renderDetail()},error=>{console.error('웹사이트 QA 목록 불러오기 실패',error);toast('사이트 목록을 불러오지 못했습니다.')});
}
function init(){
  const wait=()=>{api=window.NineworksFirebase;if(!api)return setTimeout(wait,80);const pageWait=()=>{if(!ensurePage())return setTimeout(pageWait,80);api.onAuthStateChanged(api.auth,start)};pageWait()};wait();
  window.addEventListener('popstate',syncFromHash);
  window.addEventListener('hashchange',syncFromHash);
  document.addEventListener('keydown',event=>{const card=event.target.closest?.('[data-open-qa-site]');if(card&&(event.key==='Enter'||event.key===' ')){event.preventDefault();openDetail(card.dataset.openQaSite)}});
}

window.NineworksQAState={getSiteId:()=>selectedSiteId,getChecklist:()=>sites.find(x=>x.id===selectedSiteId)?.quickChecklist||{},refresh:()=>selectedSiteId?renderDetail():renderList()};

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();