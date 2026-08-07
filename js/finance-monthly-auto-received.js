const autoStyle = document.createElement('style');
autoStyle.textContent = `
  #financeMonthlySection .finance-payment-section{display:none!important}
  .finance-monthly-auto-received{display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:9px;margin-top:12px}
  .finance-monthly-auto-received>div{display:grid;gap:6px;padding:13px 14px;border:1px solid #303036;border-radius:9px;background:#202024}
  .finance-monthly-auto-received span{color:#777780;font-size:10.5px}
  .finance-monthly-auto-received strong{color:#d7dce9;font-size:16px}
  .finance-monthly-auto-received .is-auto{border-color:rgba(85,119,255,.34);background:rgba(67,104,245,.07)}
  .finance-monthly-auto-received .is-auto strong{color:#dfe6ff;font-size:18px}
  .finance-monthly-auto-guide{margin:8px 0 0;color:#74747d;font-size:10.5px;line-height:1.55}
  @media(max-width:820px){.finance-monthly-auto-received{grid-template-columns:1fr}}
`;
document.head.appendChild(autoStyle);

const $ = (selector, root = document) => root.querySelector(selector);
const pad = (value) => String(value).padStart(2, '0');
const won = (value) => `${Math.round(Number(value || 0)).toLocaleString()}원`;
let api = null;
let profile = null;
let unsubscribe = null;
let syncing = false;

function currentMonth() {
  const date = new Date();
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function monthIndex(key) {
  if (!/^\d{4}-\d{2}$/.test(String(key || ''))) return null;
  const [year, month] = key.split('-').map(Number);
  return year * 12 + (month - 1);
}

function elapsedMonths(startMonth, totalMonths) {
  const start = monthIndex(startMonth);
  const now = monthIndex(currentMonth());
  const months = Math.max(0, Number(totalMonths || 0));
  if (start === null || now === null || !months) return 0;
  if (now < start) return 0;
  return Math.min(months, now - start + 1);
}

function contractMonthlyFee(contract) {
  const stored = Number(contract?.monthly?.monthlyFee || 0);
  if (stored > 0) return stored;
  const months = Math.max(0, Number(contract?.monthly?.months || 0));
  const supply = Number(contract?.supplyAmount ?? contract?.contractAmount ?? 0);
  return months ? Math.round(supply / months) : 0;
}

function autoAmount(contract) {
  const count = elapsedMonths(contract?.monthly?.startMonth, contract?.monthly?.months);
  return contractMonthlyFee(contract) * count;
}

function isOwner() {
  return profile?.role === 'owner' || profile?.name === '박재영';
}

function ensureAutoUi() {
  const section = $('#financeMonthlySection');
  if (!section) return;

  const manual = section.querySelector('.finance-payment-section');
  if (manual) manual.hidden = true;

  if (!$('#financeMonthlyAutoReceived')) {
    const block = document.createElement('div');
    block.id = 'financeMonthlyAutoReceived';
    block.innerHTML = `
      <div class="finance-monthly-auto-received">
        <div><span>자동 집행 개월</span><strong id="financeMonthlyPaidMonths">0개월</strong></div>
        <div><span>월 계약금</span><strong id="financeMonthlyAutoFee">0원</strong></div>
        <div class="is-auto"><span>입금 · 집행 자동계산</span><strong id="financeMonthlyAutoAmount">0원</strong></div>
      </div>
      <p class="finance-monthly-auto-guide">시작월부터 현재월까지 지난 계약 개월을 입금·집행된 것으로 계산합니다. 2개월차라면 월 계약금 × 2가 자동 반영됩니다.</p>`;
    const settings = section.querySelector('.finance-monthly-settings');
    settings?.insertAdjacentElement('afterend', block);
  }
}

function formAutoValues() {
  const startMonth = $('#financeMonthlyStart')?.value || '';
  const totalMonths = Number($('#financeMonthlyMonths')?.value || 0);
  const fee = Math.max(0, Number($('#financeMonthlyFee')?.value || 0));
  const count = elapsedMonths(startMonth, totalMonths);
  return { count, fee, amount: fee * count };
}

function refreshFormAuto() {
  ensureAutoUi();
  if ($('#financeContractType')?.value !== 'monthly') return;
  const { count, fee, amount } = formAutoValues();
  if ($('#financeMonthlyPaidMonths')) $('#financeMonthlyPaidMonths').textContent = `${count}개월`;
  if ($('#financeMonthlyAutoFee')) $('#financeMonthlyAutoFee').textContent = won(fee);
  if ($('#financeMonthlyAutoAmount')) $('#financeMonthlyAutoAmount').textContent = won(amount);

  const hiddenAmount = $('#finance_monthly_amount');
  if (hiddenAmount && Number(hiddenAmount.value || 0) !== amount) {
    hiddenAmount.value = amount || '';
    hiddenAmount.dispatchEvent(new Event('input', { bubbles: true }));
  }

  const totalLabel = $('#financePaymentPreview')?.previousElementSibling;
  if (totalLabel) totalLabel.textContent = '입금 · 집행 자동계산';
  const note = $('#financeModeNote');
  if (note) note.textContent = '월단위 계약은 시작월부터 현재월까지의 경과 개월 × 월 계약금으로 입금·집행액을 자동 계산합니다.';
}

async function syncContracts(snapshot) {
  if (!api || !isOwner() || syncing) return;
  const monthly = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((contract) => contract.contractType === 'monthly');
  const changes = monthly.filter((contract) => {
    const next = autoAmount(contract);
    return Number(contract?.payments?.monthly?.amount || 0) !== next
      || Number(contract?.payments?.monthly?.autoMonths || -1) !== elapsedMonths(contract?.monthly?.startMonth, contract?.monthly?.months);
  });
  if (!changes.length) return;

  syncing = true;
  try {
    const batch = api.writeBatch(api.db);
    changes.forEach((contract) => {
      const count = elapsedMonths(contract?.monthly?.startMonth, contract?.monthly?.months);
      const fee = contractMonthlyFee(contract);
      const amount = fee * count;
      const monthlyPayment = {
        ...(contract?.payments?.monthly || {}),
        amount,
        autoMonths: count,
        autoCalculated: true,
        paidDate: '',
        taxInvoice: Boolean(contract?.payments?.monthly?.taxInvoice)
      };
      const payments = { ...(contract.payments || {}), monthly: monthlyPayment };
      const monthlyData = { ...(contract.monthly || {}), monthlyFee: fee };
      batch.set(api.doc(api.db, 'financeContracts', contract.id), { payments, monthly: monthlyData, updatedAt: api.serverTimestamp() }, { merge: true });

      const ledgerRef = api.doc(api.db, 'financeLedger', `pay_${contract.id}_monthly`);
      if (amount > 0) {
        batch.set(ledgerRef, {
          id: `pay_${contract.id}_monthly`,
          type: 'income',
          amount,
          date: new Date().toISOString().slice(0, 10),
          category: '월단위 계약대금',
          description: `${contract.clientName || ''} · ${contract.projectName || ''} · ${count}개월 자동 집행`,
          clientId: contract.clientId || '',
          clientName: contract.clientName || '',
          sourceContractId: contract.id,
          sourcePhase: 'monthly',
          autoContractPayment: true,
          autoMonths: count,
          updatedAt: api.serverTimestamp()
        }, { merge: true });
      } else {
        batch.delete(ledgerRef);
      }
    });
    await batch.commit();
  } catch (error) {
    console.warn('월단위 자동 집행액 동기화 실패', error);
  } finally {
    syncing = false;
  }
}

function start(user) {
  unsubscribe?.();
  unsubscribe = null;
  if (!user || !api) return;
  api.getDoc(api.doc(api.db, 'users', user.uid)).then((snapshot) => {
    profile = snapshot.exists() ? snapshot.data() : null;
    if (!isOwner()) return;
    unsubscribe = api.onSnapshot(api.collection(api.db, 'financeContracts'), syncContracts);
  }).catch(() => {});
}

function init() {
  ensureAutoUi();
  const wait = () => {
    api = window.NineworksFirebase;
    if (!api) return setTimeout(wait, 80);
    api.onAuthStateChanged(api.auth, start);
  };
  wait();

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-finance-mode],#financeAddContract,[data-finance-contract]')) {
      setTimeout(refreshFormAuto, 60);
    }
  }, true);

  document.addEventListener('input', (event) => {
    if (['financeMonthlyStart', 'financeMonthlyMonths', 'financeMonthlyFee'].includes(event.target?.id)) {
      setTimeout(refreshFormAuto, 0);
    }
  }, true);
  document.addEventListener('change', (event) => {
    if (['financeMonthlyStart', 'financeMonthlyMonths'].includes(event.target?.id)) {
      setTimeout(refreshFormAuto, 0);
    }
  }, true);

  const observer = new MutationObserver(() => {
    ensureAutoUi();
    if ($('#financeContractModal') && !$('#financeContractModal').hidden) refreshFormAuto();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
