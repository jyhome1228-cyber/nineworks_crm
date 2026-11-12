import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, setDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const config={apiKey:"AIzaSyBXhDb0jyhIR4G1ho6Y7V8sibwvENI2r8k",authDomain:"nineworks-crm.firebaseapp.com",projectId:"nineworks-crm",storageBucket:"nineworks-crm.firebasestorage.app",messagingSenderId:"1096147745343",appId:"1:1096147745343:web:cbec82631cbc2d9db1968a"};
const firebaseApp=initializeApp(config);
const auth=getAuth(firebaseApp);
const db=getFirestore(firebaseApp);
setPersistence(auth,browserLocalPersistence).catch(function(){});

const $=function(s,r){return (r||document).querySelector(s);};
const esc=function(v){return String(v==null?"":v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");};
const uid=function(p){return p+"_"+Date.now()+"_"+Math.random().toString(36).slice(2,7);};
const today=function(){return new Date().toISOString().slice(0,10);};
const won=function(v){return Math.round(Number(v||0)).toLocaleString("ko-KR")+"원";};

const state={user:null,profile:null,clients:[],todos:[],logs:[],contracts:[],activeClientId:"",query:"",unsubs:[]};

function cleanup(){state.unsubs.forEach(function(f){if(f)f();});state.unsubs=[];}
function clientName(c){return c&&c.name?c.name:(c&&c.clientName?c.clientName:"이름 없음");}
function activeClient(){return state.clients.find(function(c){return c.id===state.activeClientId;})||null;}
function formatDate(v){if(!v)return "—";var d=new Date(v+"T00:00:00");if(isNaN(d.getTime()))return v;return String(d.getMonth()+1).padStart(2,"0")+"."+String(d.getDate()).padStart(2,"0");}
function timestampMs(v){if(!v)return 0;if(typeof v==="number")return v;if(v&&typeof v.toMillis==="function")return v.toMillis();return 0;}
function toast(msg){var el=$("#toast");if(!el){el=document.createElement("div");el.id="toast";el.className="toast";document.body.appendChild(el);}el.textContent=msg;el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(function(){el.hidden=true;},1800);}
function initials(name){return String(name||"NW").trim().slice(0,2).toUpperCase();}
function clientTodos(c){var n=clientName(c);return state.todos.filter(function(t){return !t.done&&(t.clientId===c.id||(!t.clientId&&t.client===n));});}
function clientLogs(c,type){var n=clientName(c);return state.logs.filter(function(l){return (l.clientId===c.id||(!l.clientId&&l.client===n))&&((l.type||"work")===type);}).sort(function(a,b){return (b.date||"").localeCompare(a.date||"")+(Number(b.createdAtMs||0)-Number(a.createdAtMs||0));});}
function clientContracts(c){var n=clientName(c);return state.contracts.filter(function(x){return x.clientId===c.id||x.clientName===n;});}
function supply(c){return Number(c.supplyAmount==null?c.contractAmount:c.supplyAmount)||0;}
function bill(c){var s=supply(c);return s+(c.vatSeparate===false?0:Math.round(s*.1));}
function received(c){if(c.contractType==="monthly")return Number(c.payments&&c.payments.monthly&&c.payments.monthly.amount||0);return ["advance","balance"].reduce(function(sum,key){var p=c.payments&&c.payments[key];return sum+(p&&p.paid?Number(p.amount||0):0);},0);}
function outstanding(c){return Math.max(0,bill(c)-received(c));}

function loginView(){
  return '<div class="login"><section class="login-visual"><img class="login-logo" src="./assets/nineworks-logo.svg" alt="NINEWORKS"><div class="login-copy"><p class="eyebrow">CLIENT WORKSPACE</p><h1>Client.<br>Work.<br>Log.</h1><p>클라이언트별 현재 작업, 작업 로그, 미팅 내용과 계약 정보를 한 곳에 계속 쌓아가는 나인웍스 내부 워크스페이스.</p></div><span style="color:#50504c;font-size:9px">NINEWORKS · INTERNAL ONLY</span></section><section class="login-form-wrap"><form id="loginForm" class="login-card"><p class="eyebrow">ADMIN ACCESS</p><h2>로그인</h2><p>기존 나인웍스 관리자 계정으로 접속합니다.</p><label class="field"><span>이메일</span><input id="loginEmail" type="email" autocomplete="email" required></label><label class="field"><span>비밀번호</span><input id="loginPassword" type="password" autocomplete="current-password" required></label><button class="btn primary full" type="submit">로그인</button><p id="loginMsg" class="login-msg"></p></form></section></div>';
}

function clientList(){
  var q=state.query.trim().toLowerCase();
  var list=state.clients.filter(function(c){return !q||(clientName(c)+" "+(c.type||"")).toLowerCase().includes(q);}).sort(function(a,b){return clientName(a).localeCompare(clientName(b),"ko");});
  if(!list.length)return '<div class="empty">등록된 클라이언트가 없습니다.</div>';
  return list.map(function(c){
    var tasks=clientTodos(c).length;
    return '<button class="client-button '+(c.id===state.activeClientId?'active':'')+'" data-client-id="'+esc(c.id)+'"><span class="client-avatar">'+esc(initials(clientName(c)))+'</span><span><strong>'+esc(clientName(c))+'</strong><small>'+esc(c.type||"CLIENT")+'</small></span><span class="client-count">'+tasks+'</span></button>';
  }).join("");
}

function shell(){
  return '<div class="site-shell">'+
  '<header class="site-header">'+
    '<div class="site-header-left"><img class="site-logo" src="./assets/nineworks-logo.svg" alt="NINEWORKS"><span class="site-kicker">NINEWORKS / CLIENT MANAGEMENT SYSTEM</span></div>'+
    '<div class="site-header-right"><span class="site-meta">INTERNAL WORKSPACE · 2026</span><button class="header-action" id="addWorkLog">WORK LOG ↗</button><button class="header-action solid" id="addMeeting">MEETING ↗</button><button class="header-menu" id="mobileClients">CLIENTS</button></div>'+
  '</header>'+
  '<div class="workspace">'+
    '<aside id="sidebar" class="sidebar">'+
      '<div class="side-intro"><p class="eyebrow">CLIENT INDEX</p><h2>Clients</h2><p>현재 함께 일하고 있는 클라이언트와 프로젝트를 관리합니다.</p></div>'+
      '<label class="client-search"><input id="clientSearch" type="search" placeholder="SEARCH CLIENT"></label>'+
      '<div id="clientList" class="client-list">'+clientList()+'</div>'+
      '<div class="side-actions"><button class="btn primary" id="addClient">＋ ADD CLIENT</button><div class="user-mini"><strong>'+esc(state.profile&&state.profile.name||state.user&&state.user.email||"NINEWORKS")+'</strong><span>'+esc(state.profile&&state.profile.role||"OWNER")+'</span></div><button class="btn" id="logoutBtn">LOGOUT ↗</button></div>'+
    '</aside>'+
    '<main class="main"><div id="content" class="content"></div></main>'+
  '</div>'+
  '<div id="modalBackdrop" class="modal-backdrop" hidden></div><section id="modal" class="modal" hidden></section>'+
  '</div>';
}

function taskMarkup(t){
  return '<div class="task"><button class="check" data-complete-task="'+esc(t.id)+'" title="완료">✓</button><div><strong>'+esc(t.title||"업무")+'</strong><small>'+esc(t.memo||"")+'</small>'+(t.project?'<div style="margin-top:6px"><span class="task-project">'+esc(t.project)+'</span></div>':'')+'</div><span class="task-due">'+esc(formatDate(t.due))+'</span></div>';
}
function logMarkup(l){
  return '<article class="log-item"><time>'+esc(formatDate(l.date||today()))+'</time><strong>'+esc(l.title||"작업 기록")+'</strong>'+(l.content?'<p>'+esc(l.content)+'</p>':'')+'<div class="log-meta">'+(l.project?'<span class="tag">'+esc(l.project)+'</span>':'')+(l.link?'<a class="tag" href="'+esc(l.link)+'" target="_blank" rel="noopener">LINK ↗</a>':'')+'</div></article>';
}
function meetingMarkup(m){
  return '<article class="meeting"><div class="meeting-head"><div><strong>'+esc(m.title||"미팅")+'</strong><div class="attendees">'+esc(m.attendees||"참석자 미기재")+'</div></div><time>'+esc(formatDate(m.date||today()))+'</time></div>'+(m.content?'<p>'+esc(m.content)+'</p>':'')+(m.decisions?'<div class="meeting-section"><span>DECISION</span><p>'+esc(m.decisions)+'</p></div>':'')+(m.nextAction?'<div class="meeting-section"><span>NEXT ACTION</span><p>'+esc(m.nextAction)+'</p></div>':'')+'</article>';
}
function contractMarkup(c){
  return '<article class="contract-card"><strong>'+esc(c.projectName||"계약")+'</strong><p>'+esc(c.contractType==="monthly"?"월 단위 계약":"선금 · 잔금 계약")+' · '+esc(c.contractDate||"계약일 미기재")+'</p><div class="contract-money"><div><span>총 청구액</span><b>'+won(bill(c))+'</b></div><div><span>미수금</span><b>'+won(outstanding(c))+'</b></div></div></article>';
}

function clientPage(c){
  var todos=clientTodos(c),logs=clientLogs(c,"work"),meetings=clientLogs(c,"meeting"),contracts=clientContracts(c);
  var totalContract=contracts.reduce(function(n,x){return n+bill(x);},0);
  var totalOutstanding=contracts.reduce(function(n,x){return n+outstanding(x);},0);
  return '<section class="client-page">'+
    '<div class="client-hero">'+
      '<div class="client-hero-copy"><p class="eyebrow">NINEWORKS / CLIENT WORKSPACE</p><h1>'+esc(clientName(c))+'</h1><p class="client-lead">'+esc(c.work||c.description||"클라이언트의 현재 업무와 기록, 미팅과 계약 흐름을 한 곳에서 관리합니다.")+'</p></div>'+
      '<div class="client-hero-actions"><button class="hero-link" data-action="task">ADD CURRENT WORK ↗</button><button class="hero-link" data-action="log">ADD WORK LOG ↗</button><button class="hero-link" data-action="meeting">ADD MEETING ↗</button></div>'+
    '</div>'+
    '<div class="client-facts">'+
      '<div><span>01 / OPEN WORK</span><strong>'+todos.length+'</strong></div>'+
      '<div><span>02 / WORK LOG</span><strong>'+logs.length+'</strong></div>'+
      '<div><span>03 / MEETING</span><strong>'+meetings.length+'</strong></div>'+
      '<div><span>04 / OUTSTANDING</span><strong>'+won(totalOutstanding)+'</strong><small>TOTAL '+won(totalContract)+'</small></div>'+
    '</div>'+
    '<section class="nw-section">'+
      '<div class="nw-section-head"><div><p class="eyebrow">01 / CURRENT WORK</p><h2>지금 진행 중인 업무를<br>가장 먼저 확인합니다.</h2></div><button class="section-link" data-action="task">ADD WORK ↗</button></div>'+
      '<div class="nw-section-body">'+(todos.length?todos.map(taskMarkup).join(""):'<div class="empty large">현재 진행 중인 작업이 없습니다.</div>')+'</div>'+
    '</section>'+
    '<section class="nw-section">'+
      '<div class="nw-section-head"><div><p class="eyebrow">02 / WORK LOG</p><h2>작업의 흐름을<br>날짜별 기록으로 남깁니다.</h2></div><button class="section-link" data-action="log">ADD LOG ↗</button></div>'+
      '<div class="nw-section-body timeline">'+(logs.length?logs.map(logMarkup).join(""):'<div class="empty large">아직 작업 로그가 없습니다.</div>')+'</div>'+
    '</section>'+
    '<section class="nw-section">'+
      '<div class="nw-section-head"><div><p class="eyebrow">03 / MEETING</p><h2>논의한 내용과 결정,<br>다음 액션을 연결합니다.</h2></div><button class="section-link" data-action="meeting">ADD MEETING ↗</button></div>'+
      '<div class="nw-section-body meeting-list">'+(meetings.length?meetings.map(meetingMarkup).join(""):'<div class="empty large">등록된 미팅 기록이 없습니다.</div>')+'</div>'+
    '</section>'+
    '<section class="nw-section split-section">'+
      '<div class="nw-section-head"><div><p class="eyebrow">04 / CLIENT & CONTRACT</p><h2>관계와 계약 정보까지<br>하나의 기준으로 봅니다.</h2></div><button class="section-link" data-action="edit-client">EDIT CLIENT ↗</button></div>'+
      '<div class="split-info">'+
        '<div class="client-profile-block"><div class="info-row"><span>TYPE</span><strong>'+esc(c.type||"—")+'</strong></div><div class="info-row"><span>CONTACT</span><strong>'+esc(c.contact||c.manager||"—")+'</strong></div><div class="info-row"><span>PHONE</span><strong>'+esc(c.phone||"—")+'</strong></div><div class="info-row"><span>EMAIL</span><strong>'+esc(c.email||"—")+'</strong></div><div class="info-row"><span>NOTE</span><strong>'+esc(c.note||"—")+'</strong></div></div>'+
        '<div class="contract-list">'+(contracts.length?contracts.map(contractMarkup).join(""):'<div class="empty large">연결된 계약이 없습니다.</div>')+'</div>'+
      '</div>'+
    '</section>'+
  '</section>';
}

function renderContent(){
  var c=activeClient();
  $("#clientList").innerHTML=clientList();
  $("#content").innerHTML=c?clientPage(c):'<div class="empty-page"><div><p class="eyebrow">CLIENT WORKSPACE</p><h2>클라이언트를 선택하세요.</h2><p>왼쪽에서 클라이언트를 선택하면 현재 작업, 작업 로그, 미팅 기록과 계약 정보를 한 번에 볼 수 있습니다.</p></div></div>';
}
function openModal(title,body){
  $("#modal").innerHTML='<div class="modal-head"><div><p class="eyebrow">NINEWORKS CRM</p><h3>'+esc(title)+'</h3></div><button class="x" data-close-modal>×</button></div><div class="modal-body">'+body+'</div>';
  $("#modalBackdrop").hidden=false;$("#modal").hidden=false;document.body.style.overflow="hidden";
}
function closeModal(){$("#modalBackdrop").hidden=true;$("#modal").hidden=true;document.body.style.overflow="";}

function clientForm(c){
  c=c||{};
  var display=clientName(c)==="이름 없음"?"":clientName(c);
  openModal(c.id?"클라이언트 수정":"클라이언트 추가",'<form id="clientForm"><input id="clientId" type="hidden" value="'+esc(c.id||"")+'"><div class="form-grid"><label class="field"><span>클라이언트명 *</span><input id="clientName" required value="'+esc(display)+'"></label><label class="field"><span>분류</span><input id="clientType" value="'+esc(c.type||"")+'" placeholder="월간 운영 / 프로젝트 / 기타"></label></div><div class="form-grid"><label class="field"><span>담당자</span><input id="clientContact" value="'+esc(c.contact||c.manager||"")+'"></label><label class="field"><span>연락처</span><input id="clientPhone" value="'+esc(c.phone||"")+'"></label></div><label class="field"><span>이메일</span><input id="clientEmail" type="email" value="'+esc(c.email||"")+'"></label><label class="field"><span>현재 관계 / 업무 설명</span><textarea id="clientWork" rows="3">'+esc(c.work||c.description||"")+'</textarea></label><label class="field"><span>메모</span><textarea id="clientNote" rows="3">'+esc(c.note||"")+'</textarea></label><div class="actions"><button type="button" class="btn" data-close-modal>취소</button><button class="btn primary" type="submit">저장</button></div></form>');
}
function taskForm(){
  openModal("현재 작업 추가",'<form id="taskForm"><label class="field"><span>업무명 *</span><input id="taskTitle" required placeholder="예: 상세페이지 수정"></label><div class="form-grid"><label class="field"><span>프로젝트 / 브랜드</span><input id="taskProject" placeholder="예: ODE BELL"></label><label class="field"><span>목표일</span><input id="taskDue" type="date"></label></div><label class="field"><span>메모</span><textarea id="taskMemo" rows="3"></textarea></label><div class="actions"><button type="button" class="btn" data-close-modal>취소</button><button class="btn primary" type="submit">작업 추가</button></div></form>');
}
function logForm(){
  openModal("작업 로그",'<form id="logForm"><div class="form-grid"><label class="field"><span>작업 제목 *</span><input id="logTitle" required></label><label class="field"><span>작업일</span><input id="logDate" type="date" value="'+today()+'"></label></div><label class="field"><span>프로젝트 / 브랜드</span><input id="logProject"></label><label class="field"><span>작업 내용</span><textarea id="logContent" rows="5"></textarea></label><label class="field"><span>관련 링크</span><input id="logLink" type="url"></label><div class="actions"><button type="button" class="btn" data-close-modal>취소</button><button class="btn primary" type="submit">로그 저장</button></div></form>');
}
function meetingForm(){
  openModal("미팅 기록",'<form id="meetingForm"><div class="form-grid"><label class="field"><span>미팅명 *</span><input id="meetingTitle" required></label><label class="field"><span>미팅일</span><input id="meetingDate" type="date" value="'+today()+'"></label></div><label class="field"><span>참석자</span><input id="meetingAttendees"></label><label class="field"><span>미팅 내용 *</span><textarea id="meetingContent" rows="6" required></textarea></label><label class="field"><span>결정사항</span><textarea id="meetingDecisions" rows="4"></textarea></label><label class="field"><span>다음 액션</span><textarea id="meetingNext" rows="3" placeholder="입력하면 현재 작업으로도 자동 추가됩니다."></textarea></label><label class="field"><span>프로젝트 / 브랜드</span><input id="meetingProject"></label><div class="actions"><button type="button" class="btn" data-close-modal>취소</button><button class="btn primary" type="submit">미팅 저장</button></div></form>');
}

async function saveLog(payload){
  var id=uid("log");
  await setDoc(doc(db,"workLogs",id),Object.assign({id:id,createdAt:serverTimestamp(),createdAtMs:Date.now(),updatedBy:state.user.uid},payload));
}
async function completeTask(id){
  var t=state.todos.find(function(x){return x.id===id;}),c=activeClient();if(!t||!c)return;
  try{
    await setDoc(doc(db,"todos",id),Object.assign({},t,{done:true,completedAt:serverTimestamp()}),{merge:true});
    await saveLog({type:"work",clientId:c.id,client:clientName(c),project:t.project||"",title:"완료 · "+(t.title||"업무"),content:t.memo||"",date:today()});
    toast("완료 처리하고 작업 로그에도 남겼습니다.");
  }catch(err){console.error(err);toast("완료 처리하지 못했습니다.");}
}

function bindGlobal(){
  document.addEventListener("click",function(e){
    var cb=e.target.closest("[data-client-id]");if(cb){state.activeClientId=cb.dataset.clientId;renderContent();$("#sidebar").classList.remove("open");return;}
    if(e.target.closest("[data-close-modal]")||e.target.id==="modalBackdrop"){closeModal();return;}
    var complete=e.target.closest("[data-complete-task]");if(complete){completeTask(complete.dataset.completeTask);return;}
    var action=e.target.closest("[data-action]");if(action){var c=activeClient();if(!c)return;var a=action.dataset.action;if(a==="task")taskForm();if(a==="log")logForm();if(a==="meeting")meetingForm();if(a==="edit-client")clientForm(c);}
  });
  $("#clientSearch").addEventListener("input",function(e){state.query=e.target.value;$("#clientList").innerHTML=clientList();});
  $("#addClient").addEventListener("click",function(){clientForm({});});
  $("#addWorkLog").addEventListener("click",function(){if(activeClient())logForm();else toast("클라이언트를 먼저 선택하세요.");});
  $("#addMeeting").addEventListener("click",function(){if(activeClient())meetingForm();else toast("클라이언트를 먼저 선택하세요.");});
  $("#logoutBtn").addEventListener("click",function(){signOut(auth);});
  $("#mobileClients").addEventListener("click",function(){$("#sidebar").classList.toggle("open");});

  document.addEventListener("submit",async function(e){
    if(e.target.id==="clientForm"){
      e.preventDefault();var id=$("#clientId").value||uid("client");var ex=state.clients.find(function(x){return x.id===id;})||{};
      try{await setDoc(doc(db,"clients",id),Object.assign({},ex,{id:id,name:$("#clientName").value.trim(),type:$("#clientType").value.trim(),contact:$("#clientContact").value.trim(),phone:$("#clientPhone").value.trim(),email:$("#clientEmail").value.trim(),work:$("#clientWork").value.trim(),note:$("#clientNote").value.trim(),updatedAt:serverTimestamp()}),{merge:true});state.activeClientId=id;closeModal();toast("클라이언트를 저장했습니다.");}catch(err){console.error(err);toast("저장하지 못했습니다.");}
      return;
    }
    if(e.target.id==="taskForm"){
      e.preventDefault();var c=activeClient();if(!c)return;var tid=uid("todo");
      try{await setDoc(doc(db,"todos",tid),{id:tid,clientId:c.id,client:clientName(c),title:$("#taskTitle").value.trim(),project:$("#taskProject").value.trim(),due:$("#taskDue").value,memo:$("#taskMemo").value.trim(),done:false,createdAt:serverTimestamp()});closeModal();toast("현재 작업에 추가했습니다.");}catch(err){console.error(err);toast("작업을 저장하지 못했습니다.");}
      return;
    }
    if(e.target.id==="logForm"){
      e.preventDefault();var cl=activeClient();if(!cl)return;
      try{await saveLog({type:"work",clientId:cl.id,client:clientName(cl),title:$("#logTitle").value.trim(),date:$("#logDate").value||today(),project:$("#logProject").value.trim(),content:$("#logContent").value.trim(),link:$("#logLink").value.trim()});closeModal();toast("작업 로그를 남겼습니다.");}catch(err){console.error(err);toast("로그를 저장하지 못했습니다.");}
      return;
    }
    if(e.target.id==="meetingForm"){
      e.preventDefault();var cm=activeClient();if(!cm)return;var next=$("#meetingNext").value.trim();var project=$("#meetingProject").value.trim();
      try{
        await saveLog({type:"meeting",clientId:cm.id,client:clientName(cm),title:$("#meetingTitle").value.trim(),date:$("#meetingDate").value||today(),attendees:$("#meetingAttendees").value.trim(),content:$("#meetingContent").value.trim(),decisions:$("#meetingDecisions").value.trim(),nextAction:next,project:project});
        if(next){var nt=uid("todo");await setDoc(doc(db,"todos",nt),{id:nt,clientId:cm.id,client:clientName(cm),title:next,project:project,due:"",memo:"미팅에서 생성된 다음 액션",done:false,createdAt:serverTimestamp()});}
        closeModal();toast(next?"미팅과 다음 액션을 저장했습니다.":"미팅 기록을 저장했습니다.");
      }catch(err){console.error(err);toast("미팅을 저장하지 못했습니다.");}
    }
  });
}

async function subscribe(user){
  cleanup();state.user=user;
  try{var p=await getDoc(doc(db,"users",user.uid));state.profile=p.exists()?p.data():{name:user.email,role:"OWNER"};}catch(e){state.profile={name:user.email,role:"OWNER"};}
  $("#app").innerHTML=shell();bindGlobal();renderContent();

  state.unsubs.push(onSnapshot(collection(db,"clients"),function(snap){state.clients=snap.docs.map(function(d){return Object.assign({id:d.id},d.data());});if(!state.activeClientId&&state.clients.length)state.activeClientId=state.clients[0].id;if(state.activeClientId&&!state.clients.some(function(c){return c.id===state.activeClientId;}))state.activeClientId=state.clients[0]?state.clients[0].id:"";renderContent();}));
  state.unsubs.push(onSnapshot(collection(db,"todos"),function(snap){state.todos=snap.docs.map(function(d){return Object.assign({id:d.id},d.data());});renderContent();}));
  state.unsubs.push(onSnapshot(collection(db,"workLogs"),function(snap){state.logs=snap.docs.map(function(d){var data=d.data();return Object.assign({id:d.id,createdAtMs:timestampMs(data.createdAt)},data);});renderContent();}));
  state.unsubs.push(onSnapshot(collection(db,"financeContracts"),function(snap){state.contracts=snap.docs.map(function(d){return Object.assign({id:d.id},d.data());});renderContent();},function(err){console.warn("financeContracts unavailable",err);state.contracts=[];renderContent();}));
}

function bindLogin(){
  $("#loginForm").addEventListener("submit",async function(e){e.preventDefault();var msg=$("#loginMsg");msg.textContent="로그인 중...";try{await signInWithEmailAndPassword(auth,$("#loginEmail").value.trim(),$("#loginPassword").value);msg.textContent="";}catch(err){console.error(err);msg.textContent="이메일 또는 비밀번호를 확인하세요.";}});
}
onAuthStateChanged(auth,function(user){if(user)subscribe(user);else{cleanup();state.user=null;state.profile=null;$("#app").innerHTML=loginView();bindLogin();}});
