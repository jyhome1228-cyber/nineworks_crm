import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, setDoc, onSnapshot, serverTimestamp, writeBatch } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const config={apiKey:"AIzaSyBXhDb0jyhIR4G1ho6Y7V8sibwvENI2r8k",authDomain:"nineworks-crm.firebaseapp.com",projectId:"nineworks-crm",storageBucket:"nineworks-crm.firebasestorage.app",messagingSenderId:"1096147745343",appId:"1:1096147745343:web:cbec82631cbc2d9db1968a"};
const firebaseApp=initializeApp(config);
const auth=getAuth(firebaseApp);
const db=getFirestore(firebaseApp);
setPersistence(auth,browserLocalPersistence).catch(function(){});

const $=function(s,r){return (r||document).querySelector(s);};
const esc=function(v){return String(v==null?"":v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");};
const uid=function(p){return p+"_"+Date.now()+"_"+Math.random().toString(36).slice(2,7);};
const today=function(){
  var parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Seoul",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
  var values={};parts.forEach(function(p){values[p.type]=p.value;});
  return values.year+"-"+values.month+"-"+values.day;
};
const won=function(v){return Math.round(Number(v||0)).toLocaleString("ko-KR")+"원";};

const state={user:null,profile:null,clients:[],todos:[],logs:[],contracts:[],tradePartners:[],taxInvoices:[],activeClientId:"",activePartnerId:"",view:"desk",journalDate:today(),journals:[],journalError:"",weeklyReports:[],weeklySelection:"",weeklyError:"",query:"",partnerQuery:"",unsubs:[]};

function cleanup(){state.unsubs.forEach(function(f){if(f)f();});state.unsubs=[];}
function clientName(c){return c&&c.name?c.name:(c&&c.clientName?c.clientName:"이름 없음");}
function activeClient(){return state.clients.find(function(c){return c.id===state.activeClientId;})||null;}
function activePartner(){return state.tradePartners.find(function(p){return p.id===state.activePartnerId;})||null;}
function maskBusinessNumber(v){var s=String(v||"");if(!s)return "—";var d=s.replace(/[^0-9]/g,"");if(d.length<8)return s;return d.slice(0,3)+"-**-"+d.slice(-5);}
function partnerInvoices(p){return state.taxInvoices.filter(function(x){return x.businessNumber===p.businessNumber;}).sort(function(a,b){return (b.date||"").localeCompare(a.date||"");});}
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
function dateKeyFromValue(v){
  if(!v)return "";
  if(typeof v==="string")return v.slice(0,10);
  if(typeof v==="number")return new Date(v).toISOString().slice(0,10);
  if(v&&typeof v.toDate==="function")return v.toDate().toISOString().slice(0,10);
  if(v&&typeof v.toMillis==="function")return new Date(v.toMillis()).toISOString().slice(0,10);
  return "";
}
function recentDays(count){
  var arr=[],now=new Date(today()+"T12:00:00+09:00");
  for(var i=count-1;i>=0;i--){var d=new Date(now);d.setUTCDate(now.getUTCDate()-i);arr.push(d.toISOString().slice(0,10));}
  return arr;
}
function logsOnDay(key){return state.logs.filter(function(l){return (l.date||dateKeyFromValue(l.createdAt))===key;});}
function openTasks(){return state.todos.filter(function(t){return !t.done;});}
function overdueTasks(){
  var key=today();
  return openTasks().filter(function(t){return t.due&&t.due<key;}).sort(function(a,b){return (a.due||"").localeCompare(b.due||"");});
}
function todayTasks(){
  var key=today(),all=openTasks().slice();
  return all.sort(function(a,b){
    var ad=a.due||"9999-12-31",bd=b.due||"9999-12-31";
    var ap=ad<=key?0:(a.due?1:2),bp=bd<=key?0:(b.due?1:2);
    return ap-bp||ad.localeCompare(bd);
  });
}
function clientByName(name){return state.clients.find(function(c){return clientName(c)===name;})||null;}
function clientForTask(t){return state.clients.find(function(c){return c.id===t.clientId;})||clientByName(t.client)||null;}
function clientForLog(l){return state.clients.find(function(c){return c.id===l.clientId;})||clientByName(l.client)||null;}
function totalOutstanding(){return state.contracts.reduce(function(sum,c){return sum+outstanding(c);},0);}
function activeClientCount(){
  var since=recentDays(14)[0];
  return state.clients.filter(function(c){
    return clientTodos(c).length>0||state.logs.some(function(l){return (l.clientId===c.id||l.client===clientName(c))&&(l.date||"")>=since;});
  }).length;
}

function loginView(){
  return '<div class="login"><section class="login-visual"><img class="login-logo" src="./assets/nineworks-logo.svg" alt="NINEWORKS"><div class="login-copy"><p class="eyebrow">CLIENT WORKSPACE</p><h1>Client.<br>Work.<br>Log.</h1><p>클라이언트별 현재 작업, 작업 로그, 미팅 내용과 계약 정보를 한 곳에 계속 쌓아가는 나인웍스 내부 워크스페이스.</p></div><span style="color:#50504c;font-size:9px">NINEWORKS · INTERNAL ONLY</span></section><section class="login-form-wrap"><form id="loginForm" class="login-card"><p class="eyebrow">ADMIN ACCESS</p><h2>로그인</h2><p>기존 나인웍스 관리자 계정으로 접속합니다.</p><label class="field"><span>이메일</span><input id="loginEmail" type="email" autocomplete="email" required></label><label class="field"><span>비밀번호</span><input id="loginPassword" type="password" autocomplete="current-password" required></label><button class="btn primary full" type="submit">로그인</button><p id="loginMsg" class="login-msg"></p></form></section></div>';
}

function clientList(){
  var q=state.query.trim().toLowerCase();
  var list=state.clients.filter(function(c){return !q||(clientName(c)+" "+(c.type||"")).toLowerCase().includes(q);}).sort(function(a,b){return clientName(a).localeCompare(clientName(b),"ko");});
  if(!list.length)return '<div class="empty">등록된 클라이언트가 없습니다.</div>';
  return list.map(function(c){
    var tasks=clientTodos(c).length;
    return '<button class="client-button '+(state.view==="client"&&c.id===state.activeClientId?'active':'')+'" data-client-id="'+esc(c.id)+'"><span class="client-avatar">'+esc(initials(clientName(c)))+'</span><span><strong>'+esc(clientName(c))+'</strong><small>'+esc(c.type||"CLIENT")+'</small></span><span class="client-count">'+tasks+'</span></button>';
  }).join("");
}

function shell(){
  return '<div class="site-shell">'+
  '<header class="site-header">'+
    '<div class="site-header-left"><img class="site-logo" src="./assets/nineworks-logo.svg" alt="NINEWORKS"><span class="site-kicker">NINEWORKS / WORK DESK</span></div>'+
    '<div class="site-header-right"><span class="site-meta">PERSONAL OPERATING SYSTEM · 2026</span><button class="header-action" id="addWorkLog">WORK LOG ↗</button><button class="header-action solid" id="addMeeting">MEETING ↗</button><button class="header-menu" id="mobileClients">MENU</button></div>'+
  '</header>'+
  '<div class="workspace">'+
    '<aside id="sidebar" class="sidebar">'+
      '<div class="nav-group-label">WORK</div>'+
      '<nav class="desk-nav">'+
        '<button class="desk-nav-item '+(state.view==="desk"?"active":"")+'" data-workdesk><span>01</span><strong>WORK DESK</strong><small>TODAY & OVERVIEW</small></button>'+
        '<button class="desk-nav-item '+(["clients","client"].includes(state.view)?"active":"")+'" data-client-index><span>02</span><strong>CLIENTS</strong><small>WORK & MEETING</small></button>'+
        '<button class="desk-nav-item '+(state.view==="journal"?"active":"")+'" data-journal-nav><span>03</span><strong>JOURNAL</strong><small>DAILY / HISTORY</small></button>'+
        '<button class="desk-nav-item '+(state.view==="weekly"?"active":"")+'" data-weekly-nav><span>04</span><strong>WEEKLY REPORT</strong><small>WEEKLY / HISTORY</small></button>'+
      '</nav>'+
      '<div class="nav-group-label business">BUSINESS</div>'+
      '<nav class="desk-nav business-nav">'+
        '<button class="desk-nav-item '+(["finance","partner"].includes(state.view)?"active":"")+'" data-finance-nav><span>05</span><strong>FINANCE & TAX</strong><small>SALES / INVOICE / CONTRACT</small></button>'+
      '</nav>'+
      '<div class="client-side-area">'+
        '<div class="side-intro"><p class="eyebrow">CLIENT INDEX</p><h2>Clients</h2><p>현재 진행 중인 클라이언트 업무를 빠르게 확인합니다.</p></div>'+
        '<label class="client-search"><input id="clientSearch" type="search" placeholder="SEARCH CLIENT"></label>'+
        '<div id="clientList" class="client-list">'+clientList()+'</div>'+
        '<div class="side-actions"><button class="btn primary" id="addClient">＋ ADD CLIENT</button></div>'+
      '</div>'+
      '<div class="side-user-area"><div class="user-mini"><strong>'+esc(state.profile&&state.profile.name||state.user&&state.user.email||"NINEWORKS")+'</strong><span>'+esc(state.profile&&state.profile.role||"OWNER")+'</span></div><button class="btn" id="logoutBtn">LOGOUT ↗</button></div>'+
    '</aside>'+
    '<main class="main"><div id="content" class="content"></div></main>'+
  '</div>'+
  '<input id="partnerImport" type="file" accept=".xlsx,.xls" hidden><div id="modalBackdrop" class="modal-backdrop" hidden></div><section id="modal" class="modal" hidden></section>'+
  '</div>';
}

function runOpeningIntro(){
  var intro=$("#openingIntro");
  if(!intro)return;
  requestAnimationFrame(function(){intro.classList.add("show");});
  setTimeout(function(){intro.classList.add("hide");},850);
  setTimeout(function(){if(intro&&intro.parentNode)intro.parentNode.removeChild(intro);},1450);
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


function dashboardTaskMarkup(t){
  var c=clientForTask(t),name=c?clientName(c):(t.client||"GENERAL");
  return '<div class="desk-task"><button class="desk-check" data-complete-task="'+esc(t.id)+'">✓</button><div class="desk-task-main"><div class="desk-task-meta"><span>'+esc(name)+'</span>'+(t.project?'<span>'+esc(t.project)+'</span>':'')+'</div><strong>'+esc(t.title||"업무")+'</strong>'+(t.memo?'<p>'+esc(t.memo)+'</p>':'')+'</div><time class="'+(t.due&&t.due<today()?"overdue":"")+'">'+esc(t.due?formatDate(t.due):"NO DATE")+'</time></div>';
}
function workloadBars(){
  var days=recentDays(7),values=days.map(function(key){return logsOnDay(key).length;}),max=Math.max.apply(null,values.concat([1]));
  return days.map(function(key,i){
    var d=new Date(key+"T00:00:00"),label=["SUN","MON","TUE","WED","THU","FRI","SAT"][d.getDay()];
    var h=Math.max(5,Math.round((values[i]/max)*100));
    return '<div class="workload-day"><div class="workload-value">'+values[i]+'</div><div class="workload-track"><i style="height:'+h+'%"></i></div><span>'+label+'</span><small>'+key.slice(5).replace("-",".")+'</small></div>';
  }).join("");
}
function clientWorkload(){
  var since=recentDays(7)[0];
  return state.clients.map(function(c){
    var open=clientTodos(c).length;
    var recent=state.logs.filter(function(l){return (l.clientId===c.id||l.client===clientName(c))&&(l.date||"")>=since;}).length;
    return {c:c,open:open,recent:recent,total:open+recent};
  }).filter(function(x){return x.total>0;}).sort(function(a,b){return b.total-a.total;}).slice(0,7);
}
function attentionItems(){
  var items=[];
  overdueTasks().slice(0,4).forEach(function(t){
    var c=clientForTask(t);items.push({type:"DEADLINE",title:t.title||"업무",meta:(c?clientName(c):(t.client||"GENERAL"))+" · "+formatDate(t.due),client:c});
  });
  state.contracts.filter(function(c){return outstanding(c)>0;}).sort(function(a,b){return outstanding(b)-outstanding(a);}).slice(0,3).forEach(function(ct){
    items.push({type:"OUTSTANDING",title:ct.projectName||ct.clientName||"계약",meta:(ct.clientName||"CLIENT")+" · "+won(outstanding(ct)),client:clientByName(ct.clientName)});
  });
  var weekAgo=recentDays(8)[0];
  state.clients.forEach(function(c){
    if(!clientTodos(c).length)return;
    var latest=state.logs.filter(function(l){return l.clientId===c.id||l.client===clientName(c);}).sort(function(a,b){return (b.date||"").localeCompare(a.date||"");})[0];
    if(!latest||((latest.date||"")<weekAgo))items.push({type:"NO UPDATE",title:clientName(c),meta:"진행 업무 "+clientTodos(c).length+"건 · 최근 기록 없음",client:c});
  });
  return items.slice(0,8);
}
function briefingText(){
  var open=openTasks().length,over=overdueTasks().length,todayLog=logsOnDay(today()).length,out=totalOutstanding();
  var parts=[];
  if(over)parts.push("마감이 지난 업무 "+over+"건을 먼저 확인하는 것이 좋습니다.");
  if(open>=8)parts.push("현재 열린 업무가 "+open+"건으로 업무량이 높은 편입니다.");
  else if(open)parts.push("현재 진행할 업무는 "+open+"건입니다.");
  if(todayLog)parts.push("오늘 "+todayLog+"건의 업무·미팅 기록이 쌓였습니다.");
  else parts.push("아직 오늘 기록된 업무 로그가 없습니다.");
  if(out>0)parts.push("미수금 "+won(out)+"도 함께 확인이 필요합니다.");
  return parts.join(" ");
}
function dashboardPage(){
  var tasks=todayTasks(),todayLog=logsOnDay(today());
  var workOnly=todayLog.filter(function(l){return (l.type||"work")==="work";}).length;
  var meetings=todayLog.filter(function(l){return l.type==="meeting";}).length;
  var completedToday=state.todos.filter(function(t){return (t.done&&dateKeyFromValue(t.completedAt)===today())||t.completedDate===today();}).length;
  var weekDays=recentDays(7);
  var weekLogs=state.logs.filter(function(l){var key=l.date||dateKeyFromValue(l.createdAt);return key>=weekDays[0]&&key<=weekDays[6];}).length;
  var weekMeetings=state.logs.filter(function(l){var key=l.date||dateKeyFromValue(l.createdAt);return l.type==="meeting"&&key>=weekDays[0]&&key<=weekDays[6];}).length;
  var clientLoads=clientWorkload(),attention=attentionItems().filter(function(x){return x.type!=="OUTSTANDING";});
  var recent=state.logs.slice().sort(function(a,b){return (b.date||"").localeCompare(a.date||"")||Number(b.createdAtMs||0)-Number(a.createdAtMs||0);}).slice(0,8);
  var journal=state.journals.find(function(j){return j.date===today();});
  var weekJournalCount=state.journals.filter(function(j){return j.date>=weekDays[0]&&j.date<=weekDays[6];}).length;
  var d=new Date(),dateLabel=d.toLocaleDateString("ko-KR",{month:"long",day:"numeric",weekday:"short"});
  return '<section class="desk-page overview-dashboard">'+
    '<section class="overview-head">'+
      '<div><p class="eyebrow">NINEWORKS / WORK DESK</p><h1>업무 대시보드</h1><p>'+esc(dateLabel)+' · '+esc(briefingText().replace(/미수금[^.]*\.?/g,""))+'</p></div>'+
      '<div class="overview-status"><span>TODAY</span><strong>'+tasks.length+'</strong><small>OPEN WORK</small></div>'+
    '</section>'+
    '<section class="overview-kpis">'+
      '<div><span>01 / 오늘 할 일</span><strong>'+tasks.length+'</strong><small>현재 처리 대상</small></div>'+
      '<div><span>02 / 오늘 완료</span><strong>'+completedToday+'</strong><small>완료 처리</small></div>'+
      '<div><span>03 / 오늘 기록</span><strong>'+workOnly+'</strong><small>작업 로그</small></div>'+
      '<div><span>04 / 이번 주 기록</span><strong>'+weekLogs+'</strong><small>작업 + 미팅</small></div>'+
      '<div><span>05 / 활성 클라이언트</span><strong>'+activeClientCount()+'</strong><small>최근 14일 기준</small></div>'+
      '<div><span>06 / 지연 업무</span><strong>'+overdueTasks().length+'</strong><small>마감일 경과</small></div>'+
    '</section>'+
    '<section class="overview-grid top">'+
      '<article class="overview-panel today-panel"><div class="overview-panel-head"><div><p class="eyebrow">TODAY WORK</p><h2>오늘 처리할 업무</h2></div><span>'+tasks.length+' WORKS</span></div><div class="desk-task-list">'+(tasks.length?tasks.slice(0,8).map(dashboardTaskMarkup).join(""):'<div class="empty large">현재 등록된 업무가 없습니다.</div>')+'</div></article>'+
      '<article class="overview-panel attention-panel"><div class="overview-panel-head"><div><p class="eyebrow">NEED ATTENTION</p><h2>확인이 필요한 것</h2></div><span>'+attention.length+' ITEMS</span></div><div class="attention-list">'+(attention.length?attention.slice(0,6).map(function(x){return '<button class="attention-item" '+(x.client?'data-client-id="'+esc(x.client.id)+'"':'')+'><span>'+esc(x.type)+'</span><strong>'+esc(x.title)+'</strong><small>'+esc(x.meta)+'</small></button>';}).join(""):'<div class="empty large">지금 바로 확인할 업무 이슈가 없습니다.</div>')+'</div></article>'+
    '</section>'+
    '<section class="overview-grid middle">'+
      '<article class="overview-panel workload-panel"><div class="overview-panel-head"><div><p class="eyebrow">7 DAY WORKLOAD</p><h2>최근 업무량</h2><p>작업 로그와 미팅 기록 기준</p></div><span>'+weekLogs+' RECORDS</span></div><div class="workload-chart compact-chart">'+workloadBars()+'</div></article>'+
      '<article class="overview-panel clientload-panel"><div class="overview-panel-head"><div><p class="eyebrow">CLIENT LOAD</p><h2>클라이언트별 업무량</h2><p>최근 7일 기록 + 열린 업무</p></div><span>TOP '+clientLoads.length+'</span></div><div class="client-load-list">'+(clientLoads.length?clientLoads.map(function(x){return '<button class="client-load-row" data-client-id="'+esc(x.c.id)+'"><span>'+esc(clientName(x.c))+'</span><div><i style="width:'+Math.min(100,x.total*12)+'%"></i></div><strong>'+x.total+'</strong><small>OPEN '+x.open+' · LOG '+x.recent+'</small></button>';}).join(""):'<div class="empty large">집계할 업무가 없습니다.</div>')+'</div></article>'+
    '</section>'+
    '<section class="overview-grid bottom">'+
      '<article class="overview-panel journal-panel"><div class="overview-panel-head"><div><p class="eyebrow">WORK JOURNAL</p><h2>기록 현황</h2></div><button class="section-link" data-journal-nav>JOURNAL ↗</button></div>'+
        '<div class="work-journal-snapshot"><div><span>TODAY JOURNAL</span><strong>'+(journal?"저장됨":"미저장")+'</strong></div><div><span>THIS WEEK JOURNAL</span><strong>'+weekJournalCount+' / 7</strong></div><div><span>THIS WEEK MEETING</span><strong>'+weekMeetings+'</strong></div><div><span>THIS WEEK LOG</span><strong>'+weekLogs+'</strong></div></div>'+
      '</article>'+
      '<article class="overview-panel recent-panel"><div class="overview-panel-head"><div><p class="eyebrow">RECENT ACTIVITY</p><h2>최근 업무 기록</h2></div><span>LATEST '+recent.length+'</span></div><div class="overview-recent-list">'+(recent.length?recent.map(function(l){var c=clientForLog(l);return '<article class="overview-recent-item"><time>'+esc(formatDate(l.date||dateKeyFromValue(l.createdAt)))+'</time><div><span>'+esc(c?clientName(c):(l.client||"GENERAL"))+'</span><strong>'+esc(l.title||"업무 기록")+'</strong><small>'+esc(l.type==="meeting"?"MEETING":(l.project||"WORK LOG"))+'</small></div></article>';}).join(""):'<div class="empty large">아직 업무 기록이 없습니다.</div>')+'</div></article>'+
    '</section>'+
  '</section>';
}

function clientIndexPage(){
  var q=state.query.trim().toLowerCase();
  var clients=state.clients.filter(function(c){return !q||((clientName(c)+" "+(c.type||"")+" "+(c.work||"")).toLowerCase().includes(q));})
    .sort(function(a,b){
      var ao=clientTodos(a).length,bo=clientTodos(b).length;
      return bo-ao||clientName(a).localeCompare(clientName(b),"ko");
    });
  return '<section class="client-index-page">'+
    '<div class="client-index-head"><div><p class="eyebrow">NINEWORKS / CLIENT WORKSPACE</p><h1>클라이언트 업무</h1><p>업무, 작업 로그, 미팅 기록을 클라이언트별로 관리합니다. 세무·매출·계약은 Finance & Tax에서 별도로 확인합니다.</p></div><button class="btn primary" id="addClientInline">＋ ADD CLIENT</button></div>'+
    '<div class="client-index-summary"><div><span>ACTIVE CLIENTS</span><strong>'+state.clients.length+'</strong></div><div><span>OPEN WORK</span><strong>'+openTasks().length+'</strong></div><div><span>THIS WEEK LOG</span><strong>'+state.logs.filter(function(l){var k=l.date||dateKeyFromValue(l.createdAt);return k>=recentDays(7)[0];}).length+'</strong></div></div>'+
    '<div class="client-work-table">'+
      '<div class="client-work-head"><span>CLIENT</span><span>OPEN WORK</span><span>RECENT LOG</span><span>MEETING</span><span>STATUS</span></div>'+
      (clients.length?clients.map(function(c){
        var logs=clientLogs(c,"work"),meetings=clientLogs(c,"meeting"),open=clientTodos(c).length;
        return '<button class="client-work-row" data-client-id="'+esc(c.id)+'"><div><strong>'+esc(clientName(c))+'</strong><small>'+esc(c.type||"CLIENT")+'</small></div><b>'+open+'</b><span>'+esc(logs[0]?formatDate(logs[0].date):"—")+'</span><span>'+meetings.length+'</span><em>'+(open?"ACTIVE":"CLEAR")+'</em></button>';
      }).join(""):'<div class="empty large">등록된 클라이언트가 없습니다.</div>')+
    '</div>'+
  '</section>';
}

function clientPage(c){
  var todos=clientTodos(c),logs=clientLogs(c,"work"),meetings=clientLogs(c,"meeting");
  var latest=[].concat(logs,meetings).sort(function(a,b){return (b.date||"").localeCompare(a.date||"");})[0];
  return '<section class="client-page work-only">'+
    '<div class="client-hero compact-client">'+
      '<div class="client-hero-copy"><p class="eyebrow">CLIENT / WORKSPACE</p><h1>'+esc(clientName(c))+'</h1><p class="client-lead">'+esc(c.work||c.description||"현재 업무, 작업 로그와 미팅 기록을 관리합니다.")+'</p></div>'+
      '<div class="client-hero-actions"><button class="hero-link" data-action="task">ADD WORK ↗</button><button class="hero-link" data-action="log">ADD LOG ↗</button><button class="hero-link" data-action="meeting">ADD MEETING ↗</button></div>'+
    '</div>'+
    '<div class="client-facts work-facts">'+
      '<div><span>01 / OPEN WORK</span><strong>'+todos.length+'</strong></div>'+
      '<div><span>02 / WORK LOG</span><strong>'+logs.length+'</strong></div>'+
      '<div><span>03 / MEETING</span><strong>'+meetings.length+'</strong></div>'+
      '<div><span>04 / LAST UPDATE</span><strong class="date-value">'+esc(latest?formatDate(latest.date):"—")+'</strong></div>'+
    '</div>'+
    '<section class="nw-section compact-section">'+
      '<div class="nw-section-head"><div><p class="eyebrow">01 / CURRENT WORK</p><h2>진행 중인 업무</h2><p>지금 실제로 처리하고 있는 업무만 봅니다.</p></div><button class="section-link" data-action="task">ADD WORK ↗</button></div>'+
      '<div class="nw-section-body">'+(todos.length?todos.map(taskMarkup).join(""):'<div class="empty large">현재 진행 중인 작업이 없습니다.</div>')+'</div>'+
    '</section>'+
    '<section class="nw-section compact-section">'+
      '<div class="nw-section-head"><div><p class="eyebrow">02 / WORK LOG</p><h2>작업 기록</h2><p>날짜별 작업 히스토리를 남깁니다.</p></div><button class="section-link" data-action="log">ADD LOG ↗</button></div>'+
      '<div class="nw-section-body timeline">'+(logs.length?logs.map(logMarkup).join(""):'<div class="empty large">아직 작업 로그가 없습니다.</div>')+'</div>'+
    '</section>'+
    '<section class="nw-section compact-section">'+
      '<div class="nw-section-head"><div><p class="eyebrow">03 / MEETING</p><h2>미팅 기록</h2><p>논의 내용, 결정사항과 다음 액션을 관리합니다.</p></div><button class="section-link" data-action="meeting">ADD MEETING ↗</button></div>'+
      '<div class="nw-section-body meeting-list">'+(meetings.length?meetings.map(meetingMarkup).join(""):'<div class="empty large">등록된 미팅 기록이 없습니다.</div>')+'</div>'+
    '</section>'+
    '<section class="nw-section compact-section client-profile-section">'+
      '<div class="nw-section-head"><div><p class="eyebrow">04 / CLIENT PROFILE</p><h2>클라이언트 정보</h2><p>업무 연락에 필요한 기본정보만 유지합니다.</p></div><button class="section-link" data-action="edit-client">EDIT CLIENT ↗</button></div>'+
      '<div class="client-profile-only"><div class="info-row"><span>TYPE</span><strong>'+esc(c.type||"—")+'</strong></div><div class="info-row"><span>CONTACT</span><strong>'+esc(c.contact||c.manager||"—")+'</strong></div><div class="info-row"><span>PHONE</span><strong>'+esc(c.phone||"—")+'</strong></div><div class="info-row"><span>EMAIL</span><strong>'+esc(c.email||"—")+'</strong></div><div class="info-row"><span>NOTE</span><strong>'+esc(c.note||"—")+'</strong></div></div>'+
      '<div class="finance-jump"><span>세무·매출·계약 정보는 별도 관리합니다.</span><button class="section-link" data-finance-nav>FINANCE & TAX ↗</button></div>'+
    '</section>'+
  '</section>';
}


function weekMonday(value){
  var d=new Date((value||today())+"T12:00:00");
  if(isNaN(d.getTime()))return "";
  d.setDate(d.getDate()-(d.getDay()+6)%7);
  return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
}
function weeklyList(items){
  return items.slice().sort(function(a,b){return (b.weekStart||"").localeCompare(a.weekStart||"");}).map(function(r){
    return '<button class="weekly-archive-item '+(r.weekStart===state.weeklySelection?"active":"")+'" data-weekly-open="'+esc(r.weekStart)+'"><strong>'+esc(r.weekStart)+' ~ '+esc(r.weekEnd||"")+'</strong><small>'+esc(r.title||"주간 업무보고서")+'</small></button>';
  }).join("");
}
function weeklyRows(rows){
  return rows&&rows.length?'<div class="weekly-projects">'+rows.map(function(x){
    return '<article><div><strong>'+esc(x.client||x.project||"기타")+'</strong><p>'+esc(x.summary||x.detail||"")+'</p></div><span>'+esc(x.status||"확인 필요")+'</span></article>';
  }).join("")+'</div>':'<p class="journal-empty">확인된 항목이 없습니다.</p>';
}
function weeklyBullets(items){
  return items&&items.length?'<ul class="journal-bullets">'+items.map(function(x){return '<li>'+esc(typeof x==="string"?x:(x.text||x.summary||x.title||""))+'</li>';}).join("")+'</ul>':'<p class="journal-empty">확인된 기록이 없습니다.</p>';
}
function weeklyReportPage(){
  var selected=state.weeklySelection||weekMonday(today());
  var r=state.weeklyReports.find(function(x){return x.weekStart===selected;})||null;
  var days=r&&Array.isArray(r.dailyLoad)?r.dailyLoad:[];
  var endDate=new Date(selected+"T12:00:00");endDate.setDate(endDate.getDate()+5);var currentEnd=[endDate.getFullYear(),String(endDate.getMonth()+1).padStart(2,"0"),String(endDate.getDate()).padStart(2,"0")].join("-");
  var entries=state.journals.filter(function(x){return x.date>=selected&&x.date<=(r&&r.weekEnd||currentEnd);});
  return '<section class="weekly-page">'+
    '<div class="weekly-hero"><div><p class="eyebrow">NINEWORKS / WORK REPORT</p><h1>주간 업무보고서</h1><p>월~토 업무를 프로젝트별로 통합합니다. 업무 기록 건수와 실제 완료 건수를 구분합니다.</p></div>'+
    '<label class="journal-import">IMPORT JSON<input id="weeklyImport" type="file" accept=".json,application/json"></label></div>'+
    (state.weeklyError?'<p class="journal-error">'+esc(state.weeklyError)+'</p>':'')+
    '<div class="weekly-layout"><aside class="weekly-archive"><p class="eyebrow">WEEKLY HISTORY</p>'+weeklyList(state.weeklyReports)+'</aside>'+
    '<div class="weekly-main">'+(r?
      '<div class="weekly-title"><div><p class="eyebrow">'+esc(r.weekStart)+' — '+esc(r.weekEnd||"")+'</p><h2>'+esc(r.title||"주간 업무보고서")+'</h2><p>'+esc(r.summary||"")+'</p></div><button class="journal-export" data-weekly-export>EXPORT JSON</button></div>'+
      '<div class="weekly-metrics"><div><span>기록 항목</span><strong>'+esc(r.metrics&&r.metrics.recordCount!=null?r.metrics.recordCount:"—")+'</strong></div><div><span>완료 확인</span><strong>'+esc(r.metrics&&r.metrics.completedCount!=null?r.metrics.completedCount:"확인 필요")+'</strong></div><div><span>피드백</span><strong>'+esc(r.metrics&&r.metrics.feedbackCount!=null?r.metrics.feedbackCount:"—")+'</strong></div><div><span>대기</span><strong>'+esc(r.metrics&&r.metrics.waitingCount!=null?r.metrics.waitingCount:"—")+'</strong></div></div>'+
      '<section class="weekly-section"><p class="eyebrow">01 / WEEKLY SUMMARY</p><h3>핵심 요약</h3><p>'+esc(r.summary||"")+'</p></section>'+
      '<section class="weekly-section"><p class="eyebrow">02 / PROJECT STATUS</p><h3>프로젝트별 진행</h3>'+weeklyRows(r.projects)+'</section>'+
      '<section class="weekly-section"><p class="eyebrow">03 / COMPLETED</p><h3>완료 업무</h3>'+weeklyBullets(r.completed)+'</section>'+
      '<section class="weekly-section"><p class="eyebrow">04 / CARRYOVER</p><h3>미완료·이월</h3>'+weeklyBullets(r.carryover)+'</section>'+
      '<section class="weekly-section"><p class="eyebrow">05 / DECISIONS</p><h3>주요 결정·성과</h3>'+weeklyBullets(r.decisions)+'</section>'+
      '<section class="weekly-section"><p class="eyebrow">06 / MEETINGS</p><h3>미팅·후속 액션</h3>'+weeklyBullets(r.meetings)+'</section>'+
      '<section class="weekly-section"><p class="eyebrow">07 / WORKLOAD</p><h3>일별 업무 기록</h3><div class="weekly-daily">'+days.map(function(d){return '<div><span>'+esc(d.date||"")+'</span><strong>'+esc(d.count==null?"—":d.count)+'</strong></div>';}).join("")+'</div><h4 class="weekly-load-subtitle">프로젝트별 기록량</h4><div class="weekly-client-load">'+(Array.isArray(r.clientLoad)?r.clientLoad.map(function(x){return '<div><span>'+esc(x.client||"기타")+'</span><strong>'+esc(x.count==null?"—":x.count)+'</strong></div>';}).join(""):"")+'</div><p class="weekly-footnote">'+esc(r.workloadNote||"기록 수는 작업 완료 건수 또는 투입 시간을 의미하지 않습니다.")+'</p></section>'+
      '<section class="weekly-section"><p class="eyebrow">08 / OPERATIONS</p><h3>운영 현황</h3>'+weeklyBullets(r.operations)+'</section>'+
      '<section class="weekly-section"><p class="eyebrow">09 / RISKS</p><h3>리스크·확인 필요</h3>'+weeklyBullets(r.risks)+'</section>'+
      '<section class="weekly-section"><p class="eyebrow">10 / NEXT WEEK</p><h3>다음 주 우선순위</h3>'+weeklyBullets(r.nextPriorities)+'</section>'+
      '<p class="weekly-footnote">출처 및 집계 주의: '+esc(r.sourceNote||"원본 업무일지·일정과 대조가 필요한 항목은 확인 필요로 표시했습니다.")+'</p>'+(Array.isArray(r.sourceLinks)&&/^https:\/\//.test(r.sourceLinks[0]||"")?'<p class="weekly-footnote"><a href="'+esc(r.sourceLinks[0])+'" target="_blank" rel="noopener noreferrer">원본 주간보고서 확인 ↗</a></p>':'')
    :
      '<div class="weekly-empty"><h2>아직 저장된 주간 보고서가 없습니다.</h2><p>작성된 주간 보고서 JSON을 가져오면 비공개 Firestore에 날짜별로 저장합니다. 현재 일간 업무일지 등록 '+entries.length+'건이 확인됩니다.</p></div>'
    )+'</div></div></section>';
}

function journalList(items){
  if(!items||!items.length)return '<div class="empty large">저장된 업무일지가 없습니다.</div>';
  return items.slice().sort(function(a,b){return (b.date||"").localeCompare(a.date||"");}).map(function(j){
    return '<button class="journal-date-row '+(j.date===state.journalDate?"active":"")+'" data-journal-open="'+esc(j.date||"")+'"><span>'+esc(j.date||"")+'</span><strong>'+esc((j.entries||[]).length)+' WORK ITEMS</strong><small>'+esc(j.reviewStatus||"저장됨")+'</small></button>';
  }).join("");
}
function journalBullet(items){
  if(!items||!items.length)return '<p class="journal-empty">등록된 내용이 없습니다.</p>';
  return '<ul class="journal-bullets">'+items.map(function(v){return '<li>'+esc(typeof v==="string"?v:JSON.stringify(v))+'</li>';}).join("")+'</ul>';
}
function journalMeetingsMarkup(j){
  var meetings=Array.isArray(j&&j.meetings)?j.meetings:[];
  if(!meetings.length)return '<p class="journal-prose">'+esc(j&&j.meetingNote||"미팅 확정 기록 없음")+'</p>';
  var out=meetings.map(function(m){
    var followups=Array.isArray(m.followupActions)?m.followupActions:(Array.isArray(m.followup)?m.followup:[]);
    var details=Array.isArray(m.feedback)?m.feedback:[];
    return '<article class="journal-meeting-card"><div class="journal-meeting-head"><strong>'+esc(m.title||"피드백 기록")+'</strong><span>'+esc(m.status||m.heldStatus||"확인 필요")+'</span></div>'+
      '<p class="journal-meeting-client">'+esc([m.client,m.date].filter(Boolean).join(" / "))+'</p>'+
      (details.length?'<ul class="journal-bullets">'+details.map(function(d){return '<li>'+esc(typeof d==="string"?d:(d.text||""))+'</li>';}).join("")+'</ul>':'')+
      (followups.length?'<div class="journal-followups"><span>FOLLOW-UP / 별도 업무 중복 생성 없음</span><ul>'+followups.map(function(v){return '<li>'+esc(typeof v==="string"?v:(v.action||v.title||""))+'</li>';}).join("")+'</ul></div>':'')+
    '</article>';
  }).join("");
  return '<p class="journal-prose">'+esc(j&&j.meetingNote||"")+'</p>'+out;
}

function journalPage(){
  var j=state.journals.find(function(x){return x.date===state.journalDate;})||null;
  var actions=j&&j.entries||[];
  return '<section class="journal-page">'+
    '<div class="journal-hero"><div><p class="eyebrow">NINEWORKS / WORK JOURNAL</p><h1>업무일지</h1><p>날짜별 기록을 저장하고 일간·주간·월간 보고서의 기준 데이터로 관리합니다.</p></div>'+
      '<div class="journal-controls"><label>DATE<input id="journalDate" type="date" value="'+esc(state.journalDate||today())+'"></label><label class="journal-import">IMPORT JSON<input id="journalImport" type="file" accept="application/json,.json"></label></div>'+
    '</div>'+
    (state.journalError?'<p class="journal-error">'+esc(state.journalError)+'</p>':'')+
    '<div class="journal-layout"><div class="journal-list"><div class="journal-group-header"><p class="eyebrow">01 / ARCHIVE</p><strong>DAILY HISTORY</strong></div>'+journalList(state.journals)+'</div>'+
      '<div class="journal-content">'+(j?
        '<div class="journal-head"><div><p class="eyebrow">02 / DAILY JOURNAL</p><h2>'+esc(j.date||"")+'</h2><p>'+esc(j.summary||"")+'</p></div><button data-journal-export class="journal-export">EXPORT JSON</button></div>'+
        '<div class="journal-status"><span>'+esc(j.reviewStatus||"저장됨")+'</span><span>'+actions.length+' 기록 항목</span><span>시간·완료 건수는 별도 검증</span></div>'+
        '<div class="journal-section"><p class="eyebrow">01 / TODAY WORK</p><h3>오늘 진행한 업무</h3><div class="journal-work-rows">'+(actions.length?actions.map(function(e){
          return '<article class="journal-work"><div><span>'+esc(e.client||"기타")+' / '+esc(e.project||"")+'</span><strong>'+esc(e.title||"업무")+'</strong><p>'+esc(e.details||"")+'</p><small>'+esc(e.nextAction||"")+'</small></div><em>'+esc(e.status||"확인 필요")+'</em></article>';
        }).join(""):'<p class="journal-empty">등록된 업무가 없습니다.</p>')+'</div></div>'+
        '<div class="journal-section"><p class="eyebrow">02 / DECISIONS</p><h3>주요 결정·성과</h3>'+journalBullet(j.decisions)+'</div>'+
        '<div class="journal-section"><p class="eyebrow">03 / PENDING</p><h3>미완료·확인 필요</h3>'+journalBullet(j.pending)+'</div>'+
        '<div class="journal-section"><p class="eyebrow">04 / OPERATIONS</p><h3>운영 현황</h3><p class="journal-prose">'+esc((j.operations&&j.operations.note)||"실제 완료 건수 및 시간은 원본 로그 기준으로 별도 집계합니다.")+'</p></div>'+
        '<div class="journal-section"><p class="eyebrow">05 / REVIEW</p><h3>하루 회고</h3><p class="journal-prose">'+esc(j.reflection||"")+'</p></div>'+
        '<div class="journal-section"><p class="eyebrow">06 / NEXT PRIORITIES</p><h3>다음날 우선순위</h3>'+journalBullet(j.tomorrowPriorities)+'</div>'+
        '<div class="journal-section"><p class="eyebrow">07 / MEETING ACTIONS</p><h3>미팅 후속 액션</h3>'+journalMeetingsMarkup(j)+'</div>'
        :'<div class="journal-blank"><p class="eyebrow">02 / DAILY JOURNAL</p><h2>'+esc(state.journalDate||today())+'</h2><p>이 날짜의 업무일지가 아직 저장되지 않았습니다. 대화 기반 자동 정리 JSON 파일을 불러오면 로그인된 CRM의 비공개 Firestore 업무일지에 저장됩니다.</p></div>')+
      '</div></div></section>';
}


function partnerSalesTotals(){
  var list=state.tradePartners;
  if(!list.length)return {count:53,active2026:29,sales2025:416391928,sales2026:228690054,invoices:213,corrections:63};
  return {
    count:list.length,
    active2026:list.filter(function(p){return Number(p.sales2026||0)!==0;}).length,
    sales2025:list.reduce(function(n,p){return n+Number(p.sales2025||0);},0),
    sales2026:list.reduce(function(n,p){return n+Number(p.sales2026||0);},0),
    invoices:list.reduce(function(n,p){return n+Number(p.invoiceCount||0);},0),
    corrections:list.reduce(function(n,p){return n+Number(p.correctionCount||0);},0)
  };
}
function clientsDashboard(){
  var totals=partnerSalesTotals();
  var q=state.partnerQuery.trim().toLowerCase();
  var partners=state.tradePartners.filter(function(p){
    return !q||((p.name||"")+" "+(p.representative||"")+" "+(p.address||"")+" "+(p.industry||"")+" "+(p.category||"")).toLowerCase().includes(q);
  }).sort(function(a,b){return Number(b.sales2026||0)-Number(a.sales2026||0)||String(a.name||"").localeCompare(String(b.name||""),"ko");});
  return '<section class="partner-dashboard">'+
    '<section class="partner-hero"><div><p class="eyebrow">NINEWORKS / FINANCE & TAX</p><h1>세무·매출 관리</h1><p>거래처, 매출, 세금계산서, 계약과 미수 정보를 업무 영역과 분리해서 관리합니다.</p></div><div class="partner-hero-actions"><button class="btn" data-partner-new>＋ 거래처 추가</button><button class="btn primary" data-partner-import>거래처 마스터 가져오기 ↗</button></div></section>'+
    '<section class="partner-metrics">'+
      '<div><span>01 / PARTNERS</span><strong>'+totals.count+'</strong><small>전체 거래처</small></div>'+
      '<div><span>02 / 2026 ACTIVE</span><strong>'+totals.active2026+'</strong><small>2026 거래 발생</small></div>'+
      '<div><span>03 / 2025 SALES</span><strong>'+won(totals.sales2025)+'</strong><small>공급가액 기준</small></div>'+
      '<div><span>04 / 2026 SALES</span><strong>'+won(totals.sales2026)+'</strong><small>11월 10일까지</small></div>'+
      '<div><span>05 / INVOICES</span><strong>'+totals.invoices+'</strong><small>수정 '+totals.corrections+'건</small></div>'+
    '</section>'+
    '<section class="partner-list-section"><div class="partner-list-head"><div><p class="eyebrow">TAX / PARTNER DATABASE</p><h2>거래처·계산서 마스터</h2></div><label class="partner-search"><input id="partnerSearch" type="search" placeholder="상호 / 대표자 / 주소 / 업태 / 종목 검색" value="'+esc(state.partnerQuery)+'"></label></div>'+
    (partners.length?'<div class="partner-table-wrap"><table class="partner-table"><thead><tr><th>거래처</th><th>대표자</th><th>주소 / 업태·종목</th><th>2025</th><th>2026</th><th>발행</th><th>최근거래</th></tr></thead><tbody>'+
      partners.map(function(p){return '<tr data-partner-id="'+esc(p.id)+'"><td><strong>'+esc(p.name||"—")+'</strong><small>'+esc(maskBusinessNumber(p.businessNumber))+'</small></td><td>'+esc(p.representative||"—")+'</td><td><span>'+esc(p.address||"—")+'</span><small>'+esc([p.industry,p.category].filter(Boolean).join(" / ")||"업태·종목 미입력")+'</small></td><td>'+won(p.sales2025)+'</td><td><strong>'+won(p.sales2026)+'</strong></td><td>'+Number(p.invoiceCount||0)+'<small>수정 '+Number(p.correctionCount||0)+'</small></td><td>'+esc(p.lastDate||"—")+'<small>'+esc(p.lastItem||"")+'</small></td></tr>';}).join("")+
      '</tbody></table></div>':'<div class="partner-import-empty"><p class="eyebrow">IMPORT REQUIRED</p><h3>거래처 상세정보를 가져오세요.</h3><p>분석된 53개 거래처의 총괄 수치는 반영되어 있습니다. 대표자·주소·이메일과 계산서 이력은 로그인 후 Firestore에 안전하게 저장하기 위해 거래처 마스터 엑셀을 한 번 가져오면 됩니다.</p><button class="btn primary" data-partner-import>거래처 마스터 가져오기 ↗</button></div>')+
    '</section></section>';
}
function partnerInvoiceMarkup(inv){
  return '<tr><td>'+esc(inv.date||"—")+'</td><td>'+esc(inv.item||"—")+'</td><td>'+won(inv.supply)+'</td><td>'+won(inv.tax)+'</td><td>'+won(inv.total)+'</td><td><span class="invoice-status '+(inv.correction?"correction":"")+'">'+(inv.correction?"수정":"일반")+'</span></td></tr>';
}
function partnerPage(p){
  var invoices=partnerInvoices(p);
  var linked=state.clients.find(function(c){
    var a=String(clientName(c)).replace(/\s|\(주\)|주식회사/g,"").toLowerCase();
    var b=String(p.name||"").replace(/\s|\(주\)|주식회사/g,"").toLowerCase();
    return a&&b&&(a===b||a.includes(b)||b.includes(a));
  });
  return '<section class="partner-detail">'+
    '<div class="partner-detail-head"><div><button class="back-link" data-finance-nav>← FINANCE & TAX</button><p class="eyebrow">TRADE PARTNER / '+esc(p.status||"")+'</p><h1>'+esc(p.name||"거래처")+'</h1><p>'+esc(p.lastItem||"세금계산서 및 거래 이력")+'</p></div><div class="partner-detail-actions"><button class="btn" data-partner-edit="'+esc(p.id)+'">정보 수정</button>'+(linked?'<button class="btn primary" data-client-id="'+esc(linked.id)+'">CLIENT WORKSPACE ↗</button>':'')+'</div></div>'+
    '<div class="partner-detail-metrics"><div><span>2025 SALES</span><strong>'+won(p.sales2025)+'</strong></div><div><span>2026 SALES</span><strong>'+won(p.sales2026)+'</strong></div><div><span>TOTAL SALES</span><strong>'+won(p.totalSales)+'</strong></div><div><span>INVOICES</span><strong>'+Number(p.invoiceCount||0)+'</strong><small>CORRECTION '+Number(p.correctionCount||0)+'</small></div></div>'+
    '<div class="partner-detail-grid"><section class="partner-info-panel"><div class="partner-section-head"><p class="eyebrow">01 / BUSINESS PROFILE</p><h2>거래처 정보</h2></div>'+
      '<div class="partner-info-grid"><div><span>사업자등록번호</span><strong>'+esc(maskBusinessNumber(p.businessNumber))+'</strong></div><div><span>대표자</span><strong>'+esc(p.representative||"—")+'</strong></div><div class="wide"><span>주소</span><strong>'+esc(p.address||"—")+'</strong></div><div><span>업태</span><strong>'+esc(p.industry||"—")+'</strong></div><div><span>종목</span><strong>'+esc(p.category||"—")+'</strong></div><div><span>담당자</span><strong>'+esc(p.manager||"—")+'</strong></div><div><span>연락처</span><strong>'+esc(p.phone||"—")+'</strong></div><div><span>이메일</span><strong>'+esc(p.email||"—")+'</strong></div><div><span>홈페이지</span><strong>'+esc(p.website||"—")+'</strong></div><div><span>최초거래</span><strong>'+esc(p.firstDate||"—")+'</strong></div><div><span>최근거래</span><strong>'+esc(p.lastDate||"—")+'</strong></div></div>'+
    '</section><section class="partner-info-panel"><div class="partner-section-head"><p class="eyebrow">02 / SALES HISTORY</p><h2>거래 현황</h2></div><div class="partner-sales-notes"><div><span>최근 거래내용</span><strong>'+esc(p.lastItem||"—")+'</strong></div><div><span>최근 품목</span><strong>'+esc(p.recentItems||"—")+'</strong></div><div><span>거래 상태</span><strong>'+esc(p.status||"—")+'</strong></div></div></section></div>'+
    '<section class="partner-invoices"><div class="partner-section-head"><p class="eyebrow">03 / TAX INVOICE</p><h2>세금계산서 발행 이력</h2><span>'+invoices.length+' RECORDS</span></div>'+
      (invoices.length?'<div class="partner-table-wrap"><table class="partner-table invoice-table"><thead><tr><th>작성일</th><th>품목</th><th>공급가액</th><th>세액</th><th>합계</th><th>구분</th></tr></thead><tbody>'+invoices.map(partnerInvoiceMarkup).join("")+'</tbody></table></div>':'<div class="empty large">연결된 계산서 이력이 없습니다.</div>')+
    '</section></section>';
}
function partnerForm(p){
  p=p||{};
  openModal(p.id?"거래처 정보 수정":"거래처 추가",'<form id="partnerForm"><input id="partnerId" type="hidden" value="'+esc(p.id||"")+'"><div class="form-grid"><label class="field"><span>상호 *</span><input id="partnerName" required value="'+esc(p.name||"")+'"></label><label class="field"><span>사업자등록번호</span><input id="partnerBiz" value="'+esc(p.businessNumber||"")+'"></label></div><div class="form-grid"><label class="field"><span>대표자명</span><input id="partnerRep" value="'+esc(p.representative||"")+'"></label><label class="field"><span>이메일</span><input id="partnerEmail" type="email" value="'+esc(p.email||"")+'"></label></div><label class="field"><span>주소</span><input id="partnerAddress" value="'+esc(p.address||"")+'"></label><div class="form-grid"><label class="field"><span>업태</span><input id="partnerIndustry" value="'+esc(p.industry||"")+'"></label><label class="field"><span>종목</span><input id="partnerCategory" value="'+esc(p.category||"")+'"></label></div><div class="form-grid"><label class="field"><span>담당자</span><input id="partnerManager" value="'+esc(p.manager||"")+'"></label><label class="field"><span>연락처</span><input id="partnerPhone" value="'+esc(p.phone||"")+'"></label></div><label class="field"><span>홈페이지</span><input id="partnerWebsite" value="'+esc(p.website||"")+'"></label><div class="actions"><button type="button" class="btn" data-close-modal>취소</button><button class="btn primary" type="submit">저장</button></div></form>');
}
async function importTradePartnerWorkbook(file){
  if(!window.XLSX)throw new Error("엑셀 모듈을 불러오지 못했습니다.");
  var data=await file.arrayBuffer();
  var book=window.XLSX.read(data,{type:"array",cellDates:false});
  var masterSheet=book.Sheets["거래처마스터"];
  var invoiceSheet=book.Sheets["세금계산서원장"];
  if(!masterSheet)throw new Error("거래처마스터 시트가 필요합니다.");
  var rows=window.XLSX.utils.sheet_to_json(masterSheet,{defval:""});
  var invoiceRows=invoiceSheet?window.XLSX.utils.sheet_to_json(invoiceSheet,{defval:""}):[];
  if(!rows.length)throw new Error("가져올 거래처가 없습니다.");
  if(rows.length+invoiceRows.length>480)throw new Error("한 번에 가져올 수 있는 데이터 수를 초과했습니다.");
  var batch=writeBatch(db);
  rows.forEach(function(r){
    var biz=String(r["사업자등록번호"]||"").trim();
    var id=(biz.replace(/[^0-9]/g,"")||uid("partner"));
    batch.set(doc(db,"tradePartners",id),{
      id:id,businessNumber:biz,name:String(r["거래처명"]||"").trim(),representative:String(r["대표자명"]||"").trim(),
      address:String(r["주소"]||"").trim(),email:String(r["이메일"]||"").trim(),industry:String(r["업태"]||"").trim(),
      category:String(r["종목"]||"").trim(),manager:String(r["담당자"]||"").trim(),phone:String(r["연락처"]||"").trim(),
      website:String(r["홈페이지"]||"").trim(),firstDate:String(r["최초거래일"]||"").slice(0,10),lastDate:String(r["최근거래일"]||"").slice(0,10),
      sales2025:Number(r["2025 공급가액"]||0),sales2026:Number(r["2026 공급가액"]||0),totalSales:Number(r["누적 공급가액"]||0),
      invoiceCount:Number(r["발행기록"]||0),correctionCount:Number(r["수정건수"]||0),recentItems:String(r["최근 품목(최대5)"]||""),
      lastItem:String(r["최근 거래내용"]||""),status:String(r["거래상태"]||""),importedAt:serverTimestamp(),importedBy:state.user.uid
    },{merge:true});
  });
  invoiceRows.forEach(function(r,i){
    var approval=String(r["승인번호"]||"").trim();
    var id=(approval||("invoice_"+i+"_"+String(r["사업자등록번호"]||"").replace(/[^0-9]/g,""))).replace(/\//g,"-");
    batch.set(doc(db,"taxInvoices",id),{
      id:id,businessNumber:String(r["사업자등록번호"]||"").trim(),name:String(r["거래처명"]||"").trim(),date:String(r["작성일"]||"").slice(0,10),
      year:Number(r["연도"]||0),supply:Number(r["공급가액"]||0),tax:Number(r["세액"]||0),total:Number(r["합계금액"]||0),
      correction:String(r["수정여부"]||"")==="수정",salesType:String(r["매출구분"]||""),item:String(r["품목명"]||""),approval:approval,
      importedAt:serverTimestamp()
    },{merge:true});
  });
  await batch.commit();
  toast("거래처 "+rows.length+"곳과 계산서 "+invoiceRows.length+"건을 가져왔습니다.");
}

function renderContent(){
  var c=activeClient();
  var sidebar=$("#sidebar");if(sidebar)sidebar.dataset.view=state.view;
  $("#clientList").innerHTML=clientList();
  if(state.view==="desk"){$("#content").innerHTML=dashboardPage();return;}
  if(state.view==="journal"){$("#content").innerHTML=journalPage();return;}
  if(state.view==="weekly"){$("#content").innerHTML=weeklyReportPage();return;}
  if(state.view==="clients"){$("#content").innerHTML=clientIndexPage();var addInline=$("#addClientInline");if(addInline)addInline.addEventListener("click",function(){clientForm({});});return;}
  if(state.view==="finance"){$("#content").innerHTML=clientsDashboard();var ps=$("#partnerSearch");if(ps)ps.addEventListener("input",function(e){var v=e.target.value,pos=e.target.selectionStart||v.length;state.partnerQuery=v;renderContent();var next=$("#partnerSearch");if(next){next.focus();try{next.setSelectionRange(pos,pos);}catch(_){}}});return;}
  if(state.view==="partner"){var p=activePartner();$("#content").innerHTML=p?partnerPage(p):clientsDashboard();return;}
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
  var t=state.todos.find(function(x){return x.id===id;});
  if(!t||t.done)return;
  var c=clientForTask(t);
  try{
    var date=today(),batch=writeBatch(db);
    batch.set(doc(db,"todos",id),{done:true,completedAt:serverTimestamp(),completedDate:date},{merge:true});
    batch.set(doc(db,"workLogs","completed_"+id),{id:"completed_"+id,type:"work",clientId:c?c.id:(t.clientId||""),client:c?clientName(c):(t.client||""),project:t.project||"",title:"완료 · "+(t.title||"업무"),content:t.memo||"",date:date,taskId:id,updatedBy:state.user.uid,createdAt:serverTimestamp(),createdAtMs:Date.now()},{merge:true});
    await batch.commit();
    toast("업무 완료와 작업 로그를 함께 저장했습니다.");
  }catch(err){console.error(err);toast("완료 처리하지 못했습니다.");}
}

function bindGlobal(){
  document.addEventListener("click",function(e){
    var cb=e.target.closest("[data-client-id]");if(cb){state.activeClientId=cb.dataset.clientId;state.view="client";renderContent();$("#sidebar").classList.remove("open");return;}
    if(e.target.closest("[data-close-modal]")||e.target.id==="modalBackdrop"){closeModal();return;}
    if(e.target.closest("[data-workdesk]")){state.view="desk";renderContent();return;}
    if(e.target.closest("[data-client-index]")){state.view="clients";renderContent();$("#sidebar").classList.remove("open");return;}
    if(e.target.closest("[data-finance-nav]")){state.view="finance";renderContent();$("#sidebar").classList.remove("open");return;}
    var partner=e.target.closest("[data-partner-id]");if(partner){state.activePartnerId=partner.dataset.partnerId;state.view="partner";renderContent();return;}
    if(e.target.closest("[data-partner-import]")){$("#partnerImport").click();return;}
    if(e.target.closest("[data-partner-new]")){partnerForm({});return;}
    var pedit=e.target.closest("[data-partner-edit]");if(pedit){var pp=state.tradePartners.find(function(x){return x.id===pedit.dataset.partnerEdit;});if(pp)partnerForm(pp);return;}
    if(e.target.closest("[data-journal-nav]")){state.view="journal";renderContent();$("#sidebar").classList.remove("open");return;}
    if(e.target.closest("[data-weekly-nav]")){state.view="weekly";state.weeklySelection=state.weeklySelection||weekMonday(today());renderContent();$("#sidebar").classList.remove("open");return;}
    var wopen=e.target.closest("[data-weekly-open]");if(wopen){state.weeklySelection=wopen.dataset.weeklyOpen;state.view="weekly";renderContent();return;}
    if(e.target.closest("[data-weekly-export]")){var wr=state.weeklyReports.find(function(x){return x.weekStart===state.weeklySelection;});if(wr){var blob=new Blob([JSON.stringify(wr,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="nineworks-weekly-"+wr.weekStart+".json";a.click();setTimeout(function(){URL.revokeObjectURL(url);},2000);}return;}
    var openJournal=e.target.closest("[data-journal-open]");if(openJournal){state.journalDate=openJournal.dataset.journalOpen;state.view="journal";renderContent();return;}
    if(e.target.closest("[data-journal-export]")){var item=state.journals.find(function(j){return j.date===state.journalDate;});if(item){var blob=new Blob([JSON.stringify(item,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="nineworks-journal-"+item.date+".json";a.click();setTimeout(function(){URL.revokeObjectURL(url);},2000);}return;}
    var complete=e.target.closest("[data-complete-task]");if(complete){completeTask(complete.dataset.completeTask);return;}
    var action=e.target.closest("[data-action]");if(action){var c=activeClient();if(!c)return;var a=action.dataset.action;if(a==="task")taskForm();if(a==="log")logForm();if(a==="meeting")meetingForm();if(a==="edit-client")clientForm(c);}
  });
  $("#clientSearch").addEventListener("input",function(e){state.query=e.target.value;$("#clientList").innerHTML=clientList();});
  document.addEventListener("change",async function(e){
    if(e.target.id==="journalDate"){state.journalDate=e.target.value||today();renderContent();return;}
    if(e.target.id==="weeklyImport"){
      var wf=e.target.files&&e.target.files[0];if(!wf)return;
      try{
        if(wf.size>1000000)throw new Error("1MB 이하 JSON만 가져올 수 있습니다.");
        var w=JSON.parse(await wf.text());
        if(!w||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(w.weekStart||"")||!Array.isArray(w.projects)||!Array.isArray(w.dailyLoad))throw new Error("weekStart, projects, dailyLoad 형식을 확인하세요.");
        if(weekMonday(w.weekStart)!==w.weekStart)throw new Error("weekStart는 월요일이어야 합니다.");
        var existing=state.weeklyReports.find(function(x){return x.weekStart===w.weekStart;});
        if(existing&&!window.confirm(w.weekStart+" 주간보고서를 갱신할까요?"))return;
        await setDoc(doc(db,"weeklyReports",w.weekStart),Object.assign({},w,{schemaVersion:1,updatedAt:serverTimestamp(),updatedBy:state.user.uid}),{merge:true});
        state.weeklySelection=w.weekStart;state.weeklyError="";toast("주간보고서를 저장했습니다.");
      }catch(err){console.error(err);state.weeklyError="주간보고서를 저장하지 못했습니다: "+(err.message||"형식·권한 오류");renderContent();}
      return;
    }
    if(e.target.id==="partnerImport"){var pf=e.target.files&&e.target.files[0];if(!pf)return;try{await importTradePartnerWorkbook(pf);e.target.value="";}catch(err){console.error(err);toast(err.message||"거래처 자료를 가져오지 못했습니다.");}return;}
    if(e.target.id!=="journalImport")return;
    var file=e.target.files&&e.target.files[0];if(!file)return;
    try{
      if(file.size>500000){throw new Error("500KB 이하 JSON만 가져올 수 있습니다.");}
      var obj=JSON.parse(await file.text());
      if(!obj||!/^\d{4}-\d{2}-\d{2}$/.test(obj.date)||!Array.isArray(obj.entries))throw new Error("업무일지 JSON의 date 또는 entries 형식이 올바르지 않습니다.");
      var saved=state.journals.find(function(j){return j.date===obj.date;});
      if(saved&&!window.confirm(obj.date+" 업무일지가 이미 존재합니다. 이 날짜의 보고서를 갱신할까요?"))return;
      var payload=Object.assign({},obj,{schemaVersion:1,date:obj.date,importedAt:serverTimestamp(),importedBy:state.user.uid});
      await setDoc(doc(db,"dailyJournals",obj.date),payload,{merge:true});
      state.journalDate=obj.date;state.journalError="";toast(obj.date+" 업무일지를 저장했습니다.");
    }catch(err){console.error(err);state.journalError="파일을 저장하지 못했습니다: "+(err.message||"형식 또는 권한 오류");renderContent();}
  });
  $("#addClient").addEventListener("click",function(){clientForm({});});
  $("#addWorkLog").addEventListener("click",function(){if(activeClient())logForm();else toast("클라이언트를 먼저 선택하세요.");});
  $("#addMeeting").addEventListener("click",function(){if(activeClient())meetingForm();else toast("클라이언트를 먼저 선택하세요.");});
  $("#logoutBtn").addEventListener("click",function(){signOut(auth);});
  $("#mobileClients").addEventListener("click",function(){$("#sidebar").classList.toggle("open");});

  document.addEventListener("submit",async function(e){
    if(e.target.id==="partnerForm"){
      e.preventDefault();var pid=$("#partnerId").value;var biz=$("#partnerBiz").value.trim();if(!pid)pid=(biz.replace(/[^0-9]/g,"")||uid("partner"));var existing=state.tradePartners.find(function(x){return x.id===pid;})||{};
      try{await setDoc(doc(db,"tradePartners",pid),Object.assign({},existing,{id:pid,businessNumber:biz,name:$("#partnerName").value.trim(),representative:$("#partnerRep").value.trim(),address:$("#partnerAddress").value.trim(),email:$("#partnerEmail").value.trim(),industry:$("#partnerIndustry").value.trim(),category:$("#partnerCategory").value.trim(),manager:$("#partnerManager").value.trim(),phone:$("#partnerPhone").value.trim(),website:$("#partnerWebsite").value.trim(),updatedAt:serverTimestamp(),updatedBy:state.user.uid}),{merge:true});state.activePartnerId=pid;state.view="partner";closeModal();toast("거래처 정보를 저장했습니다.");}catch(err){console.error(err);toast("거래처 정보를 저장하지 못했습니다.");}return;
    }
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
  $("#app").innerHTML=shell();bindGlobal();renderContent();runOpeningIntro();

  state.unsubs.push(onSnapshot(collection(db,"clients"),function(snap){state.clients=snap.docs.map(function(d){return Object.assign({id:d.id},d.data());});if(!state.activeClientId&&state.clients.length)state.activeClientId=state.clients[0].id;if(state.activeClientId&&!state.clients.some(function(c){return c.id===state.activeClientId;}))state.activeClientId=state.clients[0]?state.clients[0].id:"";renderContent();}));
  state.unsubs.push(onSnapshot(collection(db,"todos"),function(snap){state.todos=snap.docs.map(function(d){return Object.assign({id:d.id},d.data());});renderContent();}));
  state.unsubs.push(onSnapshot(collection(db,"workLogs"),function(snap){state.logs=snap.docs.map(function(d){var data=d.data();return Object.assign({id:d.id,createdAtMs:timestampMs(data.createdAt)},data);});renderContent();}));
  state.unsubs.push(onSnapshot(collection(db,"tradePartners"),function(snap){state.tradePartners=snap.docs.map(function(d){return Object.assign({id:d.id},d.data());});renderContent();},function(err){console.warn("tradePartners unavailable",err);}));
  state.unsubs.push(onSnapshot(collection(db,"taxInvoices"),function(snap){state.taxInvoices=snap.docs.map(function(d){return Object.assign({id:d.id},d.data());});renderContent();},function(err){console.warn("taxInvoices unavailable",err);}));
  state.unsubs.push(onSnapshot(collection(db,"weeklyReports"),function(snap){state.weeklyReports=snap.docs.map(function(d){return Object.assign({weekStart:d.id},d.data());});state.weeklySelection=state.weeklySelection||weekMonday(today());state.weeklyError="";renderContent();},function(err){console.warn("weeklyReports unavailable",err);state.weeklyError="주간보고서 Firestore 접근 권한과 연결을 확인하세요.";renderContent();}));
  state.unsubs.push(onSnapshot(collection(db,"dailyJournals"),function(snap){state.journals=snap.docs.map(function(d){return Object.assign({date:d.id},d.data());});state.journalError="";renderContent();},function(err){console.warn("dailyJournals unavailable",err);state.journalError="업무일지 데이터 접근 권한 또는 연결을 확인하세요.";renderContent();}));
  state.unsubs.push(onSnapshot(collection(db,"financeContracts"),function(snap){state.contracts=snap.docs.map(function(d){return Object.assign({id:d.id},d.data());});renderContent();},function(err){console.warn("financeContracts unavailable",err);state.contracts=[];renderContent();}));
}

function bindLogin(){
  $("#loginForm").addEventListener("submit",async function(e){e.preventDefault();var msg=$("#loginMsg");msg.textContent="로그인 중...";try{await signInWithEmailAndPassword(auth,$("#loginEmail").value.trim(),$("#loginPassword").value);msg.textContent="";}catch(err){console.error(err);msg.textContent="이메일 또는 비밀번호를 확인하세요.";}});
}
onAuthStateChanged(auth,function(user){if(user)subscribe(user);else{cleanup();state.user=null;state.profile=null;$("#app").innerHTML=loginView();bindLogin();}});
