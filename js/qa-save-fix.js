import "./qa-detail-ux-polish.js?v=20260820-1";

const $=(s,r=document)=>r.querySelector(s);
const uid=(p='qa')=>`${p}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
const nowText=()=>new Date().toISOString();

function toast(message){
  const el=$('#toast');
  if(!el)return;
  el.textContent=message;
  el.classList.add('is-visible');
  clearTimeout(window.__qaSaveToastTimer);
  window.__qaSaveToastTimer=setTimeout(()=>el.classList.remove('is-visible'),3600);
}

function normalizeUrl(value){
  let text=String(value||'').trim();
  if(!text)throw new Error('invalid-url');
  if(!/^[a-z][a-z0-9+.-]*:\/\//i.test(text))text=`https://${text}`;
  const parsed=new URL(text);
  if(!['http:','https:'].includes(parsed.protocol))throw new Error('invalid-url');
  return parsed.href;
}

function firebaseErrorMessage(error){
  const code=String(error?.code||error?.name||'');
  if(code.includes('permission-denied'))return 'QA 저장 권한이 없습니다. Firestore Rules 게시 상태를 다시 확인해주세요. (permission-denied)';
  if(code.includes('unauthenticated'))return '로그인 세션이 만료되었습니다. 다시 로그인한 뒤 저장해주세요. (unauthenticated)';
  if(code.includes('unavailable')||code.includes('network'))return '네트워크 연결 문제로 저장하지 못했습니다. 잠시 후 다시 시도해주세요. (unavailable)';
  if(code.includes('invalid-argument'))return '저장 데이터 형식에 문제가 있습니다. 입력값을 확인해주세요. (invalid-argument)';
  return `QA 사이트 저장 실패 · ${code||'unknown-error'}`;
}

function closeQaModal(){
  const modal=$('#qaSiteModal');
  const back=$('#qaModalBackdrop');
  if(modal)modal.hidden=true;
  if(back)back.hidden=true;
  document.body.style.overflow='';
}

async function robustSaveSite(event){
  event.preventDefault();
  event.stopImmediatePropagation();

  const form=event.currentTarget;
  const submit=form?.querySelector('button[type="submit"]');
  const originalText=submit?.textContent||'저장';
  if(submit){submit.disabled=true;submit.textContent='저장 중...'}

  try{
    const api=window.NineworksFirebase;
    if(!api){
      toast('Firebase 연결을 준비 중입니다. 잠시 후 다시 저장해주세요.');
      return;
    }
    await api.authPersistenceReady?.catch?.(()=>{});
    const user=api.auth?.currentUser;
    if(!user){
      toast('로그인 세션을 확인할 수 없습니다. 다시 로그인한 뒤 저장해주세요.');
      return;
    }

    let normalized;
    try{
      normalized=normalizeUrl($('#qaSiteUrl')?.value);
      if($('#qaSiteUrl'))$('#qaSiteUrl').value=normalized;
    }catch{
      toast('URL 형식을 확인해주세요. 예: www.example.com');
      $('#qaSiteUrl')?.focus();
      return;
    }

    const id=$('#qaSiteId')?.value||uid('qasite');
    let old={};
    try{
      const snapshot=await api.getDoc(api.doc(api.db,'qaSites',id));
      if(snapshot.exists())old=snapshot.data()||{};
    }catch(error){
      console.warn('QA 기존 데이터 확인 실패',error);
    }

    const name=$('#qaSiteName')?.value.trim()||'';
    if(!name){
      toast('사이트명을 입력해주세요.');
      $('#qaSiteName')?.focus();
      return;
    }

    const item={
      ...old,
      id,
      name,
      client:$('#qaSiteClient')?.value||'',
      siteType:$('#qaSiteType')?.value||'general',
      url:normalized,
      status:$('#qaSiteStatus')?.value||'testing',
      tester:$('#qaSiteTester')?.value||'',
      note:$('#qaSiteNote')?.value.trim()||'',
      checklist:old.checklist||{},
      report:old.report||{},
      updatedAt:api.serverTimestamp(),
      updatedBy:user.uid
    };
    if(!old.createdAtText)item.createdAtText=nowText();

    await api.setDoc(api.doc(api.db,'qaSites',id),item,{merge:true});
    if($('#qaSiteId'))$('#qaSiteId').value=id;
    closeQaModal();
    toast('QA 사이트를 저장했습니다.');
  }catch(error){
    console.error('QA 사이트 저장 실패',error);
    toast(firebaseErrorMessage(error));
  }finally{
    if(submit){submit.disabled=false;submit.textContent=originalText}
  }
}

function bind(){
  const form=$('#qaSiteForm');
  if(!form||form.dataset.qaRobustSave==='true')return false;
  form.dataset.qaRobustSave='true';
  form.addEventListener('submit',robustSaveSite,true);
  return true;
}

function init(){
  if(bind())return;
  let attempts=0;
  const timer=setInterval(()=>{
    attempts+=1;
    if(bind()||attempts>80)clearInterval(timer);
  },100);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
