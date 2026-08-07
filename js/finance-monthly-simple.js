const style=document.createElement('style');
style.textContent=`
  .finance-monthly-fee-field{display:grid;gap:7px}
  .finance-monthly-fee-field>span{color:#b7b7bd;font-size:11.5px;font-weight:650}
  .finance-monthly-fee-field input{width:100%;height:45px;border:1px solid var(--line);border-radius:8px;padding:0 12px;background:#252529;color:#f2f2f4;outline:0}
  .finance-monthly-fee-field input:focus{border-color:rgba(85,119,255,.72);box-shadow:0 0 0 3px rgba(67,104,245,.09)}
  .finance-monthly-total-note{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-top:10px;border:1px solid rgba(85,119,255,.18);border-radius:9px;padding:12px 14px;background:rgba(67,104,245,.045)}
  .finance-monthly-total-note span{color:#85858e;font-size:11px}
  .finance-monthly-total-note strong{color:#dfe5ff;font-size:16px}
  #financeContractAmount.is-monthly-calculated{background:#1e1e22!important;color:#8d96bd!important;cursor:not-allowed}
`;
document.head.appendChild(style);

const $=(s,r=document)=>r.querySelector(s);
const won=v=>`${Math.round(Number(v||0)).toLocaleString()}원`;

function ensureMonthlyFeeUi(){
  const section=$('#financeMonthlySection');
  if(!section||$('#financeMonthlyFee'))return;
  const grid=section.querySelector('.finance-monthly-settings .finance-form-grid');
  const months=$('#financeMonthlyMonths')?.closest('.finance-field');
  if(!grid||!months)return;

  const label=document.createElement('label');
  label.className='finance-monthly-fee-field';
  label.innerHTML='<span>월 계약금 *</span><input id="financeMonthlyFee" type="number" min="0" step="1000" placeholder="예: 2000000">';
  grid.insertBefore(label,months);

  const total=document.createElement('div');
  total.className='finance-monthly-total-note';
  total.innerHTML='<span>전체 계약 공급가</span><strong id="financeMonthlyTotalAuto">0원</strong>';
  grid.insertAdjacentElement('afterend',total);
}

function isMonthly(){return $('#financeContractType')?.value==='monthly'}

function syncMonthlyTotal(){
  if(!isMonthly())return;
  const fee=Math.max(0,Number($('#financeMonthlyFee')?.value||0));
  const months=Math.max(0,Number($('#financeMonthlyMonths')?.value||0));
  const total=fee*months;
  const supply=$('#financeContractAmount');
  if(supply&&Number(supply.value||0)!==total){
    supply.value=total||'';
    supply.dispatchEvent(new Event('input',{bubbles:true}));
  }
  if($('#financeMonthlyTotalAuto'))$('#financeMonthlyTotalAuto').textContent=won(total);
}

function setSupplyMode(){
  const supply=$('#financeContractAmount');
  if(!supply)return;
  const span=supply.closest('.finance-field')?.querySelector('span');
  if(isMonthly()){
    supply.readOnly=true;
    supply.classList.add('is-monthly-calculated');
    if(span?.childNodes?.[0])span.childNodes[0].textContent='전체 공급가액 · 자동계산 ';
  }else{
    supply.readOnly=false;
    supply.classList.remove('is-monthly-calculated');
    if(span?.childNodes?.[0])span.childNodes[0].textContent='전체 공급가액 *';
  }
}

function hydrateMonthlyFee(){
  ensureMonthlyFeeUi();
  if(!isMonthly())return;
  const months=Math.max(0,Number($('#financeMonthlyMonths')?.value||0));
  const supply=Math.max(0,Number($('#financeContractAmount')?.value||0));
  const fee=$('#financeMonthlyFee');
  if(fee&&!fee.value&&months>0&&supply>0)fee.value=Math.round(supply/months);
  syncMonthlyTotal();
}

function refresh(){
  ensureMonthlyFeeUi();
  setSupplyMode();
  if(isMonthly())hydrateMonthlyFee();
}

document.addEventListener('click',e=>{
  if(e.target.closest('[data-finance-mode]'))setTimeout(refresh,0);
  if(e.target.closest('#financeAddContract,[data-finance-contract]'))setTimeout(refresh,40);
},true);

document.addEventListener('input',e=>{
  if(e.target?.id==='financeMonthlyMonths'||e.target?.id==='financeMonthlyFee')syncMonthlyTotal();
},true);

document.addEventListener('change',e=>{
  if(e.target?.id==='financeMonthlyMonths')syncMonthlyTotal();
},true);

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(refresh,0),{once:true});else setTimeout(refresh,0);
