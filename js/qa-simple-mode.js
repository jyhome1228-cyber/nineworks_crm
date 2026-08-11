const simpleQaStyle = document.createElement('style');
simpleQaStyle.textContent = `
  .qa-simple-hidden{display:none!important}
  .qa-simple-note{margin:10px 0 0;padding:11px 13px;border:1px solid rgba(85,119,255,.18);border-radius:9px;background:rgba(67,104,245,.045);color:#8f93a3;font-size:11px;line-height:1.55}
  .qa-report-panel.is-simple .qa-report-grid{grid-template-columns:repeat(4,minmax(0,1fr))}
  .qa-report-panel.is-simple .qa-report-field--full{grid-column:1/-1}
  .qa-report-panel.is-simple #qaReportConclusion{min-height:170px;font-size:13px;line-height:1.65}
  .qa-report-panel.is-simple .qa-report-field select{width:100%;height:44px;border:1px solid var(--line);border-radius:8px;padding:0 12px;background:#252529;color:#f2f2f4;outline:0}
  .qa-checklist-wrap.is-simple .qa-checklist{margin-top:10px}
  .qa-checklist-wrap.is-simple .qa-checklist>div{min-height:45px}
  .qa-checklist-wrap.is-simple .qa-check-section-title.is-shop,
  .qa-checklist-wrap.is-simple .qa-checklist--shop{display:none!important}
  @media(max-width:1000px){.qa-report-panel.is-simple .qa-report-grid{grid-template-columns:1fr 1fr}}
  @media(max-width:620px){.qa-report-panel.is-simple .qa-report-grid{grid-template-columns:1fr}}
`;
document.head.appendChild(simpleQaStyle);

const $ = (s, r=document) => r.querySelector(s);

const KEEP = {
  navigation: '메뉴 · 버튼 · 링크',
  responsive: '화면 · 반응형 · 잘림',
  content: '글자 · 정보 · 가격',
  images: '이미지 · 배너 · 화질',
  forms: '가입 · 로그인 · 입력폼',
  interaction: '구매 · 예약 · 주요 기능',
  errorstate: '오류 · 완료화면 · 예외상황'
};

let scheduled = false;
function schedule(){
  if(scheduled) return;
  scheduled = true;
  requestAnimationFrame(()=>{scheduled=false; simplify();});
}

function fieldByInput(id){ return $('#'+id)?.closest('.qa-report-field'); }

function replaceInputWithSelect(id, options, labelText){
  const old = $('#'+id);
  if(!old || old.tagName === 'SELECT') return;
  const field = old.closest('.qa-report-field');
  const label = field?.querySelector(':scope > span');
  if(label) label.textContent = labelText;
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
  panel.classList.add('is-simple');

  ['qaReportAccount','qaReportOrder'].forEach(id=>{
    const field = fieldByInput(id);
    if(field){ field.classList.add('qa-simple-hidden'); const input=$('#'+id); if(input) input.value=''; }
  });

  replaceInputWithSelect('qaReportDesktop', ['Mac','Windows'], 'PC 테스트 환경');
  replaceInputWithSelect('qaReportMobile', ['iOS','Android'], '모바일 테스트 환경');

  const conclusion = $('#qaReportConclusion');
  if(conclusion){
    const field = conclusion.closest('.qa-report-field');
    field?.classList.add('qa-report-field--full');
    const label = field?.querySelector(':scope > span');
    if(label) label.textContent = 'QA 보고서 내용 · 종합 메모';
    conclusion.placeholder = '자유롭게 적어주세요. 예) 모바일 구매 흐름 정상. 회원가입 완료화면 여백 수정 필요. 상품 상세 수량 버튼은 iOS에서 재검수 필요.';
  }

  const head = panel.querySelector('.qa-report-panel-head p');
  if(head) head.textContent = '테스트 환경을 간단히 선택하고, 아래 메모에 검수 결과를 보고서처럼 자유롭게 작성합니다.';
}

function simplifyChecklist(){
  const wrap = $('.qa-checklist-wrap');
  if(!wrap) return;
  wrap.classList.add('is-simple');
  const heading = wrap.querySelector('.qa-checklist-head h3');
  const small = wrap.querySelector('.qa-checklist-head small');
  if(heading) heading.textContent = '간단 QA 체크리스트';
  if(small) small.textContent = '7가지만 WEB · MOBILE 각각 확인하면 됩니다.';

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
      [labelCell, desktopCell, mobileCell].forEach(el=>el?.classList.add('qa-simple-hidden'));
      return;
    }
    if(labelCell) labelCell.textContent = KEEP[key];
  });

  if(!wrap.querySelector('.qa-simple-note')){
    const note = document.createElement('p');
    note.className = 'qa-simple-note';
    note.textContent = '쇼핑몰은 회원가입 → 로그인 → 상품 선택 → 장바구니 → 주문서 → 무통장 테스트 주문 → 주문완료/마이페이지 흐름을 실제로 한 번 끝까지 진행하고, 발견한 내용은 위 QA 보고서 메모와 문제 등록에 남기면 됩니다.';
    list.insertAdjacentElement('afterend', note);
  }
}

function simplify(){
  if(!$('#qaPage') || !$('#qaSiteDetail')) return;
  simplifyReport();
  simplifyChecklist();
}

document.addEventListener('click', e=>{
  if(e.target.closest('[data-qa-site],#openQaManagement,#qaBackCalendar,#qaEditSite')) setTimeout(schedule, 30);
}, true);

document.addEventListener('change', e=>{
  if(e.target.closest('[data-qa-check],#qaReportResult')) setTimeout(schedule, 20);
}, true);

function init(){
  schedule();
  const root = $('#qaPage');
  if(root){
    const observer = new MutationObserver(()=>schedule());
    observer.observe(root,{childList:true,subtree:true});
  }
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
