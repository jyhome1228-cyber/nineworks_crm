const style=document.createElement('style');
style.textContent=`
@media(min-width:1121px){
  .qa-detail-body{grid-template-columns:minmax(0,.72fr) minmax(460px,1.28fr)!important;gap:16px!important}
}
.qa-detail-body>.qa-detail-panel:first-child .qa-detail-panel__head{padding:15px 18px!important}
.qa-detail-body>.qa-detail-panel:first-child .qa-detail-panel__head h3{font-size:15px!important}
.qa-detail-body>.qa-detail-panel:first-child .qa-detail-panel__head p{font-size:10.5px!important}
.qa-detail-check-row{min-height:50px!important;grid-template-columns:minmax(0,1fr) 118px 118px!important}
.qa-detail-check-row>div{padding:9px 12px!important}
.qa-detail-check-label strong{font-size:12px!important}
.qa-detail-check-label span{font-size:9.5px!important}
.qa-detail-check-title{font-size:9px!important}
.qa-detail-select{height:34px!important;font-size:10.5px!important;padding:0 7px!important}
.qa-detail-side .qa-detail-panel__head{padding:22px 24px!important}
.qa-detail-side .qa-detail-panel__head h3{font-size:22px!important;letter-spacing:-.035em!important}
.qa-detail-side .qa-detail-panel__head p{margin-top:7px!important;font-size:13px!important;line-height:1.6!important}
.qa-detail-form{gap:18px!important;padding:24px!important}
.qa-detail-field{gap:9px!important}
.qa-detail-field>span{font-size:13px!important}
.qa-detail-field select{height:50px!important;padding:0 14px!important;font-size:14px!important}
.qa-detail-field textarea{min-height:360px!important;padding:17px 18px!important;font-size:14px!important;line-height:1.72!important}
.qa-detail-save-row{margin-top:2px!important}
.qa-detail-updated{font-size:11.5px!important}
.qa-detail-save{min-height:46px!important;padding:0 20px!important;font-size:13px!important;border-radius:9px!important}
.qa-action-popup{position:fixed;inset:0;z-index:12000;display:grid;place-items:center;padding:24px;background:rgba(7,7,9,.28);backdrop-filter:blur(2px);opacity:0;pointer-events:none;transition:opacity .16s ease}
.qa-action-popup.is-visible{opacity:1}
.qa-action-popup__card{display:grid;min-width:min(350px,calc(100vw - 40px));max-width:430px;gap:8px;padding:24px 26px;border:1px solid rgba(255,255,255,.12);border-radius:15px;background:#202025;box-shadow:0 24px 80px rgba(0,0,0,.45);text-align:center;transform:translateY(6px) scale(.985);transition:transform .18s ease}
.qa-action-popup.is-visible .qa-action-popup__card{transform:translateY(0) scale(1)}
.qa-action-popup__icon{display:grid;width:38px;height:38px;place-items:center;margin:0 auto 3px;border-radius:50%;background:rgba(67,104,245,.14);color:#bdc8ff;font-size:18px;font-weight:800}
.qa-action-popup__title{color:#f5f5f7;font-size:16px;font-weight:750;letter-spacing:-.025em}
.qa-action-popup__message{color:#93939c;font-size:12px;line-height:1.55}
@media(max-width:760px){
  .qa-detail-check-row{grid-template-columns:minmax(145px,1fr) 100px 100px!important}
  .qa-detail-field textarea{min-height:270px!important}
}
`;
document.head.appendChild(style);

let popupTimer=null;
let lastToastText='';

function ensurePopup(){
  let root=document.querySelector('#qaActionPopup');
  if(root)return root;
  root=document.createElement('div');
  root.id='qaActionPopup';
  root.className='qa-action-popup';
  root.setAttribute('role','status');
  root.setAttribute('aria-live','polite');
  root.innerHTML='<div class="qa-action-popup__card"><div class="qa-action-popup__icon">✓</div><strong class="qa-action-popup__title">처리되었습니다.</strong><span class="qa-action-popup__message"></span></div>';
  document.body.appendChild(root);
  return root;
}

function showPopup(message,title='완료',icon='✓',duration=1450){
  const root=ensurePopup();
  root.querySelector('.qa-action-popup__icon').textContent=icon;
  root.querySelector('.qa-action-popup__title').textContent=title;
  root.querySelector('.qa-action-popup__message').textContent=message;
  clearTimeout(popupTimer);
  requestAnimationFrame(()=>root.classList.add('is-visible'));
  popupTimer=setTimeout(()=>root.classList.remove('is-visible'),duration);
}

function buttonMessage(target){
  if(target.matches('[data-qa-back]'))return ['사이트 목록으로 이동했습니다.','이동','←'];
  if(target.matches('.qa-detail-link'))return ['운영 사이트를 새 탭으로 열었습니다.','사이트 열기','↗'];
  if(target.matches('#qaCompactAdd,#qaAddSite,#qaAddSiteInline'))return ['새 QA 사이트 등록 창을 열었습니다.','사이트 추가','+'];
  if(target.matches('#qaBackCalendar'))return ['캘린더 화면으로 이동합니다.','이동','←'];
  if(target.matches('[data-qa-detail-save]'))return ['QA 기록을 저장하고 있습니다.','저장 중','…'];
  if(target.matches('[data-qa-close],.qa-modal-close,#closeQaModal'))return ['창을 닫았습니다.','닫기','×'];
  const text=(target.textContent||'').trim();
  if(!text)return null;
  if(text.includes('삭제'))return ['삭제 작업을 진행합니다.','삭제','−'];
  if(text.includes('수정'))return ['수정 화면을 열었습니다.','수정','✎'];
  if(text.includes('저장'))return ['입력한 내용을 저장하고 있습니다.','저장 중','…'];
  if(text.includes('취소'))return ['작업을 취소했습니다.','취소','×'];
  return [`${text} 작업을 실행했습니다.`,'처리','✓'];
}

document.addEventListener('click',event=>{
  const qaPage=event.target.closest('#qaPage');
  if(!qaPage)return;
  const target=event.target.closest('button,a.qa-detail-link');
  if(!target)return;
  const info=buttonMessage(target);
  if(info)showPopup(info[0],info[1],info[2]);
},true);

document.addEventListener('change',event=>{
  const select=event.target.closest('#qaCompactDetail [data-qa-check-key]');
  if(select){
    const label=select.value==='ok'?'정상':select.value==='issue'?'문제':select.value==='none'?'해당 없음':'미확인';
    showPopup(`QA 체크 상태를 “${label}”으로 변경했습니다. QA 기록 저장을 누르면 반영됩니다.`,'체크 변경','✓',1250);
    return;
  }
  if(event.target.closest('#qaDetailStatus'))showPopup('QA 진행 상태를 변경했습니다. QA 기록 저장을 누르면 반영됩니다.','상태 변경','✓',1250);
},true);

function observeToast(){
  const toast=document.querySelector('#toast');
  if(!toast)return setTimeout(observeToast,100);
  const sync=()=>{
    const text=(toast.textContent||'').trim();
    if(!text||text===lastToastText)return;
    lastToastText=text;
    const failed=/못|실패|권한|확인해주세요|만료|문제/.test(text);
    if(/QA|사이트/.test(text))showPopup(text,failed?'확인 필요':'완료',failed?'!':'✓',failed?2200:1550);
  };
  new MutationObserver(sync).observe(toast,{childList:true,characterData:true,subtree:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observeToast,{once:true});
else observeToast();
