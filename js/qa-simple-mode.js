const simpleQaStyle = document.createElement('style');
simpleQaStyle.textContent = `
  .qa-simple-hidden{display:none!important}
  .qa-simple-note{margin:10px 0 0;padding:11px 13px;border:1px solid rgba(85,119,255,.18);border-radius:9px;background:rgba(67,104,245,.045);color:#8f93a3;font-size:11px;line-height:1.55}
  .qa-report-panel.is-simple .qa-report-grid{grid-template-columns:repeat(4,minmax(0,1fr))}
  .qa-report-panel.is-simple .qa-report-field--full{grid-column:1/-1}
  .qa-report-panel.is-simple #qaReportConclusion{min-height:180px;font-size:13px;line-height:1.65}
  .qa-report-panel.is-simple .qa-report-field select{width:100%;height:44px;border:1px solid var(--line);border-radius:8px;padding:0 12px;background:#252529;color:#f2f2f4;outline:0}
  .qa-checklist-wrap.is-simple .qa-checklist{margin-top:10px;grid-template-columns:minmax(230px,1.4fr) minmax(150px,.8fr) minmax(150px,.8fr)}
  .qa-checklist-wrap.is-simple .qa-checklist>div{min-height:50px}
  .qa-checklist-wrap.is-simple .qa-check-section-title.is-shop,
  .qa-checklist-wrap.is-simple .qa-checklist--shop{display:none!important}
  .qa-state-select{width:100%;max-width:128px;height:34px;border:1px solid #3a3a42;border-radius:8px;padding:0 9px;background:#222227;color:#a9a9b2;font-size:11px;font-weight:650;outline:0;cursor:pointer;transition:border-color .18s ease,background .18s ease,color .18s ease}
  .qa-state-select[data-state="ok"]{border-color:rgba(78,190,126,.42);background:rgba(78,190,126,.08);color:#9ed9b7}
  .qa-state-select[data-state="issue"]{border-color:rgba(255,108,108,.45);background:rgba(255,108,108,.07);color:#ffaaaa}
  .qa-state-select[data-state="none"]{border-color:#3b3b43;background:#202024;color:#797982}
  .qa-checklist-wrap.is-simple .qa-check-head.qa-check-center{font-size:10px}
  @media(max-width:1000px){.qa-report-panel.is-simple .qa-report-grid{grid-template-columns:1fr 1fr}}
  @media(max-width:760px){.qa-checklist-wrap.is-simple .qa-checklist{grid-template-columns:minmax(150px,1fr) 108px 108px}.qa-state-select{max-width:96px;padding:0 5px}}
  @media(max-width:620px){.qa-report-panel.is-simple .qa-report-grid{grid-template-columns:1fr}.qa-checklist-wrap.is-simple{overflow-x:auto}.qa-checklist-wrap.is-simple .qa-checklist{min-width:560px}}
`;
document.head.appendChild(simpleQaStyle);

const $ = (s, r=document) => r.querySelector(s);

const KEEP = {
  navigation: '메뉴 · 버튼 · 링크',
  responsive: '화면 · 반응형 · 디자인',
  content: '글자 · 이미지 · 정보',
  forms: '회원가입 · 로그인',
  interaction: '주문 · 결제',
  browser: '회원탈퇴',
  errorstate: '글쓰기 · 문의 / 폼'
};

let scheduled = false;
let currentSiteId = '';
let stateCache = {};
let stateLoadedFor = '';
let stateLoadToken = 0;
let stateWriteQueue = Promise.resolve();

function setText(el, value){
  if(el && el.textContent !== value) el.textContent = value;
}

function schedule(){
  if(scheduled) return;
  scheduled = true;
  requestAnimationFrame(()=>{
    scheduled = false;
    simplify();
  });
}

function fieldByInput(id){ return $('#'+id)?.closest('.qa-report-field'); }

function replaceInputWithSelect(id, options, labelText){
  const old = $('#'+id);
  if(!old) return;
  const field = old.closest('.qa-report-field');
  const label = field?.querySelector(':scope > span');
  setText(label, labelText);
  if(old.tagName === 'SELECT') return;

  const current = String(old.value || '');
  const select = document.createElement('select');
  select.id = id;
  select.innerHTML = '<option value="">선택</option>' + options.map(v=>`<option value="${v}">${v}</option>`).join('');
  const match = options.find(v=>current.toLowerCase().includes(v.toLowerCase()));
  if(match) select.value = match;
  old.replaceWith(select);
}

function simplifyReport(){
  const panel = $('.qa-report-panel');
  if(!panel) return;
  if(!panel.classList.contains('is-simple')) panel.classList.add('is-simple');

  ['qaReportAccount','qaReportOrder'].forEach(id=>{
    const field = fieldByInput(id);
    if(field && !field.classList.contains('qa-simple-hidden')) field.classList.add('qa-simple-hidden');
    const input = $('#'+id);
    if(input && input.value) input.value = '';
  });

  replaceInputWithSelect('qaReportDesktop', ['Mac','Windows'], 'PC 테스트 환경');
  replaceInputWithSelect('qaReportMobile', ['iOS','Android'], '모바일 테스트 환경');

  const conclusion = $('#qaReportConclusion');
  if(conclusion){
    const field = conclusion.closest('.qa-report-field');
    if(field && !field.classList.contains('qa-report-field--full')) field.classList.add('qa-report-field--full');
    setText(field?.querySelector(':scope > span'), 'QA 보고서 내용 · 종합 메모');
    const placeholder = '자유롭게 적어주세요. 예) 회원가입 정상. 주문은 모바일에서 버튼 위치 수정 필요. 회원탈퇴 기능은 없음. 게시판 글쓰기는 WEB/MOBILE 모두 정상.';
    if(conclusion.placeholder !== placeholder) conclusion.placeholder = placeholder;
  }

  setText(panel.querySelector('.qa-report-panel-head p'), '환경만 간단히 선택하고, 아래 메모에 검수 결과를 보고서처럼 자유롭게 작성합니다.');
}

function stateValue(value){
  if(value === true) return 'ok';
  if(['ok','issue','none'].includes(String(value||''))) return String(value);
  return '';
}

function stateSelect(key, value){
  const state = stateValue(value);
  return `<select class="qa-state-select" data-qa-state="${key}" data-state="${state}">
    <option value="" ${!state?'selected':''}>미확인</option>
    <option value="ok" ${state==='ok'?'selected':''}>정상</option>
    <option value="issue" ${state==='issue'?'selected':''}>문제</option>
    <option value="none" ${state==='none'?'selected':''}>없음</option>
  </select>`;
}

function hasCachedState(key){
  return Object.prototype.hasOwnProperty.call(stateCache,key);
}

function transformCell(input, key){
  const cell = input?.closest('div');
  if(!cell || cell.querySelector('[data-qa-state]')) return;
  const stored = hasCachedState(key) ? stateCache[key] : (input.checked ? 'ok' : '');
  cell.innerHTML = stateSelect(key, stored);
}

function applyCachedStates(){
  document.querySelectorAll('[data-qa-state]').forEach(select=>{
    const key = select.dataset.qaState || '';
    if(!hasCachedState(key)) return;
    const value = stateValue(stateCache[key]);
    if(select.value !== value) select.value = value;
    if(select.dataset.state !== value) select.dataset.state = value;
  });
}

async function loadStates(siteId){
  if(!siteId) return;
  const token = ++stateLoadToken;
  const api = window.NineworksFirebase;
  if(!api){
    setTimeout(()=>{ if(siteId===currentSiteId) loadStates(siteId); },120);
    return;
  }
  try{
    const snap = await api.getDoc(api.doc(api.db,'qaSites',siteId));
    if(token!==stateLoadToken || siteId!==currentSiteId) return;
    stateCache = snap.exists() ? (snap.data()?.checklist || {}) : {};
    stateLoadedFor = siteId;
    schedule();
  }catch(error){
    console.error('QA 상태 불러오기 실패',error);
    if(token!==stateLoadToken || siteId!==currentSiteId) return;
    stateCache = {};
    stateLoadedFor = siteId;
    schedule();
  }
}

function simplifyChecklist(){
  const wrap = $('.qa-checklist-wrap');
  if(!wrap) return;
  if(!wrap.classList.contains('is-simple')) wrap.classList.add('is-simple');
  setText(wrap.querySelector('.qa-checklist-head h3'), '간단 QA 체크리스트');
  setText(wrap.querySelector('.qa-checklist-head small'), '각 항목을 정상 · 문제 · 없음 중 하나로 선택합니다.');

  if(currentSiteId && stateLoadedFor !== currentSiteId) return;

  const list = [...wrap.querySelectorAll('.qa-checklist')].find(el=>!el.classList.contains('qa-checklist--shop'));
  if(!list) return;

  const checks = [...list.querySelectorAll('input[data-qa-check$="_desktop"]')];
  checks.forEach(input=>{
    const full = input.dataset.qaCheck || '';
    const key = full.replace(/_desktop$/,'');
    const desktopCell = input.closest('div');
    const labelCell = desktopCell?.previousElementSibling;
    const mobileCell = desktopCell?.nextElementSibling;
    if(!KEEP[key]){
      [labelCell, desktopCell, mobileCell].forEach(el=>{
        if(el && !el.classList.contains('qa-simple-hidden')) el.classList.add('qa-simple-hidden');
      });
      return;
    }
    setText(labelCell, KEEP[key]);
    const mobileInput = mobileCell?.querySelector('input[data-qa-check]');
    transformCell(input, `${key}_desktop`);
    transformCell(mobileInput, `${key}_mobile`);
  });

  applyCachedStates();

  if(!wrap.querySelector('.qa-simple-note')){
    const note = document.createElement('p');
    note.className = 'qa-simple-note';
    note.textContent = '회원가입 · 주문 · 회원탈퇴 · 글쓰기처럼 사이트에 없는 기능은 “없음”으로 선택하세요. “문제”를 선택한 항목은 문제 등록 또는 위 보고서 스크린샷 기록에 남기면 됩니다.';
    list.insertAdjacentElement('afterend', note);
  }
}

function saveState(key, value, select){
  const siteId = currentSiteId || document.querySelector('[data-qa-site].is-selected')?.dataset.qaSite || '';
  const api = window.NineworksFirebase;
  if(!api?.auth?.currentUser || !siteId) return;

  const normalized = stateValue(value);
  stateCache[key] = normalized;
  stateLoadedFor = siteId;
  if(select.value !== normalized) select.value = normalized;
  if(select.dataset.state !== normalized) select.dataset.state = normalized;

  stateWriteQueue = stateWriteQueue.then(async()=>{
    try{
      const ref = api.doc(api.db,'qaSites',siteId);
      const snap = await api.getDoc(ref);
      const old = snap.exists() ? (snap.data()?.checklist || {}) : {};
      await api.setDoc(ref,{checklist:{...old,[key]:normalized},updatedAt:api.serverTimestamp()},{merge:true});
    }catch(error){
      console.error('QA 상태 저장 실패',error);
      const toast = $('#toast');
      if(toast){
        toast.textContent='QA 체크 상태를 저장하지 못했습니다.';
        toast.classList.add('is-visible');
        setTimeout(()=>toast.classList.remove('is-visible'),2500);
      }
    }
  });
}

function setCurrentSite(siteId){
  currentSiteId = siteId || '';
  stateCache = {};
  stateLoadedFor = '';
  if(currentSiteId) loadStates(currentSiteId);
  window.dispatchEvent(new CustomEvent('nineworks:qa-site-change',{detail:{siteId:currentSiteId}}));
}

function simplify(){
  if(!$('#qaPage') || !$('#qaSiteDetail')) return;
  simplifyReport();
  simplifyChecklist();
}

document.addEventListener('click', e=>{
  const site = e.target.closest('[data-qa-site]');
  if(site){
    const siteId = site.dataset.qaSite || '';
    document.querySelectorAll('[data-qa-site]').forEach(card=>{
      const selected = card===site;
      if(card.classList.contains('is-selected') !== selected) card.classList.toggle('is-selected', selected);
    });
    if(siteId !== currentSiteId) setCurrentSite(siteId);
    setTimeout(schedule, 0);
    setTimeout(schedule, 60);
    return;
  }
  if(e.target.closest('#openQaManagement,#qaBackCalendar,#qaEditSite')) setTimeout(schedule, 30);
}, true);

document.addEventListener('change', e=>{
  const state = e.target.closest('[data-qa-state]');
  if(state){
    e.stopImmediatePropagation();
    saveState(state.dataset.qaState,state.value,state);
    return;
  }
  if(e.target.closest('#qaReportResult')) setTimeout(schedule, 20);
}, true);

function mutationContainsDetailStructure(mutation){
  for(const node of mutation.addedNodes){
    if(!(node instanceof Element)) continue;
    if(node.matches('.qa-report-panel,.qa-checklist-wrap')) return true;
    if(node.querySelector?.('.qa-report-panel,.qa-checklist-wrap')) return true;
  }
  return false;
}

function init(){
  schedule();
  const root = $('#qaPage');
  if(root){
    const observer = new MutationObserver(mutations=>{
      if(mutations.some(mutationContainsDetailStructure)) schedule();
    });
    observer.observe(root,{childList:true,subtree:true});
  }
}

window.NineworksQAState = {
  getSiteId:()=>currentSiteId,
  getChecklist:()=>({...stateCache}),
  refresh:()=>currentSiteId&&loadStates(currentSiteId)
};

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
