(() => {
  const createFinanceUi = () => {
    const nav = document.querySelector('.main-nav');
    if (nav && !document.querySelector('#financeNavButton')) {
      const button = document.createElement('button');
      button.id = 'financeNavButton';
      button.className = 'nav-link';
      button.type = 'button';
      button.dataset.route = 'finance';
      button.textContent = '대금관리';
      button.hidden = true;
      const sales = document.querySelector('#salesNavButton') || nav.querySelector('[data-route="sales"]');
      if (sales) sales.insertAdjacentElement('afterend', button);
      else nav.querySelector('[data-route="requests"]')?.insertAdjacentElement('beforebegin', button) || nav.appendChild(button);
    }

    const content = document.querySelector('.app-content');
    if (content && !document.querySelector('#financePage')) {
      const page = document.createElement('main');
      page.id = 'financePage';
      page.className = 'page finance-page is-locked';
      page.dataset.page = 'finance';
      page.innerHTML = `
        <section class="page-heading">
          <div>
            <p class="eyebrow">PAYMENT & CASH</p>
            <h1>대금관리</h1>
            <p>클라이언트별 계약 대금과 실제 입출금을 연결해 미수금과 현재 보유고를 관리합니다.</p>
            <span class="finance-owner-note">OWNER 계정 전용 재무 화면</span>
          </div>
          <div class="finance-panel-actions">
            <button id="financeAddLedger" class="button button--ghost" type="button">＋ 자금 기록</button>
            <button id="financeAddContract" class="button button--primary" type="button">＋ 계약 등록</button>
          </div>
        </section>

        <section class="finance-summary">
          <article class="finance-summary-card finance-summary-card--reserve"><span>현재 보유고</span><strong id="financeReserve">0원</strong><small>입금 − 지출 ± 잔액조정</small></article>
          <article class="finance-summary-card"><span>입금 완료</span><strong id="financeReceived">0원</strong><small>계약 대금 중 실제 입금</small></article>
          <article class="finance-summary-card"><span>미수금</span><strong id="financeOutstanding">0원</strong><small>계약 총액 중 미입금 금액</small></article>
          <article class="finance-summary-card"><span>이번 달 예정</span><strong id="financeUpcoming">0원</strong><small>이번 달 입금 예정 대금</small></article>
          <article class="finance-summary-card"><span>진행 계약</span><strong id="financeContractCount">0</strong><small>미수금이 남은 계약</small></article>
        </section>

        <section class="panel finance-panel">
          <div class="finance-panel-head">
            <div><h2>클라이언트별 계약 대금</h2><p>계약금 · 선금/중도금 · 잔금의 예정일과 입금 여부를 확인합니다.</p></div>
            <div class="finance-panel-actions"><input id="financeSearch" class="finance-search" type="search" placeholder="클라이언트 · 프로젝트 검색"></div>
          </div>
          <div id="financeContractList" class="finance-contract-list"><p class="finance-empty">대금 데이터를 불러오는 중입니다.</p></div>
        </section>

        <section class="panel finance-panel">
          <div class="finance-panel-head">
            <div><h2>보유고 · 자금 기록</h2><p>계약 입금은 자동 반영되고, 운영비·외주비 등 지출과 잔액조정은 직접 기록합니다.</p></div>
            <button id="financeAddLedgerBottom" class="button button--ghost" type="button">＋ 입출금 기록</button>
          </div>
          <div id="financeLedgerList" class="finance-ledger-list"><p class="finance-empty">자금 기록을 불러오는 중입니다.</p></div>
        </section>`;
      const requests = document.querySelector('#requestsPage');
      if (requests) requests.insertAdjacentElement('beforebegin', page);
      else content.appendChild(page);
    }
  };

  document.addEventListener('click', (event) => {
    if (!event.target.closest('#financeAddLedgerBottom')) return;
    event.preventDefault();
    document.querySelector('#financeAddLedger')?.click();
  }, true);

  createFinanceUi();
  if (!document.querySelector('#financePage')) {
    const observer = new MutationObserver(() => {
      createFinanceUi();
      if (document.querySelector('#financePage') && document.querySelector('#financeNavButton')) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})();