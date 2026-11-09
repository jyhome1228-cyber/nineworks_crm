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
    <div class="page-head"><div><p class="eyebrow">PROJECT 