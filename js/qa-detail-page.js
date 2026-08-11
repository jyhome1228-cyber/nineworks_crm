const $=(s,r=document)=>r.querySelector(s);

const style=document.createElement('style');
style.textContent=`
  /* QA 목록과 사이트별 작업 화면을 완전히 분리 */
  #qaPage:not(.qa-detail-page-mode) #qaSiteDetail{display:none!important}
  #qaPage.qa-detail-page-mode>.qa-heading,
  #qaPage.qa-detail-page-mode>.qa-summary,
  #qaPage.qa-detail-page-mode>.qa-guide,
  #qaPage.qa-detail-page-mode>.qa-panel:not(#qaSiteDetail){display:none!important}
  #qaPage.qa-detail-page-mode #qaSiteDetail{display:block!important;margin-top:0}

  .qa-detail-workbar{position:sticky;top:0;z-index:45;display:flex;align-items:center;justify-content:space-between;gap:20px;margin:-1px -1px 18px;padding:14px 16px;border:1px solid #303139;border-radius:11px;background:rgba(28,29,33,.96);box-shadow:0 10px 30px rgba(0,0,0,.18);backdrop-filter:blur(14px)}
  .qa-detail-workbar-left{display:flex;align-items:center;gap:13px;min-width:0}
  .qa-detail-workbar-mark{display:grid;place-items:center;width:34px;height:34px;flex:0 0 auto;border:1px solid rgba(83,112,255,.34);border-radius:9px;background:rgba(67,104,245,.08);color:#9fafff;font-size:10px;font-weight:800;letter-spacing:.04em}
  .qa-detail-workbar-copy{min-width:0}
  .qa-detail-workbar-copy small{display:block;margin-bottom:3px;color:#797d89;font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
  .qa-detail-workbar-copy strong{display:block;max-width:52vw;overflow:hidden;color:#f3f3f5;font-size:13px;font-weight:780;white-space:nowrap;text-overflow:ellipsis}
  .qa-detail-workbar-copy span{display:block;max-width:52vw;margin-top:3px;overflow:hidden;color:#777b86;font-size:9px;white-space:nowrap;text-overflow:ellipsis}
  .qa-detail-workbar-actions{display:flex;align-items:center;gap:8px;flex:0 0 auto}
  .qa-detail-workbar .button{height:38px;padding:0 15px}
  .qa-detail-save.is-dirty::before{content:'•';margin-right:6px;color:#fff;font-size:14px;line-height:1}
  .qa-detail-exit{border-color:#41424a!important;background:#25262b!important;color:#d8d9dd!important}

  #qaPage.qa-detail-page-mode #qaSiteDetail>.qa-detail-head{margin-top:2px}
  #qaPage.qa-detail-page-mode{padding-top:0}

  @media(max-width:760px){
    .qa-detail-workbar{top:0;align-items:flex-start;gap:10px;padding:12px}
    .qa-detail-workbar-mark{display:none}
    .qa-detail-workbar-copy strong,.qa-detail-workbar-copy span{max-width:44vw}
    .qa-detail-workbar-actions{gap:6px}
    .qa-detail-workbar .button{height:36px;padding:0 11px;font-size:10px}
  }
  @media(max-width:520px){
    .qa-detail-workbar{flex-direction:column;align-items:stretch}
    .qa-detail-workbar-copy strong,.qa-detail-workbar-copy span{max-width:100%}
    .qa-detail-workbar-actions{width:100%}
    .qa-detail-workbar-actions .button{flex:1}
  }
`;
document.head.appendChild(style);

let reportDirty=false;
let activeSiteId='';
let listScrollY=0;

function toast(message){
  const el=$('#toast');
  if(!el)return;
  el.textContent=message;
  el.classList.add('is-visible');
  clearTimeout(window.__qaDetailToastTimer);
  window.__qaDetailToastTimer=setTimeout(()=>el.classList.remove('is-visible'),2400);
}

function currentSiteCard(){
  if(activeSiteId)return document.querySelector(`[data-qa-site="${CSS.escape(activeSiteId)}"]`);
  return document.querySelector('[data-qa-site].is-selected');
}

function currentInfo(){
  const detail=$('#qaSiteDetail');
  const title=detail?.querySelector('.qa-detail-title h2')?.textContent?.trim()||currentSiteCard()?.querySelector('strong')?.textContent?.trim()||'QA 사이트';
  const url=detail?.querySelector('.qa-detail-title>p:not(.eyebrow)')?.textContent?.split(' · ')?.[0]?.trim()||currentSiteCard()?.querySelector('.qa-site-url')?.textContent?.trim()||'';
  return {title,url};
}

function ensureWorkbar(){
  const page=$('#qaPage');
  const detail=$('#qaSiteDetail');
  if(!page||!detail||!page.classList.contains('qa-detail-page-mode'))return;
  let bar=detail.querySelector(':scope>.qa-detail-workbar');
  const info=currentInfo();
  if(!bar){
    bar=document.createElement('div');
    bar.className='qa-detail-workbar';
    bar.innerHTML=`
      <div class="qa-detail-workbar-left">
        <span class="qa-detail-workbar-mark">QA</span>
        <div class="qa-detail-workbar-copy"><small>사이트별 QA 관리</small><strong data-qa-workbar-title></strong><span data-qa-workbar-url></span></div>
      </div>
      <div class="qa-detail-workbar-actions">
        <button class="button button--primary qa-detail-save" id="qaDetailSave" type="button">저장하기</button>
        <button class="button button--ghost qa-detail-exit" id="qaDetailExit" type="button">나가기</button>
      </div>`;
    detail.prepend(bar);
  }
  const title=bar.querySelector('[data-qa-workbar-title]');
  const url=bar.querySelector('[data-qa-workbar-url]');
  if(title)title.textContent=info.title;
  if(url)url.textContent=info.url;
  updateSaveState();
}

function updateSaveState(){
  const btn=$('#qaDetailSave');
  if(!btn)return;
  btn.classList.toggle('is-dirty',reportDirty);
  btn.textContent=reportDirty?'저장하기':'저장됨';
  if(!reportDirty)btn.dataset.clean='true';
  else delete btn.dataset.clean;
}

function enterDetail(card){
  const page=$('#qaPage');
  if(!page||!card)return;
  listScrollY=window.scrollY;
  activeSiteId=card.dataset.qaSite||'';
  reportDirty=false;
  page.classList.add('qa-detail-page-mode');
  document.body.classList.add('qa-site-workspace-open');
  requestAnimationFrame(()=>{
    ensureWorkbar();
    window.scrollTo({top:Math.max(0,page.getBoundingClientRect().top+window.scrollY-8),behavior:'auto'});
  });
}

function exitDetail(force=false){
  const page=$('#qaPage');
  if(!page)return;
  if(reportDirty&&!force){
    const leave=window.confirm('저장하지 않은 QA 보고서 내용이 있습니다. 저장하지 않고 나가시겠습니까?');
    if(!leave)return;
  }
  page.classList.remove('qa-detail-page-mode');
  document.body.classList.remove('qa-site-workspace-open');
  reportDirty=false;
  updateSaveState();
  requestAnimationFrame(()=>window.scrollTo({top:listScrollY,behavior:'auto'}));
}

function saveTop(){
  const original=$('#qaSaveReport');
  if(!original){
    toast('저장할 QA 보고서가 없습니다.');
    return;
  }
  const top=$('#qaDetailSave');
  if(top){top.disabled=true;top.textContent='저장 중...'}
  original.click();
  reportDirty=false;
  setTimeout(()=>{
    if(top)top.disabled=false;
    updateSaveState();
  },450);
}

function markDirty(target){
  if(!target?.closest?.('#qaSiteDetail'))return;
  if(!target.matches('#qaReportDate,#qaReportDesktop,#qaReportMobile,#qaReportResult,#qaReportConclusion,#qaReportAccount,#qaReportOrder'))return;
  reportDirty=true;
  updateSaveState();
}

function bind(){
  document.addEventListener('click',event=>{
    if(event.target.closest('[data-qa-open-site]'))return;

    const card=event.target.closest('[data-qa-site]');
    if(card){
      setTimeout(()=>enterDetail(card),0);
      return;
    }

    if(event.target.closest('#qaDetailSave')){
      event.preventDefault();
      saveTop();
      return;
    }

    if(event.target.closest('#qaDetailExit')){
      event.preventDefault();
      exitDetail();
      return;
    }

    if(event.target.closest('#qaSaveReport')){
      reportDirty=false;
      setTimeout(updateSaveState,80);
    }
  },true);

  document.addEventListener('input',event=>markDirty(event.target),true);
  document.addEventListener('change',event=>markDirty(event.target),true);

  window.addEventListener('beforeunload',event=>{
    if(!reportDirty||!$('#qaPage')?.classList.contains('qa-detail-page-mode'))return;
    event.preventDefault();
    event.returnValue='';
  });

  window.addEventListener('nineworks:qa-site-change',event=>{
    const siteId=event.detail?.siteId||'';
    if(!siteId)return;
    activeSiteId=siteId;
    setTimeout(ensureWorkbar,0);
  });
}

function init(){
  bind();
  const wait=()=>{
    const page=$('#qaPage');
    if(!page)return setTimeout(wait,80);
    const observer=new MutationObserver(()=>{
      if(page.classList.contains('qa-detail-page-mode'))ensureWorkbar();
    });
    observer.observe(page,{childList:true,subtree:true});
  };
  wait();
}

window.NineworksQADetailPage={
  enter:(siteId)=>{
    const card=document.querySelector(`[data-qa-site="${CSS.escape(siteId||'')}"]`);
    if(card){card.click()}
  },
  exit:()=>exitDetail(),
  save:()=>saveTop()
};

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
