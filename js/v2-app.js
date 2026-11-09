import {
  auth, db, collection, doc, getDoc, setDoc, onSnapshot, serverTimestamp,
  signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "./v2-firebase.js";

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const esc = (v="") => String(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
const won = v => Math.round(Number(v||0)).toLocaleString("ko-KR")+"원";
const uid = p => `${p}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;

const BUSINESS_DEFAULTS = [
  {id:"nineworks",name:"9WORKS",label:"DESIGN & BRANDING",summary:"브랜드 전략, 아이덴티티, 패키지, 웹과 운영 디자인을 수행하는 디자인 사업.",workSections:[
    {title:"브랜딩",items:["브랜드 전략","BI·CI","패키지","비주얼 시스템"]},
    {title:"디지털",items:["웹사이트","상세페이지","브랜드 콘텐츠","운영 디자인"]},
    {title:"확장",items:["NINEWORKS PRINTING","프로젝트 운영 시스템","AI 제작 워크플로"]}
  ]},
  {id:"aesost",name:"AESOST",label:"WEB & DEVELOPMENT",summary:"기업 홈페이지부터 업무 시스템까지 구축하는 웹·비즈니스 시스템 개발 사업.",workSections:[
    {title:"웹 개발",items:["기업 홈페이지","랜딩페이지","반응형 구축"]},
    {title:"시스템",items:["CRM","관리자 시스템","업무 자동화","AI 기능 연계"]}
  ]},
  {id:"aesost-place",name:"AESOST PLACE",label:"PROPERTY & SPACE",summary:"상가 임대와 공간 운영, 부동산 자산 관리를 위한 사업.",workSections:[
    {title:"임대 운영",items:["상가 임대","임대료 일정","관리비","계약·갱신"]},
    {title:"자산",items:["현금흐름","공간 유지관리","향후 경매·부동산 투자"]}
  ]},
  {id:"solarbiz",name:"SOLARBIZ",label:"SMALL BUSINESS TOOL",summary:"1인 자영업자와 소기업을 위한 매출·세금계산서·운영관리 서비스.",workSections:[
    {title:"매출",items:["카드매출","일반 매출","월·분기 현황"]},
    {title:"문서",items:["세금계산서","PDF 자동 분류","거래처 연결"]},
    {title:"운영",items:["비용","미수금","사업 대시보드"]}
  ]},
  {id:"growfarmers",name:"GROW FARMERS",label:"LOCAL & AGRI BRANDING",summary:"농산물·농가를 브랜드, 패키지, 콘텐츠와 판매 기회로 연결하는 로컬 브랜딩 사업.",workSections:[
    {title:"브랜딩",items:["생산자 분석","전략","아이덴티티","패키지"]},
    {title:"콘텐츠",items:["상품 비주얼","소개 콘텐츠","상세 콘텐츠"]},
    {title:"연결",items:["농가·협업처","유통·판매 기회"]}
  ]},
  {id:"jeongwol",name:"정월재",label:"FORTUNE SERVICE",summary:"오늘의 운세, 인연, 궁합, 재물, 부적 등을 쉽고 재미있게 제공하는 자체 서비스.",workSections:[
    {title:"운세",items:["오늘의 운세","내일의 운세","인연·궁합","일·재물","정월도감"]},
    {title:"콘텐츠",items:["총평","재물","애정","직장","학업","건강"]},
    {title:"확장",items:["정월부적","정월록","숫자 기능","결과 UX"]}
  ]}
];

const state = {
  user:null, profile:null, route:"home", filter:"open", search:"",
  projects:[], businesses:[], clients:[], events:[], contracts:[], ledger:[],
  month:new Date(), unsubs:[]
};

const STATUS = {
  active:["진행중",""], review:["검수중","review"], waiting:["대기","waiting"],
  done:["완료","waiting"], hold:["보류","waiting"], planned:["예정","waiting"], progress:["진행중",""]
};

function cleanup(){ state.unsubs.forEach(f=>f?.()); state.unsubs=[]; }
function toast(message){
  const el=$("#toast"); if(!el)return; el.textContent=message; el.classList.remove("hidden");
  clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.add("hidden"),2200);
}
function todayKey(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function parseDate(key){if(!key)return null;const d=new Date(key+"T00:00:00");return Number.isNaN(d.getTime())?null:d;}
function daysUntil(key){const d=parseDate(key);if(!d)return null;const n=new Date();n.setHours(0,0,0,0);return Math.round((d-n)/86400000);}
function dueLabel(p){
  if(p.dueLabel) return p.dueLabel;
  const n=daysUntil(p.due); if(n===null)return "일정 미정"; if(n===0)return "D-DAY"; if(n>0)return `D-${n}`; return `${Math.abs(n)}일 지연`;
}
function tone(item){
  const k=(item.id||item.name||"").toLowerCase();
  if(/bitess/.test(k))return "red";
  if(/terra|grow|solar/.test(k))return "green";
  if(/ggm|health|daily|ode|aesost/.test(k))return "blue";
  if(/nineworks|crm/.test(k))return "dark";
  return "warm";
}
function statusMarkup(status){
  const [label,cls]=STATUS[status]||STATUS.active;
  return `<span class="status ${cls}">${label}</span>`;
}
function cover(item){
  if(item.imageUrl) return `<div class="cover" style="padding:0"><img src="${esc(item.imageUrl)}" alt="" style="width:100%;height:100%;object-fit:cover"></div>`;
  return `<div class="cover" data-tone="${tone(item)}"><span>${esc(item.client||item.label||"PROJECT")}</span><strong>${esc(item.name)}</strong></div>`;
}
function received(c){
  if(c.contractType==="monthly") return Number(c.payments?.monthly?.amount||0);
  return ["advance","balance"].reduce((n,k)=>n+(c.payments?.[k]?.paid?Number(c.payments[k].amount||0):0),0);
}
function supply(c){return Number(c.supplyAmount??c.contractAmount??0)}
function bill(c){const s=supply(c);return s+(c.vatSeparate===false?0:Math.round(s*.1))}
function outstanding(c){return Math.max(0,bill(c)-received(c))}
function reserve(){return state.ledger.reduce((n,x)=>x.type==="expense"?n-Math.abs(Number(x.amount||0)):n+Number(x.amount||0),0)}

function loginView(){
  return `
  <div class="login-shell">
    <section class="login-brand">
      <img src="./assets/nineworks-logo.svg" alt="NINEWORKS">
      <div><p class="eyebrow">PROJECT OPERATING SYSTEM</p><h1>Work.<br>Clear.</h1><p>프로젝특, 클라이언트, 일정과 계약을 하나의 흐름으로 관리합니다.</p></div>
      <small style="color:#686863;font-size:10px">NINEWORKS · INTERNAL WORKSPACE</small>
    </section>
    <section class="login-form-wrap">
      <form id="loginForm" class="login-card">
        <p class="eyebrow">ADMIN WORKSPACE</p><h2>로그인</h2><p>등록된 나인웍스 계정으로 접속하세요.</p>
        <label class="field"><span>이메일</span><input id="loginEmail" type="email" autocomplete="email" required placeholder="admin@nineworks.kr"></label>
        <label class="field"><span>비밀번호</span><input id="loginPassword" type="password" autocomplete="current-password" required placeholder="Password"></label>
        <button class="btn primary full" type="submit">로그인</button>
        <p id="loginMsg" class="login-msg"></p>
      </form>
    </section>
  </div>`;
}

function shellView(){
  return `
  <div class="shell">
    <aside class="sidebar">
      <button class="logo-btn" data-route="home"><img src="./assets/nineworks-logo.svg" alt="NINEWORKS"></button>
      <nav class="nav">
        <button data-route="home" class="active">HOME <span>01</span></button>
        <button data-route="calendar">캘린더 <span>02</span></button>
        <button data-route="finance">자금 · 계약 <span>03</span></button>
        <button data-route="clients">클라이언트 <span>04</span></button>
        <button data-route="businesses">내 사업체 <span>05</span></button>
      </nav>
      <div class="sidebar-bottom">
        <div class="profile"><strong>${esc(state.profile?.name||"박재영")}</strong><span>${esc(state.profile?.role||"OWNER")}</span></div>
        <button id="themeBtn" class="btn ghost">화면 모드 전환</button>
        <button id="logoutBtn" class="btn ghost">로그아웃</button>
      </div>
    </aside>
    <main class="content">
      <header class="topbar">
        <h1 id="routeTitle">HOME</h1>
        <div class="top-actions"><input id="globalSearch" class="search" type="search" placeholder="프로젝트 · 클라이언트 검색"><button id="mobileThemeBtn" class="btn ghost">◐</button></div>
      </header>
      <div id="pageRoot"></div>
    </main>
  </div>
  <div id="drawerBackdrop" class="drawer-backdrop hidden"></div><aside id="drawer" class="drawer hidden"></aside>
  <div id="modalBackdrop" class="modal-backdrop hidden"></div><section id="modal" class="modal hidden"></section>
  <div id="toast" class="hidden" style="position:fixed;right:22px;bottom:22px;z-index:100;background:#171717;color:#fff;padding:11px 14px;border-radius:10px;font-size:11px"></div>`;
}

function projectVisible(p){
  const q=state.search.trim().toLowerCase();
  if(q && !`${p.name} ${p.client} ${p.summary} ${p.stage} ${p.nextAction}`.toLowerCase().includes(q)) return false;
  if(state.filter==="all")return true;
  if(state.filter==="focus")return p.priority==="focus"&&p.status!=="done";
  if(state.filter==="review")return p.status==="review";
  if(state.filter==="waiting")return p.status==="waiting";
  return p.status!=="done"&&p.status!=="hold";
}
function projectCard(p){
  return `<article class="project-card" data-open-project="${esc(p.id)}">
    ${cover(p)}
    <div class="card-body">
      <div class="meta"><span>${esc(p.client||"—")}</span>${statusMarkup(p.status)}</div>
      <h3>${esc(p.name)}</h3><p>${esc(p.summary||"프로젝트 설명을 입력하세요.")}</p>
      <div class="info-row"><span>현재 단계</span><strong>${esc(p.stage||"—")}</strong></div>
      <div class="info-row"><span>지금 할 일</span><strong>${esc(p.nextAction||"—")}</strong></div>
      <div class="card-footer"><span>${esc(dueLabel(p))}</span><button class="link-btn" data-open-project="${esc(p.id)}">상세보기 →</button></div>
    </div>
  </article>`;
}
function homePage(){
  const open=state.projects.filter(p=>p.status!=="done"&&p.status!=="hold").length;
  const focus=state.projects.filter(p=>p.priority==="focus"&&p.status!=="done").length;
  const review=state.projects.filter(p=>p.status==="review").length;
  const waiting=state.projects.filter(p=>p.status==="waiting").length;
  const due=state.projects.filter(p=>{const n=daysUntil(p.due);return n!==null&&n>=0&&n<=14&&p.status!=="done"}).length;
  const list=state.projects.filter(projectVisible);
  const focused=[...state.projects].filter(p=>p.status!=="done"&&p.status!=="hold").sort((a,b)=>{
    const pa=a.priority==="focus"?0:1,pb=b.priority==="focus"?0:1;if(pa!==pb)return pa-pb;
    return (daysUntil(a.due)??9999)-(daysUntil(b.due)??9999);
  }).slice(0,6);
  return `<section class="page">
    <div class="page-head"><div><p class="eyebrow">PROJECT OPERATING SYSTEM</p><h2>내 업무</h2><p>현재 진행 중인 프로젝트와 다음 액션을 한눈에 봅니다.</p></div><button class="btn primary" id="addProject">＋ 프로젝트 추가</button></div>
    <div class="summary-grid">
      <div class="summary-card"><span>진행 프로젝트</span><strong>${open}</strong><small>완료 제외</small></div>
      <div class="summary-card"><span>집중 관리</span><strong>${focus}</strong><small>우선순위 높음</small></div>
      <div class="summary-card"><span>검수 필요</span><strong>${review}</strong><small>마무리 단계</small></div>
      <div class="summary-card"><span>대기</span><strong>${waiting}</strong><small>회신·착수 대기</small></div>
      <div class="summary-card"><span>14일 내 마감</span><strong>${due}</strong><small>일정 확인</small></div>
    </div>
    <div class="two-col">
      <section class="panel"><div class="panel-head"><div><h3>프로젝트</h3><p>클라이언트 업무 중심으로 관리합니다.</p></div>
        <div class="seg">${["open","all","focus","review","waiting"].map(k=>`<button data-filter="${k}" class="${state.filter===k?"active":""}">${({open:"진행",all:"전체",focus:"집중",review:"검수",waiting:"대기"})[k]}</button>`).join("")}</div>
      </div><div class="project-grid">${list.length?list.map(projectCard).join(""):'<div class="empty">조건에 맞는 프로젝트가 없습니다.</div>'}</div></section>
      <aside class="panel"><div class="panel-head"><div><h3>지금 확인할 일</h3><p>우선순위와 마감 기준</p></div></div>
        <div class="focus-list">${focused.map(p=>`<div class="focus-item" data-open-project="${esc(p.id)}"><small>${esc(p.client)} · ${esc(p.stage||"진행")}</small><strong>${esc(p.name)}</strong><p>${esc(p.nextAction||"다음 할 일을 입력하세요.")}</p></div>`).join("")}</div>
      </aside>
    </div>
  </section>`;
}

function monthData(base){
  const y=base.getFullYear(),m=base.getMonth();const first=new Date(y,m,1);const start=new Date(y,m,1-first.getDay());const days=[];
  for(let i=0;i<42;i++){const d=new Date(start);d.setDate(start.getDate()+i);days.push(d)}return {y,m,days};
}
function eventsOn(key){return state.events.filter(e=>(e.start||"")<=key&&(e.end||e.start||"")>=key)}
function calendarPage(){
  const {y,m,days}=monthData(state.month);
  const upcoming=[...state.events].filter(e=>(e.end||e.start||"")>=todayKey()).sort((a,b)=>(a.start||"").localeCompare(b.start||"")).slice(0,12);
  return `<section class="page">
    <div class="page-head"><div><p class="eyebrow">CALENDAR</p><h2>캘린더</h2><p>프로젝트 일정의 보조 뷰입니다.</p></div><div style="display:flex;gap:7px"><button class="btn" id="prevMonth">←</button><button class="btn" id="todayMonth">오늘</button><button class="btn" id="nextMonth">→</button></div></div>
    <div class="calendar-layout">
      <section class="panel"><div class="panel-head"><div><h3>${y}년 ${m+1}월</h3><p>등록된 일정 ${state.events.length}건</p></div></div>
        <div class="calendar-scroll"><div class="month-grid">
          ${["일","월","화","수","목","금","토"].map(x=>`<div class="day-head">${x}</div>`).join("")}
          ${days.map(d=>{const key=todayKey(d),ev=eventsOn(key);return `<div class="day ${d.getMonth()!==m?"muted":""}"><div class="day-num">${d.getDate()}</div>${ev.slice(0,3).map(e=>`<span class="event-chip"><b>${esc(e.client||"")}</b>${esc(e.title||"일정")}</span>`).join("")}${ev.length>3?`<span class="event-chip">+${ev.length-3}</span>`:""}</div>`}).join("")}
        </div></div>
      </section>
      <aside class="panel"><div class="panel-head"><div><h3>다가오는 일정</h3><p>오늘 이후 일정</p></div></div><div class="agenda">${upcoming.length?upcoming.map(e=>`<div class="agenda-item"><time>${esc(e.start||"")}</time><strong>${esc(e.title||"일정")}</strong><small>${esc(e.client||"")} · ${esc(e.member||"")}</small></div>`).join(""):'<div class="empty">다가오는 일정이 없습니다.</div>'}</div></aside>
    </div>
  </section>`;
}
function financePage(){
  const total=state.contracts.reduce((n,c)=>n+bill(c),0), recv=state.contracts.reduce((n,c)=>n+received(c),0), out=state.contracts.reduce((n,c)=>n+outstanding(c),0);
  return `<section class="page">
    <div class="page-head"><div><p class="eyebrow">CONTRACT & CASH</p><h2>자금 · 계약</h2><p>기존 Firestore 계약·입금 데이터를 그대로 연결했습니다.</p></div></div>
    <div class="summary-grid">
      <div class="summary-card"><span>현재 잔고</span><strong style="font-size:20px">${won(reserve())}</strong><small>입금 − 지출</small></div>
      <div class="summary-card"><span>총 청구액</span><strong style="font-size:20px">${won(total)}</strong><small>VAT 포함</small></div>
      <div class="summary-card"><span>총 입금액</span><strong style="font-size:20px">${won(recv)}</strong><small>실제 입금</small></div>
      <div class="summary-card"><span>미수금</span><strong style="font-size:20px">${won(out)}</strong><small>미입금</small></div>
      <div class="summary-card"><span>진행 계약</span><strong>${state.contracts.filter(c=>outstanding(c)>0).length}</strong><small>잔액 남음</small></div>
    </div>
    <section class="panel"><div class="panel-head"><div><h3>계약 현황</h3><p>클라이언트와 프로젝트 기준</p></div></div><div class="table-wrap"><table class="table"><thead><tr><th>클라이언트</th><th>프로젝트</th><th>계약 유형</th><th>총 청구액</th><th>입금</th><th>미수</th><th>계약일</th></tr></thead>
      <tbody>${state.contracts.length?state.contracts.map(c=>`<tr><td><strong>${esc(c.clientName||"—")}</strong></td><td>${esc(c.projectName||"—")}</td><td>${c.contractType==="monthly"?"월단위":"선금·잔금"}</td><td>${won(bill(c))}</td><td>${won(received(c))}</td><td>${won(outstanding(c))}</td><td>${esc(c.contractDate||"—")}</td></tr>`).join(""):'<tr><td colspan="7" class="empty">계약 데이터가 없습니다.</td></tr>'}</tbody></table></div></section>
  </section>`;
}
function clientsPage(){
  const q=state.search.trim().toLowerCase();
  const rows=state.clients.filter(c=>!q||`${c.name} ${c.type} ${c.work}`.toLowerCase().includes(q));
  return `<section class="page"><div class="page-head"><div><p class="eyebrow">CLIENTS</p><h2>클라이언트</h2><p>클라이언트 → 프로젝트 → 계약 흐름으로 연결합니다.</p></div></div>
    <section class="panel"><div class="panel-head"><div><h3>클라이언트 목록</h3><p>${rows.length} CLIENTS</p></div></div><div class="table-wrap"><table class="table"><thead><tr><th>클라이언트</th><th>분류</th><th>현재 업무</th><th>프로젝트</th><th>계약</th><th>담당자</th></tr></thead><tbody>
    ${rows.length?rows.map(c=>{const ps=state.projects.filter(p=>p.client===c.name);const cs=state.contracts.filter(x=>x.clientName===c.name);return `<tr data-open-client="${esc(c.name)}"><td><strong>${esc(c.name)}</strong></td><td>${esc(c.type||"—")}</td><td>${esc(c.work||"—")}</td><td>${ps.length}건</td><td>${cs.length}건</td><td>${esc(c.member||"—")}</td></tr>`}).join(""):'<tr><td colspan="6" class="empty">클라이언트가 없습니다.</td></tr>'}
    </tbody></table></div></section></section>`;
}
function businessCard(b){return `<article class="project-card" data-open-business="${esc(b.id)}">${cover(b)}<div class="card-body"><div class="meta"><span>${esc(b.label||"OWN BUSINESS")}</span><span class="status">자체 운영</span></div><h3>${esc(b.name)}</h3><p>${esc(b.summary||"")}</p><div class="chips">${(b.workSections||[]).slice(0,2).flatMap(g=>g.items||[]).slice(0,5).map(x=>`<span class="chip">${esc(x)}</span>`).join("")}</div><div class="card-footer"><span>OWN BUSINESS</span><button class="link-btn" data-open-business="${esc(b.id)}">사업 보기 →</button></div></div></article>`}
function businessesPage(){return `<section class="page"><div class="page-head"><div><p class="eyebrow">OWN BUSINESS</p><h2>내 사업체</h2><p>외주 프로젝트와 분리해 직접 운영하는 사업·서비스를 관리합니다.</p></div></div><section class="panel"><div class="business-grid">${state.businesses.map(businessCard).join("")}</div></section></section>`}

function renderPage(){
  const root=$("#pageRoot"), titles={home:"HOME",calendar:"캘린더",finance:"자금 · 계약",clients:"클라이언트",businesses:"내 사업체"};
  $("#routeTitle").textContent=titles[state.route]||"HOME";
  $$(".nav [data-route]").forEach(b=>b.classList.toggle("active",b.dataset.route===state.route));
  root.innerHTML = state.route==="calendar"?calendarPage():state.route==="finance"?financePage():state.route==="clients"?clientsPage():state.route==="businesses"?businessesPage():homePage();
}
function renderApp(){ $("#app").innerHTML=shellView(); renderPage(); bindShell(); }

function openDrawer(html){
  $("#drawer").innerHTML=html; $("#drawer").classList.remove("hidden"); $("#drawerBackdrop").classList.remove("hidden"); document.body.style.overflow="hidden";
}
function closeDrawer(){ $("#drawer").classList.add("hidden"); $("#drawerBackdrop").classList.add("hidden"); document.body.style.overflow=""; }
function projectDrawer(id){
  const p=state.projects.find(x=>x.id===id); if(!p)return;
  const sections=Array.isArray(p.workSections)&&p.workSections.length?p.workSections:[{title:"진행 업무",items:p.workstreams||[]}];
  const recent=p.recentWork||[], next=p.nextSteps||[];
  const contracts=state.contracts.filter(c=>c.clientName===p.client && (!c.projectName||c.projectName===p.name));
  openDrawer(`<div class="drawer-head"><div><p class="eyebrow">${esc(p.client||"PROJECT")}</p><h2>${esc(p.name)}</h2></div><button class="x" data-close-drawer>×</button></div><div class="drawer-body">
    <div class="detail-hero">${cover(p)}</div>
    <section class="detail-section"><div class="chips"><span class="chip">${esc(p.client||"")}</span>${statusMarkup(p.status)}<span class="chip">${esc(dueLabel(p))}</span></div><p style="color:var(--muted);font-size:12px;line-height:1.7">${esc(p.summary||"")}</p></section>
    <section class="detail-section"><h4>현재 상태</h4><div class="detail-grid"><div class="detail-box"><span>현재 단계</span><strong>${esc(p.stage||"—")}</strong></div><div class="detail-box"><span>지금 해야 할 일</span><strong>${esc(p.nextAction||"—")}</strong></div></div></section>
    <section class="detail-section"><h4>업무 구조</h4>${sections.map(g=>`<div class="group"><h5>${esc(g.title||"업무")}</h5><div class="chips">${(g.items||[]).map(x=>`<span class="chip">${esc(x)}</span>`).join("")}</div></div>`).join("")}</section>
    ${recent.length?`<section class="detail-section"><h4>최근 작업</h4><div class="history">${recent.map(x=>`<p>${esc(x)}</p>`).join("")}</div></section>`:""}
    ${next.length?`<section class="detail-section"><h4>다음 단계</h4><div class="history">${next.map((x,i)=>`<p><b>${String(i+1).padStart(2,"0")}</b> · ${esc(x)}</p>`).join("")}</div></section>`:""}
    ${contracts.length?`<section class="detail-section"><h4>계약 연결</h4>${contracts.map(c=>`<div class="detail-box" style="margin-bottom:7px"><span>${esc(c.projectName||p.name)}</span><strong>${won(bill(c))} · 미수 ${won(outstanding(c))}</strong></div>`).join("")}</section>`:""}
    <div class="actions"><button class="btn" data-edit-project="${esc(p.id)}">프로젝트 수정</button></div>
  </div>`);
}
function businessDrawer(id){
  const b=state.businesses.find(x=>x.id===id);if(!b)return;
  openDrawer(`<div class="drawer-head"><div><p class="eyebrow">${esc(b.label||"OWN BUSINESS")}</p><h2>${esc(b.name)}</h2></div><button class="x" data-close-drawer>×</button></div><div class="drawer-body"><div class="detail-hero">${cover(b)}</div>
  <section class="detail-section"><p style="color:var(--muted);font-size:12px;line-height:1.7">${esc(b.summary||"")}</p></section>
  <section class="detail-section"><h4>운영 영역</h4>${(b.workSections||[]).map(g=>`<div class="group"><h5>${esc(g.title)}</h5><div class="chips">${(g.items||[]).map(x=>`<span class="chip">${esc(x)}</span>`).join("")}</div></div>`).join("")}</section>
  </div>`);
}
function clientDrawer(name){
  const c=state.clients.find(x=>x.name===name), ps=state.projects.filter(p=>p.client===name), cs=state.contracts.filter(x=>x.clientName===name);
  openDrawer(`<div class="drawer-head"><div><p class="eyebrow">CLIENT</p><h2>${esc(name)}</h2></div><button class="x" data-close-drawer>×</button></div><div class="drawer-body">
  <section class="detail-section"><h4>기본 정보</h4><div class="detail-grid"><div class="detail-box"><span>분류</span><strong>${esc(c?.type||"—")}</strong></div><div class="detail-box"><span>담당자</span><strong>${esc(c?.member||"—")}</strong></div></div></section>
  <section class="detail-section"><h4>진행 프로젝트</h4>${ps.length?ps.map(p=>`<div class="focus-item" data-open-project="${esc(p.id)}"><small>${esc(p.stage||"")}</small><strong>${esc(p.name)}</strong><p>${esc(p.nextAction||"")}</p></div>`).join(""):'<div class="empty">연결 프로젝트가 없습니다.</div>'}</section>
  <section class="detail-section"><h4>계약</h4>${cs.length?cs.map(x=>`<div class="detail-box" style="margin-bottom:7px"><span>${esc(x.projectName||"계약")}</span><strong>${won(bill(x))} · 미수 ${won(outstanding(x))}</strong></div>`).join(""):'<div class="empty">계약 데이터가 없습니다.</div>'}</section>
  </div>`);
}

function openProjectModal(id=""){
  const p=state.projects.find(x=>x.id===id)||{status:"active",priority:"normal",workSections:[],recentWork:[],nextSteps:[]};
  $("#modal").innerHTML=`<div class="modal-head"><div><p class="eyebrow">PROJECT</p><h3>${id?"프로젝트 수정":"프로젝트 추가"}</h3></div><button class="x" data-close-modal>×</button></div>
  <form id="projectForm" class="modal-body">
    <input type="hidden" id="pId" value="${esc(p.id||"")}">
    <div class="form-grid"><label class="field"><span>프로젝트명</span><input id="pName" required value="${esc(p.name||"")}"></label><label class="field"><span>클라이언트</span><input id="pClient" required value="${esc(p.client||"")}"></label></div>
    <label class="field"><span>간략 설명</span><input id="pSummary" value="${esc(p.summary||"")}"></label>
    <div class="form-grid"><label class="field"><span>현재 단계</span><input id="pStage" value="${esc(p.stage||"")}"></label><label class="field"><span>마감일</span><input id="pDue" type="date" value="${esc(p.due||"")}"></label></div>
    <label class="field"><span>지금 해야 할 일</span><textarea id="pNext" rows="2">${esc(p.nextAction||"")}</textarea></label>
    <div class="form-grid"><label class="field"><span>상태</span><select id="pStatus">${["active","review","waiting","hold","done"].map(x=>`<option value="${x}" ${p.status===x?"selected":""}>${STATUS[x][0]}</option>`).join("")}</select></label><label class="field"><span>우선순위</span><select id="pPriority"><option value="focus" ${p.priority==="focus"?"selected":""}>집중</option><option value="normal" ${p.priority==="normal"?"selected":""}>일반</option><option value="low" ${p.priority==="low"?"selected":""}>후순위</option></select></label></div>
    <label class="field"><span>대표 이미지 URL</span><input id="pImage" type="url" value="${esc(p.imageUrl||"")}"></label>
    <label class="field"><span>업무 항목 · 한 줄에 하나씩</span><textarea id="pWorks" rows="6">${esc((p.workstreams||[]).join("\n"))}</textarea></label>
    <label class="field"><span>최근 작업 · 한 줄에 하나씩</span><textarea id="pRecent" rows="4">${esc((p.recentWork||[]).join("\n"))}</textarea></label>
    <label class="field"><span>다음 단계 · 한 줄에 하나씩</span><textarea id="pSteps" rows="4">${esc((p.nextSteps||[]).join("\n"))}</textarea></label>
    <div class="actions">${id?`<button type="button" class="btn" id="deleteProject">삭제</button>`:""}<button type="button" class="btn" data-close-modal>취소</button><button class="btn primary" type="submit">저장</button></div>
  </form>`;
  $("#modalBackdrop").classList.remove("hidden");$("#modal").classList.remove("hidden");document.body.style.overflow="hidden";
}
function closeModal(){$("#modalBackdrop").classList.add("hidden");$("#modal").classList.add("hidden");document.body.style.overflow="";}
async function persistProjects(next){
  await setDoc(doc(db,"meta","project_dashboard"),{projects:next,businesses:state.businesses,updatedAt:serverTimestamp(),updatedBy:state.user.uid},{merge:true});
}

function bindShell(){
  document.addEventListener("click", async e=>{
    const route=e.target.closest("[data-route]"); if(route){state.route=route.dataset.route;renderPage();return}
    const filter=e.target.closest("[data-filter]");if(filter){state.filter=filter.dataset.filter;renderPage();return}
    const project=e.target.closest("[data-open-project]");if(project){projectDrawer(project.dataset.openProject);return}
    const business=e.target.closest("[data-open-business]");if(business){businessDrawer(business.dataset.openBusiness);return}
    const client=e.target.closest("[data-open-client]");if(client){clientDrawer(client.dataset.openClient);return}
    if(e.target.closest("[data-close-drawer]")||e.target.id==="drawerBackdrop"){closeDrawer();return}
    if(e.target.closest("[data-close-modal]")||e.target.id==="modalBackdrop"){closeModal();return}
    if(e.target.id==="addProject"){openProjectModal();return}
    const edit=e.target.closest("[data-edit-project]");if(edit){closeDrawer();openProjectModal(edit.dataset.editProject);return}
    if(e.target.id==="prevMonth"){state.month=new Date(state.month.getFullYear(),state.month.getMonth()-1,1);renderPage();return}
    if(e.target.id==="nextMonth"){state.month=new Date(state.month.getFullYear(),state.month.getMonth()+1,1);renderPage();return}
    if(e.target.id==="todayMonth"){state.month=new Date();renderPage();return}
    if(e.target.id==="deleteProject"){
      const id=$("#pId").value,p=state.projects.find(x=>x.id===id);if(!p||!confirm(`${p.name} 프로젝트를 삭제할까요?`))return;
      try{await persistProjects(state.projects.filter(x=>x.id!==id));closeModal();toast("프로젝트를 삭제했습니다.")}catch(err){console.error(err);toast("삭제하지 못했습니다.")}
    }
  });

  $("#globalSearch")?.addEventListener("input",e=>{state.search=e.target.value;renderPage()});
  $("#logoutBtn")?.addEventListener("click",()=>signOut(auth));
  const theme=()=>{const next=document.body.dataset.theme==="dark"?"light":"dark";document.body.dataset.theme=next;localStorage.setItem("nineworks-v2-theme",next)};
  $("#themeBtn")?.addEventListener("click",theme);$("#mobileThemeBtn")?.addEventListener("click",theme);

  document.addEventListener("submit",async e=>{
    if(e.target.id!=="projectForm")return;e.preventDefault();
    const id=$("#pId").value||uid("project"),prev=state.projects.find(x=>x.id===id);
    const works=$("#pWorks").value.split("\n").map(x=>x.trim()).filter(Boolean);
    const recent=$("#pRecent").value.split("\n").map(x=>x.trim()).filter(Boolean);
    const steps=$("#pSteps").value.split("\n").map(x=>x.trim()).filter(Boolean);
    const p={...prev,id,name:$("#pName").value.trim(),client:$("#pClient").value.trim(),summary:$("#pSummary").value.trim(),stage:$("#pStage").value.trim(),due:$("#pDue").value,nextAction:$("#pNext").value.trim(),status:$("#pStatus").value,priority:$("#pPriority").value,imageUrl:$("#pImage").value.trim(),workstreams:works,recentWork:recent,nextSteps:steps,updatedAt:Date.now(),createdAt:prev?.createdAt||Date.now()};
    const next=prev?state.projects.map(x=>x.id===id?p:x):[p,...state.projects];
    try{await persistProjects(next);closeModal();toast("프로젝트를 저장했습니다.")}catch(err){console.error(err);toast("저장하지 못했습니다.")}
  });
}

async function subscribeData(user){
  cleanup();state.user=user;
  try{const snap=await getDoc(doc(db,"users",user.uid));state.profile=snap.exists()?snap.data():{name:"박재영",role:"owner"}}catch{state.profile={name:"박재영",role:"owner"}}
  renderApp();

  state.unsubs.push(onSnapshot(doc(db,"meta","project_dashboard"),snap=>{
    const d=snap.exists()?snap.data():{};
    state.projects=Array.isArray(d.projects)?d.projects:[];
    state.businesses=Array.isArray(d.businesses)&&d.businesses.length?d.businesses:BUSINESS_DEFAULTS;
    renderPage();
  },()=>{}));
  state.unsubs.push(onSnapshot(collection(db,"clients"),snap=>{sta