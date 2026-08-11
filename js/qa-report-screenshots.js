const $=(s,r=document)=>r.querySelector(s);
const esc=(v='')=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const uid=()=>`qarshot_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
const nowText=()=>new Date().toISOString();

const style=document.createElement('style');
style.textContent=`
  .qa-report-shots{margin:16px 0 0;border-top:1px solid var(--line);padding:18px 0 2px}
  .qa-report-shots-head{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:10px}
  .qa-report-shots-title strong{display:block;color:#f2f2f4;font-size:12px;font-weight:750}
  .qa-report-shots-title small{display:block;margin-top:5px;color:#7f828d;font-size:10px;line-height:1.5}
  .qa-report-shot-add{height:36px;flex:0 0 auto}
  .qa-report-shot-drop{display:flex;align-items:center;justify-content:center;min-height:72px;border:1px dashed #3a3c46;border-radius:9px;background:#202126;color:#858893;font-size:11px;text-align:center;cursor:pointer;transition:border-color .18s ease,background .18s ease,color .18s ease}
  .qa-report-shot-drop:hover,.qa-report-shot-drop.is-drag{border-color:rgba(86,117,255,.72);background:rgba(67,104,245,.07);color:#aeb9ef}
  .qa-report-shot-drop.is-uploading{pointer-events:none;opacity:.65}
  .qa-report-shot-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:9px;margin-top:10px}
  .qa-report-shot-card{position:relative;min-width:0;border:1px solid #32333a;border-radius:9px;background:#202126;overflow:hidden}
  .qa-report-shot-thumb{display:block;width:100%;padding:0;border:0;background:#1b1c20;cursor:zoom-in}
  .qa-report-shot-thumb img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover}
  .qa-report-shot-meta{display:block;padding:8px 9px 9px;color:#858893;font-size:9px;line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:left}
  .qa-report-shot-delete{position:absolute;right:6px;top:6px;width:24px;height:24px;border:1px solid rgba(255,255,255,.14);border-radius:6px;background:rgba(18,18,21,.82);color:#d2d3d8;font-size:14px;line-height:1;cursor:pointer;backdrop-filter:blur(5px)}
  .qa-report-shot-empty{margin:10px 0 0;color:#70737d;font-size:10px}
  .qa-report-shot-viewer{position:fixed;inset:0;z-index:10050;display:grid;place-items:center;padding:34px;background:rgba(8,8,10,.88);backdrop-filter:blur(7px)}
  .qa-report-shot-viewer[hidden]{display:none}
  .qa-report-shot-viewer-inner{position:relative;max-width:min(1200px,94vw);max-height:92vh}
  .qa-report-shot-viewer img{display:block;max-width:100%;max-height:84vh;object-fit:contain;border-radius:7px;background:#111}
  .qa-report-shot-viewer-caption{margin-top:10px;color:#b8bac1;font-size:11px;text-align:center}
  .qa-report-shot-viewer-close{position:fixed;right:24px;top:20px;width:40px;height:40px;border:1px solid rgba(255,255,255,.18);border-radius:9px;background:rgba(24,24,28,.82);color:#fff;font-size:23px;cursor:pointer}
  @media(max-width:620px){.qa-report-shots-head{align-items:flex-start}.qa-report-shot-gallery{grid-template-columns:repeat(2,minmax(0,1fr))}.qa-report-shot-viewer{padding:18px}.qa-report-shot-viewer-close{right:12px;top:12px}}
`;
document.head.appendChild(style);

let api=null;
let currentSiteId='';
let shots=[];
let unsubscribe=null;
let uploadBusy=false;

function toast(message){
  const el=$('#toast');
  if(!el)return;
  el.textContent=message;
  el.classList.add('is-visible');
  clearTimeout(window.__qaReportShotToastTimer);
  window.__qaReportShotToastTimer=setTimeout(()=>el.classList.remove('is-visible'),2800);
}

function ensureViewer(){
  if($('#qaReportShotViewer'))return;
  const viewer=document.createElement('div');
  viewer.id='qaReportShotViewer';
  viewer.className='qa-report-shot-viewer';
  viewer.hidden=true;
  viewer.innerHTML=`<button class="qa-report-shot-viewer-close" type="button" data-qa-report-shot-close aria-label="닫기">×</button><div class="qa-report-shot-viewer-inner"><img id="qaReportShotViewerImage" alt="QA report screenshot"><div id="qaReportShotViewerCaption" class="qa-report-shot-viewer-caption"></div></div>`;
  document.body.appendChild(viewer);
}

function ensurePanel(){
  const panel=$('.qa-report-panel');
  if(!panel||panel.querySelector('.qa-report-shots'))return;
  const section=document.createElement('section');
  section.className='qa-report-shots';
  section.innerHTML=`
    <div class="qa-report-shots-head">
      <div class="qa-report-shots-title"><strong>스크린샷 기록</strong><small>검수 화면을 여러 장 자유롭게 올려 저장할 수 있습니다. 이미지를 누르면 크게 볼 수 있습니다.</small></div>
      <button class="button button--ghost qa-report-shot-add" type="button" data-qa-report-shot-add>＋ 이미지 추가</button>
    </div>
    <div class="qa-report-shot-drop" data-qa-report-shot-drop tabindex="0">이미지를 클릭해서 선택하거나 끌어놓기 · 여러 장 업로드 가능 · 붙여넣기 가능</div>
    <input id="qaReportShotInput" type="file" accept="image/png,image/jpeg,image/webp" multiple hidden>
    <div class="qa-report-shot-gallery" id="qaReportShotGallery"></div>
    <p class="qa-report-shot-empty" id="qaReportShotEmpty">저장된 스크린샷이 없습니다.</p>`;
  const grid=panel.querySelector('.qa-report-grid');
  if(grid)grid.insertAdjacentElement('afterend',section);
  else panel.appendChild(section);
  renderShots();
}

function renderShots(){
  const gallery=$('#qaReportShotGallery');
  const empty=$('#qaReportShotEmpty');
  if(!gallery)return;
  gallery.innerHTML=shots.map(shot=>`<article class="qa-report-shot-card"><button class="qa-report-shot-thumb" type="button" data-qa-report-shot="${esc(shot.id)}"><img src="${esc(shot.imageData||'')}" alt="QA screenshot"><span class="qa-report-shot-meta">${esc(shot.fileName||'스크린샷')}</span></button><button class="qa-report-shot-delete" type="button" title="삭제" aria-label="스크린샷 삭제" data-qa-report-shot-delete="${esc(shot.id)}">×</button></article>`).join('');
  if(empty)empty.hidden=shots.length>0;
}

function setDropText(text){
  const drop=$('[data-qa-report-shot-drop]');
  if(drop)drop.textContent=text;
}

function setUploading(flag,text=''){
  uploadBusy=flag;
  const drop=$('[data-qa-report-shot-drop]');
  const add=$('[data-qa-report-shot-add]');
  drop?.classList.toggle('is-uploading',flag);
  if(add)add.disabled=flag;
  if(text)setDropText(text);
  else if(!flag)setDropText('이미지를 클릭해서 선택하거나 끌어놓기 · 여러 장 업로드 가능 · 붙여넣기 가능');
}

function loadImage(file){
  return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(file);
    const image=new Image();
    image.onload=()=>{URL.revokeObjectURL(url);resolve(image)};
    image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('image-load-failed'))};
    image.src=url;
  });
}

async function compressImage(file){
  if(!file?.type?.startsWith('image/'))throw new Error('not-image');
  if(file.size>20*1024*1024)throw new Error('too-large');
  const image=await loadImage(file);
  const originalWidth=image.naturalWidth||image.width;
  const originalHeight=image.naturalHeight||image.height;
  let maxSide=1800;
  let quality=.84;
  let result='';
  let width=originalWidth;
  let height=originalHeight;

  for(let attempt=0;attempt<7;attempt+=1){
    const ratio=Math.min(1,maxSide/Math.max(originalWidth,originalHeight));
    width=Math.max(1,Math.round(originalWidth*ratio));
    height=Math.max(1,Math.round(originalHeight*ratio));
    const canvas=document.createElement('canvas');
    canvas.width=width;
    canvas.height=height;
    const ctx=canvas.getContext('2d',{alpha:false});
    ctx.fillStyle='#fff';
    ctx.fillRect(0,0,width,height);
    ctx.drawImage(image,0,0,width,height);
    result=canvas.toDataURL('image/jpeg',quality);
    if(result.length<=650000)break;
    maxSide=Math.max(900,Math.round(maxSide*.84));
    quality=Math.max(.56,quality-.06);
  }

  if(!result||result.length>900000)throw new Error('compressed-too-large');
  return {imageData:result,width,height};
}

async function uploadFiles(fileList){
  const files=[...(fileList||[])].filter(file=>file?.type?.startsWith('image/'));
  if(!files.length){toast('이미지 파일을 선택해주세요.');return}
  if(uploadBusy)return;
  const siteId=currentSiteId||window.NineworksQAState?.getSiteId?.()||'';
  if(!siteId){toast('먼저 QA 사이트를 선택해주세요.');return}
  if(!api?.auth?.currentUser){toast('로그인 상태를 확인해주세요.');return}

  setUploading(true,`스크린샷 ${files.length}장 처리 중...`);
  let saved=0;
  try{
    for(let index=0;index<files.length;index+=1){
      const file=files[index];
      setDropText(`${index+1}/${files.length} · ${file.name} 저장 중...`);
      try{
        const compressed=await compressImage(file);
        const id=uid();
        await api.setDoc(api.doc(api.db,'qaSites',siteId,'reportShots',id),{
          id,
          siteId,
          fileName:file.name||`screenshot-${index+1}.jpg`,
          imageData:compressed.imageData,
          width:compressed.width,
          height:compressed.height,
          createdAtText:nowText(),
          updatedAt:api.serverTimestamp(),
          uploadedBy:api.auth.currentUser.uid
        });
        saved+=1;
      }catch(error){
        console.error('QA 보고서 스크린샷 저장 실패',error);
      }
    }
    if(saved)toast(`스크린샷 ${saved}장을 저장했습니다.`);
    if(saved<files.length)toast(`${saved}장은 저장했고 ${files.length-saved}장은 용량 또는 파일 문제로 저장하지 못했습니다.`);
  }finally{
    setUploading(false);
    const input=$('#qaReportShotInput');
    if(input)input.value='';
  }
}

function subscribe(siteId){
  if(siteId===currentSiteId&&unsubscribe)return;
  unsubscribe?.();
  unsubscribe=null;
  currentSiteId=siteId||'';
  shots=[];
  renderShots();
  if(!api||!currentSiteId)return;
  const ref=api.collection(api.db,'qaSites',currentSiteId,'reportShots');
  unsubscribe=api.onSnapshot(ref,snapshot=>{
    shots=snapshot.docs.map(doc=>({id:doc.id,...doc.data()})).sort((a,b)=>String(a.createdAtText||'').localeCompare(String(b.createdAtText||'')));
    renderShots();
  },error=>{
    console.error('QA 보고서 스크린샷 불러오기 실패',error);
    toast('스크린샷 기록을 불러오지 못했습니다.');
  });
}

async function deleteShot(id){
  if(!id||!currentSiteId||!api)return;
  if(!confirm('이 스크린샷을 삭제할까요?'))return;
  try{
    await api.deleteDoc(api.doc(api.db,'qaSites',currentSiteId,'reportShots',id));
    toast('스크린샷을 삭제했습니다.');
  }catch(error){
    console.error('QA 보고서 스크린샷 삭제 실패',error);
    toast('스크린샷을 삭제하지 못했습니다.');
  }
}

function openViewer(id){
  const shot=shots.find(item=>item.id===id);
  if(!shot?.imageData)return;
  ensureViewer();
  const viewer=$('#qaReportShotViewer');
  const image=$('#qaReportShotViewerImage');
  const caption=$('#qaReportShotViewerCaption');
  if(image)image.src=shot.imageData;
  if(caption)caption.textContent=shot.fileName||'QA screenshot';
  if(viewer)viewer.hidden=false;
  document.body.style.overflow='hidden';
}

function closeViewer(){
  const viewer=$('#qaReportShotViewer');
  if(viewer)viewer.hidden=true;
  const image=$('#qaReportShotViewerImage');
  if(image)image.removeAttribute('src');
  document.body.style.overflow='';
}

function bind(){
  window.addEventListener('nineworks:qa-site-change',event=>subscribe(event.detail?.siteId||''));

  document.addEventListener('click',event=>{
    if(event.target.closest('[data-qa-report-shot-add],[data-qa-report-shot-drop]')){
      if(!uploadBusy)$('#qaReportShotInput')?.click();
      return;
    }
    const remove=event.target.closest('[data-qa-report-shot-delete]');
    if(remove){event.preventDefault();event.stopPropagation();deleteShot(remove.dataset.qaReportShotDelete);return}
    const thumb=event.target.closest('[data-qa-report-shot]');
    if(thumb){openViewer(thumb.dataset.qaReportShot);return}
    if(event.target.closest('[data-qa-report-shot-close]')||event.target.id==='qaReportShotViewer')closeViewer();
  });

  document.addEventListener('change',event=>{
    if(event.target.id==='qaReportShotInput')uploadFiles(event.target.files);
  });

  document.addEventListener('dragover',event=>{
    const drop=event.target.closest('[data-qa-report-shot-drop]');
    if(!drop)return;
    event.preventDefault();
    drop.classList.add('is-drag');
  });
  document.addEventListener('dragleave',event=>event.target.closest('[data-qa-report-shot-drop]')?.classList.remove('is-drag'));
  document.addEventListener('drop',event=>{
    const drop=event.target.closest('[data-qa-report-shot-drop]');
    if(!drop)return;
    event.preventDefault();
    drop.classList.remove('is-drag');
    uploadFiles(event.dataTransfer?.files);
  });
  document.addEventListener('paste',event=>{
    const drop=event.target.closest('[data-qa-report-shot-drop]');
    if(!drop)return;
    const files=[...(event.clipboardData?.files||[])].filter(file=>file.type.startsWith('image/'));
    if(files.length){event.preventDefault();uploadFiles(files)}
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('#qaReportShotViewer')?.hidden)closeViewer()});
}

function init(){
  ensureViewer();
  bind();
  const wait=()=>{
    api=window.NineworksFirebase;
    if(!api)return setTimeout(wait,80);
    const siteId=window.NineworksQAState?.getSiteId?.()||'';
    if(siteId)subscribe(siteId);
    const root=$('#qaPage')||document.body;
    const observer=new MutationObserver(()=>ensurePanel());
    observer.observe(root,{childList:true,subtree:true});
    ensurePanel();
  };
  wait();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
