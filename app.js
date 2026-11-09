const $=(s,r=document)=>r.querySelector(s);
const state={route:"home",search:"",filter:"active"};
const routes=[
  ["home","HOME","01"],["projects","프로젝트","02"],["calendar","캘린더","03"],
  ["finance","자금 · 계약","04"],["clients","클라이언트","05"],["business","내 사업체","06"]
];
function shell(){
  return `<div class="app">
    <aside class="sidebar">
      <button class="logo" data-route="home"><img src="./assets/nineworks-logo.svg" alt="NINEWORKS"></button>
      <nav class="nav">${routes.map(([id,label,n])=>`<button data-route="${id}" class="${state.route===id?"active":""}">${label}<span>${n}</span></button>`).join("")}</nav>
      <div class="side-foot"><strong>NINEWORKS OS</strong><small>Project Operating System</small></div>
    </aside>
    <main class="content">
      <header class="topbar">
        <h1 id="routeTitle"></h1>
        <div class="top-actions"><input class="search" id="search" type="search" placeholder="검색"><button class="btn primary" id="quickAdd">＋ 새로 만들기</button></div>
      </header>
      <div id="page"></div>
    </main>
  </div>`;
}
function empty(title,copy){
  return `<div class="empty"><div class="mark">＋</div><strong>${title}</strong><p>${copy}</p></div>`;
}
function home(){
  return `<section class="page">
    <div class="page-head"><div><p class="eyebrow">WORKSPACE</p><h2>오늘의 업무</h2><p>프로젝트와 해야 할 일을 가장 먼저 보는 화면입니다.</p></div><button class="btn primary">＋ 프로젝트 추가</button></div>
    <div class="summary">
      <div class="summary-card"><span>진행 프로젝트</span><strong>0</strong><small>ACTIVE</small></div>
      <div class="summary-card"><span>오늘 할 일</span><strong>0</strong><small>TODAY</small></div>
      <div class="summary-card"><span>검수 필요</span><strong>0</strong><small>REVIEW</small></div>
      <div class="summary-card"><span>대기</span><strong>0</strong><small>WAITING</small></div>
      <div class="summary-card"><span>마감 임박</span><strong>0</strong><small>DEADLINE</small></div>
    </div>
    <div class="grid">
      <section class="panel"><div class="panel-head"><div><h3>프로젝트</h3><p>클라이언트 업무를 프로젝트 단위로 관리합니다.</p></div><div class="section-tabs"><button class="active">진행</button><button>전체</button><button>검수</button><button>대기</button></div></div>${empty("아직 프로젝트가 없습니다.","새 CRM은 빈 상태에서 시작합니다. 프로젝트를 추가하면 이곳에 이미지, 간략 설명, 현재 단계, 지금 해야 할 일이 표시됩니다.")}</section>
      <aside class="panel"><div class="panel-head"><div><h3>지금 해야 할 일</h3><p>우선순위 기준</p></div></div><div class="todo"><div class="todo-item"><i class="dot"></i><div><strong>등록된 할 일이 없습니다.</strong><span>프로젝트의 ‘지금 해야 할 일’을 기준으로 자동 정리할 예정입니다.</span></div></div></div></aside>
    </div>
  </section>`;
}
function projects(){
  return `<section class="page"><div class="page-head"><div><p class="eyebrow">PROJECTS</p><h2>프로젝트</h2><p>업무의 중심이 되는 프로젝트 관리 화면입니다.</p></div><button class="btn primary">＋ 프로젝트 추가</button></div>
  <section class="panel"><div class="panel-head"><div><h3>전체 프로젝트</h3><p>이미지 + 설명 + 현재 단계 + 다음 액션</p></div></div>
  ${empty("프로젝트 구조를 새로 설계합니다.","기존 프로젝트 데이터와 UI는 모두 제거했습니다. 앞으로 이 화면을 기준으로 프로젝트 상세, 업무 히스토리, 파일, 계약, 클라이언트를 연결합니다.")}</section></section>`;
}
function generic(title,eyebrow,copy,cards){
  return `<section class="page"><div class="page-head"><div><p class="eyebrow">${eyebrow}</p><h2>${title}</h2><p>${copy}</p></div></div>
  <section class="panel"><div class="placeholder-grid">${cards.map(([a,b])=>`<article class="placeholder-card"><strong>${a}</strong><p>${b}</p></article>`).join("")}</div></section></section>`;
}
function page(){
  if(state.route==="home")return home();
  if(state.route==="projects")return projects();
  if(state.route==="calendar")return generic("캘린더","CALENDAR","프로젝트 일정의 보조 화면으로 다시 설계합니다.",[["월간 일정","프로젝트 마감과 반복 업무만 보여주는 단순한 캘린더."],["이번 주","이번 주 처리해야 할 일정만 빠르게 확인."],["반복 업무","월·목 공구처럼 반복되는 업무를 별도로 관리."]]);
  if(state.route==="finance")return generic("자금 · 계약","FINANCE","계약과 입금 흐름을 프로젝트와 연결합니다.",[["계약","클라이언트·프로젝트·계약금액 연결."],["입금","선금·잔금·월계약 입금 관리."],["미수금","아직 받지 못한 금액과 예정일 관리."]]);
  if(state.route==="clients")return generic("클라이언트","CLIENTS","클라이언트별 프로젝트와 계약을 묶어 봅니다.",[["클라이언트 프로필","회사정보·담당자·연락처."],["진행 프로젝트","해당 클라이언트의 현재 프로젝트."],["계약 이력","과거·현재 계약과 금액."]]);
  return generic("내 사업체","OWN BUSINESS","외주 프로젝트와 분리해 직접 운영하는 사업을 관리합니다.",[["사업체","9WORKS, AESOST 등 사업 단위 관리."],["서비스","각 사업체에서 운영하는 서비스."],["현재 액션","각 사업에서 지금 해야 할 일을 정리."]]);
}
function render(){
  $("#routeTitle").textContent=routes.find(x=>x[0]===state.route)?.[1]||"HOME";
  document.querySelectorAll("[data-route]").forEach(b=>b.classList.toggle("active",b.dataset.route===state.route));
  $("#page").innerHTML=page();
}
function boot(){
  $("#app").innerHTML=shell();render();
  document.addEventListener("click",e=>{const b=e.target.closest("[data-route]");if(!b)return;state.route=b.dataset.route;render()});
  $("#search").addEventListener("input",e=>state.search=e.target.value);
  $("#quickAdd").addEventListener("click",()=>alert("새 프로젝트 등록 구조를 다음 단계에서 연결합니다."));
}
boot();