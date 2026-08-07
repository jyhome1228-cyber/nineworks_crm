const semanticsStyle = document.createElement('style');
semanticsStyle.textContent = `
  .finance-summary.is-receivable-mode{grid-template-columns:2fr repeat(3,minmax(0,1fr))!important}
  .finance-summary.is-receivable-mode .finance-summary-card[data-hidden-receivable]{display:none!important}
  @media(max-width:1260px){.finance-summary.is-receivable-mode{grid-template-columns:2fr 1fr 1fr!important}}
  @media(max-width:820px){.finance-summary.is-receivable-mode{grid-template-columns:1fr 1fr!important}.finance-summary.is-receivable-mode .finance-summary-card--reserve{grid-column:1/-1}}
  @media(max-width:520px){.finance-summary.is-receivable-mode{grid-template-columns:1fr!important}}
`;
document.head.appendChild(semanticsStyle);

const $ = (selector, root = document) => root.querySelector(selector);
const won = (value) => `${Math.round(Number(value || 0)).toLocaleString()}원`;
let api = null;
let contracts = [];
let unsubscribeContracts = null;
let renderQueued = false;

function supply(contract) {
  return Number(contract?.supplyAmount ?? contract?.contractAmount ?? 0);
}
function bill(contract) {
  const base = supply(contract);
  return base + (contract?.vatSeparate === false ? 0 : Math.round(base * 0.1));
}
function received(contract) {
  if (contract?.contractType === 'monthly') {
    return Math.max(0, Number(contract?.payments?.monthly?.amount || 0));
  }
  return ['advance', 'balance'].reduce((sum, key) => {
    const payment = contract?.payments?.[key] || {};
    return sum + (payment.paid ? Number(payment.amount || 0) : 0);
  }, 0);
}
function remaining(contract) {
  return Math.max(0, bill(contract) - received(contract));
}
function setText(element, value) {
  if (element && element.textContent !== value) element.textContent = value;
}
function relabelCard(valueSelector, title, description) {
  const card = $(valueSelector)?.closest('.finance-summary-card');
  if (!card) return null;
  setText(card.querySelector('span'), title);
  setText(card.querySelector('small'), description);
  return card;
}

function applySemantics() {
  const page = $('#financePage');
  const summary = page?.querySelector('.finance-summary');
  if (!page || !summary) return;

  const totalBill = contracts.reduce((sum, contract) => sum + bill(contract), 0);
  const totalReceived = contracts.reduce((sum, contract) => sum + received(contract), 0);
  const totalRemaining = contracts.reduce((sum, contract) => sum + remaining(contract), 0);
  const activeCount = contracts.filter((contract) => remaining(contract) > 0).length;

  summary.classList.add('is-receivable-mode');
  relabelCard('#financeReserve', '계약 잔고', '앞으로 받아야 할 금액 · 미수금');
  relabelCard('#financeReceived', '입금 · 집행', '이미 받은 계약대금');
  const duplicate = relabelCard('#financeOutstanding', '미수금', '계약 잔고와 동일');
  if (duplicate) duplicate.setAttribute('data-hidden-receivable', 'true');
  relabelCard('#financeUpcoming', '총 계약액', '공급가 + 부가세 포함');
  relabelCard('#financeContractCount', '진행 계약', '잔고가 남은 계약');

  setText($('#financeReserve'), won(totalRemaining));
  setText($('#financeReceived'), won(totalReceived));
  setText($('#financeOutstanding'), won(totalRemaining));
  setText($('#financeUpcoming'), won(totalBill));
  setText($('#financeContractCount'), String(activeCount));

  const heading = page.querySelector('.page-heading > div');
  if (heading) {
    const description = heading.querySelector('h1 + p');
    setText(description, '클라이언트별 계약금액과 입금·집행 현황을 기준으로 앞으로 받을 계약 잔고를 관리합니다.');
  }

  const panels = [...page.querySelectorAll('.finance-panel')];
  const ledgerPanel = panels[1];
  if (ledgerPanel) {
    setText(ledgerPanel.querySelector('.finance-panel-head h2'), '입금 · 집행 기록');
    setText(ledgerPanel.querySelector('.finance-panel-head p'), '이미 받은 계약대금과 별도 지출·조정 내역을 기록합니다. 상단 계약 잔고는 미수금 기준입니다.');
  }
}

function scheduleApply() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    applySemantics();
  });
}

function start(user) {
  unsubscribeContracts?.();
  if (!user || !api) return;
  unsubscribeContracts = api.onSnapshot(
    api.collection(api.db, 'financeContracts'),
    (snapshot) => {
      contracts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      scheduleApply();
    },
    () => scheduleApply()
  );
}

function init() {
  const wait = () => {
    api = window.NineworksFirebase;
    if (!api) return setTimeout(wait, 80);
    api.onAuthStateChanged(api.auth, (user) => start(user));
  };
  wait();

  const observer = new MutationObserver(() => scheduleApply());
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  scheduleApply();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
