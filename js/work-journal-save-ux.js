const style=document.createElement('style');
style.textContent=`
.worklog-save-popup{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:20px;background:rgba(8,8,10,.36);backdrop-filter:blur(2px);opacity:0;pointer-events:none;transition:opacity .16s ease}
.worklog-save-popup.is-visible{opacity:1;pointer-events:auto}
.worklog-save-popup__card{display:grid;min-width:min(320px,calc(100vw - 40px));gap:8px;padding:22px 24px;border:1px solid rgba(255,255,255,.11);border-radius:14px;background:#202025;box-shadow:0 22px 70px rgba(0,0,0,.42);text-align:center;transform:translateY(6px) scale(.985);transition:transform .18s ease}
.worklog-save-popup.is-visible .worklog-save-popup__card{transform:translateY(0) scale(1)}
.worklog-save-popup__icon{display:grid;width:34px;height:34px;place-items:center;margin:0 auto 3px;border-radius:50%;background:rgba(67,104,245,.14);color:#b9c5ff;font-size:17px;font-weight:800}
.worklog-save-popup__card strong{color:#f5f5f7;font-size:15px;font-weight:720;letter-spacing:-.02em}
.worklog-save-popup__card span{color:#8b8b94;font-size:11.5px;line-height:1.5}
`;
document.head.appendChild(style);

let popupTimer=null;
let lastHandled='';

function showSavePopup(){
  let popup=document.querySelector('#worklogSavePopup');
  if(!popup){
    popup=document.createElement('div');
    popup.id='worklogSavePopup';
    popup.className='worklog-save-popup';
    popup.setAttribute('role','status');
    popup.setAttribute('aria-live','polite');
    popup.innerHTML=`<div class="worklog-save-popup__card"><div class="worklog-save-popup__icon">✓</div><strong>업무일지가 저장되었습니다.</strong><span>작성 내용은 왼쪽 기록 목록에서 확인할 수 있습니다.</span></div>`;
    document.body.appendChild(popup);
  }
  clearTimeout(popupTimer);
  requestAnimationFrame(()=>popup.classList.add('is-visible'));
  popupTimer=setTimeout(()=>popup.classList.remove('is-visible'),1500);
}

function moveBackToList(){
  const editor=document.querySelector('#worklogEditor');
  if(editor){
    editor.innerHTML='<div class="worklog-editor-empty">저장되었습니다.<br>왼쪽 업무일지 목록에서 기록을 선택해 확인하세요.</div>';
  }
  setTimeout(()=>{
    const active=document.querySelector('#worklogList .worklog-card.is-active');
    active?.scrollIntoView({block:'nearest',behavior:'smooth'});
  },120);
}

function handleToast(){
  const toast=document.querySelector('#toast');
  if(!toast)return;
  const message=(toast.textContent||'').trim();
  if(message!=='업무일지를 저장했습니다.')return;
  const key=`${message}:${Date.now()>>9}`;
  if(key===lastHandled)return;
  lastHandled=key;
  moveBackToList();
  showSavePopup();
}

function init(){
  const toast=document.querySelector('#toast');
  if(!toast)return setTimeout(init,100);
  const observer=new MutationObserver(handleToast);
  observer.observe(toast,{childList:true,characterData:true,subtree:true});
  handleToast();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
