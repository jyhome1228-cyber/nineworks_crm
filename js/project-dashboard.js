(() => {
  "use strict";

  const VERSION = "20261001-1";
  const DASHBOARD_DOC = "project_dashboard";

  const DEFAULT_PROJECTS = [
    { id: "sogwadam", name: "소과담", client: "소과담", summary: "지원사업 디자인 및 결과보고", stage: "결과보고", nextAction: "10/16 결과보고 자료 준비 및 제출", due: "2026-10-16", status: "active", priority: "focus" },
    { id: "dailyhabit", name: "데일리해빗", client: "아밍제이", summary: "브랜드·커머스 상시 운영", stage: "상시 운영", nextAction: "월·목 공동구매 작업 및 상품 운영", dueLabel: "월·목 정기", status: "active", priority: "focus" },
    { id: "odebell", name: "ODE BELL", client: "아밍제이", summary: "뷰티 브랜드 패키지·비주얼 운영", stage: "비주얼 개발", nextAction: "패키지·콘텐츠 후속 디자인 정리", status: "active", priority: "normal" },
    { id: "terracl", name: "TerraCl / TerraSave", client: "테라세이브", summary: "과일 보호 솔루션 브랜드·서비스 구축", stage: "서비스 구축", nextAction: "과일 DB와 사이트 콘텐츠 정리", status: "active", priority: "normal" },
    { id: "bitess", name: "BITESS", client: "RP BIO", summary: "프리미엄 성인 구미 신규 브랜드 구축", stage: "브랜드 디렉션", nextAction: "디렉션 확정 후 BI·패키지 개발 진행", status: "active", priority: "focus" },
    { id: "orient", name: "오리엔트그룹", client: "오리엔트그룹", summary: "브랜드 전략부터 웹·영업자료까지 통합 구축", stage: "전략·네이밍", nextAction: "사업내용 정리 → 전략 → 네이밍 순차 진행", status: "active", priority: "focus" },
    { id: "ggm", name: "건강미", client: "건강미", summary: "브랜드·Cafe24·프로모션 월간 운영", stage: "상시 운영", nextAction: "프로모션·상품등록·쇼핑몰 운영 요청 처리", status: "active", priority: "focus" },
    { id: "ririm", name: "리림", client: "리림", summary: "브랜드 웹사이트 구축 및 콘텐츠 정리", stage: "사이트 마무리", nextAction: "전체 페이지 레이아웃·헤더·콘텐츠 QA", status: "review", priority: "normal" },
    { id: "aminternational", name: "AM International", client: "AM International", summary: "기업 BI 및 로고 개발", stage: "로고 개발", nextAction: "영문 로고 디렉션 확정 및 후속안 정리", status: "active", priority: "normal" },
    { id: "esencia", name: "ESEN’CIA", client: "ESEN’CIA", summary: "Shopify 상품·스토어 구축", stage: "상품 등록", nextAction: "제품별 설명과 Product organization 입력", status: "active", priority: "normal" },
    { id: "nineworks-web", name: "9WORKS Website", client: "나인웍스", summary: "회사 홈페이지 리뉴얼 및 서비스 구조 정리", stage: "오픈 QA", nextAction: "페이지별 레이아웃·위계·모바일 최종 점검", status: "review", priority: "normal" },
    { id: "nineworks-crm", name: "9WORKS CRM", client: "나인웍스", summary: "내부 프로젝트·클라이언트·자금 관리 시스템", stage: "구조 개편", nextAction: "내 업무 대시보드 중심으로 메인 구조 개편", status: "active", priority: "focus" },
    { id: "jeongwol", name: "정월재", client: "정월재", summary: "운세 서비스 UX·콘텐츠 고도화", stage: "서비스 개선", nextAction: "오늘의 운세 결과 구조와 모바일 경험 QA", status: "active", priority: "normal" },
    { id: "solarbiz", name: "솔라비즈", client: "나인웍스", summary: "소기업용 매출·세금계산서 관리 서비스", stage: "기능 개발", nextAction: "PDF 분류·매출 기록 흐름 고도화", status: "active", priority: "normal" },
    { id: "printing", name: "9WORKS PRINTING", client: "나인웍스", summary: "인쇄·패키지 신규 서비스 런칭", stage: "런칭 준비", nextAction: "랜딩 콘텐츠와 상품 체계 정리", status: "waiting", priority: "low" },
    { id: "research", name: "박사 연구", client: "개인 / 연구", summary: "생성형 AI·디자인 프로세스 연구", stage: "연구 설계", nextAction: "연구 범위 축소 및 주제별 설계 정리", status: "active", priority: "low" }
  ];

  const STATUS = {
    active: { label: "진행중", cls: "is-active" },
    review: { label: "검수중", cls: "is-review" },
    waiting: { label: "대기", cls: "is-waiting" },
    done: { label: "완료", cls: "is-done" },
    hold: { label: "보류", cls: "is-hold" }
  };

  const PRIORITY = {
    focus: "집중",
    normal: "일반",
    low: "후순위"
  };

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const esc = (value = "") => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  let api = null;
  let currentUser = null;
  let projects = [...DEFAULT_PROJECTS];
  let clients = [];
  let unsubscribeProjects = null;
  let unsubscribeClients = null;
  let currentFilter = "open";
  let editingId = null;

  function injectStyle() {
    if ($("#nineworks-project-dashboard-style")) return;
    const link = document.createElement("link");
    link.id = "nineworks-project-dashboard-style";
    link.rel = "stylesheet";
    link.href = new URL(`../css/project-dashboard.css?v=${VERSION}`, import.meta.url).href;
    document.head.appendChild(link);
  }

  function createNav() {
    const nav = $(".main-nav");
    if (!nav) return;

    nav.querySelector('[data-route="dashboard"]')?.remove();
    const oldMyPage = nav.querySelector('[data-route="mypage"]');
    if (oldMyPage) oldMyPage.remove();

    let work = nav.querySelector('[data-route="work"]');
    if (!work) {
      work = document.createElement("button");
      work.type = "button";
      work.className = "nav-link";
      work.dataset.route = "work";
      work.textContent = "내 업무";
    }

    const calendar = nav.querySelector('[data-route="calendar"]');
    if (calendar) nav.insertBefore(work, calendar);
    else nav.prepend(work);

    const brand = $(".brand--button");
    if (brand) {
      brand.dataset.route = "work";
      brand.setAttribute("aria-label", "내 업무로 이동");
    }

    reorderNav();
  }

  function reorderNav() {
    const nav = $(".main-nav");
    if (!nav) return;
    const order = ["work", "calendar", "finance", "clients", "requests", "sales"];
    order.forEach((route) => {
      const item = nav.querySelector(`[data-route="${route}"]`);
      if (item) nav.appendChild(item);
    });

    const finance = $("#financeNavButton");
    if (finance) finance.textContent = "자금 · 계약";

    const financeHeading = $("#financePage .page-heading h1");
    if (financeHeading) financeHeading.textContent = "자금 · 계약";
    const financeEyebrow = $("#financePage .page-heading .eyebrow");
    if (financeEyebrow) financeEyebrow.textContent = "CONTRACT & CASH";
  }

  function createPage() {
    const content = $(".app-content");
    if (!content || $("#workPage")) return;

    const page = document.createElement("main");
    page.id = "workPage";
    page.className = "page work-dashboard-page is-active";
    page.dataset.page = "work";
    page.innerHTML = `
      <section class="work-dashboard-heading">
        <div>
          <p class="eyebrow">MY PROJECTS</p>
          <h1>내 업무</h1>
          <p>현재 진행 중인 프로젝트, 클라이언트, 지금 해야 할 일을 한 화면에서 관리합니다.</p>
        </div>
        <div class="work-dashboard-actions">
          <button id="workDashboardAdd" class="button button--primary" type="button">＋ 프로젝트 추가</button>
        </div>
      </section>

      <section class="work-summary-grid" aria-label="프로젝트 요약">
        <button class="work-summary-card is-selected" type="button" data-work-filter="open">
          <span>진행 프로젝트</span><strong id="workSummaryOpen">0</strong><small>완료 제외 전체</small>
        </button>
        <button class="work-summary-card" type="button" data-work-filter="focus">
          <span>집중 관리</span><strong id="workSummaryFocus">0</strong><small>지금 우선 확인</small>
        </button>
        <button class="work-summary-card" type="button" data-work-filter="review">
          <span>검수 필요</span><strong id="workSummaryReview">0</strong><small>마무리·확인 단계</small>
        </button>
        <button class="work-summary-card" type="button" data-work-filter="waiting">
          <span>대기</span><strong id="workSummaryWaiting">0</strong><small>회신·착수 대기</small>
        </button>
        <button class="work-summary-card" type="button" data-work-filter="deadline">
          <span>마감 일정</span><strong id="workSummaryDeadline">0</strong><small>21일 이내</small>
        </button>
      </section>

      <section class="work-dashboard-layout">
        <section class="panel work-project-panel">
          <div class="work-project-toolbar">
            <div>
              <h2>프로젝트 업무 현황</h2>
              <p>프로젝트별 현재 단계와 바로 해야 할 일을 기준으로 정리했습니다.</p>
            </div>
            <div class="work-project-tools">
              <div class="work-filter-tabs" role="tablist" aria-label="프로젝트 필터">
                <button class="is-active" type="button" data-work-filter="open">진행</button>
                <button type="button" data-work-filter="all">전체</button>
                <button type="button" data-work-filter="focus">집중</button>
                <button type="button" data-work-filter="review">검수</button>
                <button type="button" data-work-filter="waiting">대기</button>
              </div>
              <label class="work-search"><span class="sr-only">프로젝트 검색</span><input id="workProjectSearch" type="search" placeholder="프로젝트 · 클라이언트 검색" /></label>
            </div>
          </div>

          <div class="work-project-table-wrap">
            <table class="work-project-table">
              <thead>
                <tr>
                  <th>프로젝트</th>
                  <th>클라이언트</th>
                  <th>간략 내용</th>
                  <th>현재 단계</th>
                  <th>지금 해야 할 일</th>
                  <th>일정</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody id="workProjectBody"></tbody>
            </table>
          </div>
          <div id="workProjectCards" class="work-project-cards"></div>
        </section>

        <aside class="work-focus-column">
          <section class="panel work-focus-panel">
            <div class="work-side-heading">
              <div><p class="eyebrow">NOW</p><h2>지금 확인할 일</h2></div>
              <span id="workFocusCount" class="count-badge">0</span>
            </div>
            <div id="workFocusList" class="work-focus-list"></div>
          </section>

          <section class="panel work-client-panel">
            <div class="work-side-heading">
              <div><p class="eyebrow">CLIENT LINK</p><h2>클라이언트 연동</h2></div>
              <button class="text-button" type="button" data-work-route="clients">전체 보기</button>
            </div>
            <p class="work-side-copy">프로젝트의 클라이언트명이 CRM 클라이언트 목록과 일치하면 자동으로 연결됩니다.</p>
            <div id="workClientLinkSummary" class="work-client-link-summary"></div>
          </section>
        </aside>
      </section>
    `;

    const calendar = $("#calendarPage");
    if (calendar) calendar.insertAdjacentElement("beforebegin", page);
    else content.prepend(page);

    $("#calendarPage")?.classList.remove("is-active");
    $$(".main-nav .nav-link").forEach((link) => link.classList.toggle("is-active", link.dataset.route === "work"));
  }

  function createModal() {
    if ($("#workProjectModal")) return;
    const backdrop = document.createElement("div");
    backdrop.id = "workProjectBackdrop";
    backdrop.className = "work-project-backdrop";
    backdrop.hidden = true;

    const modal = document.createElement("section");
    modal.id = "workProjectModal";
    modal.className = "work-project-modal";
    modal.hidden = true;
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.innerHTML = `
      <div class="work-project-modal__head">
        <div><p class="eyebrow">PROJECT</p><h2 id="workProjectModalTitle">프로젝트 수정</h2></div>
        <button class="work-project-modal__close" type="button" data-work-modal-close aria-label="닫기">×</button>
      </div>
      <form id="workProjectForm" class="work-project-form">
        <input id="workProjectId" type="hidden" />
        <div class="work-project-form-grid">
          <label><span>프로젝트명 *</span><input id="workProjectName" required /></label>
          <label><span>클라이언트 *</span><input id="workProjectClient" list="workProjectClientOptions" required /><datalist id="workProjectClientOptions"></datalist></label>
        </div>
        <label><span>간략 내용</span><input id="workProjectSummary" placeholder="프로젝트 성격을 한 줄로" /></label>
        <div class="work-project-form-grid">
          <label><span>현재 단계</span><input id="workProjectStage" placeholder="예: 브랜드 디렉션" /></label>
          <label><span>마감일</span><input id="workProjectDue" type="date" /></label>
        </div>
        <label><span>지금 해야 할 일 *</span><textarea id="workProjectNextAction" rows="3" required></textarea></label>
        <div class="work-project-form-grid">
          <label><span>상태</span><select id="workProjectStatus"><option value="active">진행중</option><option value="review">검수중</option><option value="waiting">대기</option><option value="hold">보류</option><option value="done">완료</option></select></label>
          <label><span>우선순위</span><select id="workProjectPriority"><option value="focus">집중</option><option value="normal">일반</option><option value="low">후순위</option></select></label>
        </div>
        <label><span>일정 메모</span><input id="workProjectDueLabel" placeholder="예: 월·목 정기" /></label>
        <div class="work-project-form-actions">
          <button id="workProjectDelete" class="button button--ghost work-delete-button" type="button">삭제</button>
          <span></span>
          <button class="button button--ghost" type="button" data-work-modal-close>취소</button>
          <button class="button button--primary" type="submit">저장</button>
        </div>
      </form>
    `;

    document.body.append(backdrop, modal);
  }

  function activateRoute(route) {
    $$("[data-page]").forEach((page) => page.classList.toggle("is-active", page.dataset.page === route));
    $$(".main-nav .nav-link").forEach((link) => link.classList.toggle("is-active", link.dataset.route === route));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function parseDate(key) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(key || ""))) return null;
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function daysUntil(key) {
    const date = parseDate(key);
    if (!date) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.round((date - now) / 86400000);
  }

  function dueText(project) {
    if (project.dueLabel) return project.dueLabel;
    const diff = daysUntil(project.due);
    if (diff === null) return "—";
    if (diff === 0) return "D-DAY";
    if (diff > 0) return `D-${diff}`;
    return `${Math.abs(diff)}일 지연`;
  }

  function isDeadline(project) {
    const diff = daysUntil(project.due);
    return diff !== null && diff >= 0 && diff <= 21 && project.status !== "done";
  }

  function visibleProjects() {
    const query = ($("#workProjectSearch")?.value || "").trim().toLowerCase();
    return projects.filter((project) => {
      const matchesSearch = !query || `${project.name} ${project.client} ${project.summary} ${project.stage} ${project.nextAction}`.toLowerCase().includes(query);
      if (!matchesSearch) return false;
      if (currentFilter === "all") return true;
      if (currentFilter === "focus") return project.priority === "focus" && project.status !== "done";
      if (currentFilter === "review") return project.status === "review";
      if (currentFilter === "waiting") return project.status === "waiting";
      if (currentFilter === "deadline") return isDeadline(project);
      return project.status !== "done" && project.status !== "hold";
    });
  }

  function clientConnected(name) {
    return clients.some((client) => String(client.name || "").trim() === String(name || "").trim());
  }

  function projectRow(project) {
    const status = STATUS[project.status] || STATUS.active;
    const connected = clientConnected(project.client);
    return `
      <tr data-work-project="${esc(project.id)}">
        <td><button class="work-project-name" type="button" data-work-edit="${esc(project.id)}"><strong>${esc(project.name)}</strong><small>${esc(PRIORITY[project.priority] || "일반")}</small></button></td>
        <td><button class="work-client-link ${connected ? "is-connected" : ""}" type="button" data-work-client="${esc(project.client)}"><span>${esc(project.client)}</span><small>${connected ? "연결됨" : "미등록"}</small></button></td>
        <td><span class="work-project-summary">${esc(project.summary || "—")}</span></td>
        <td><span class="work-stage-chip">${esc(project.stage || "—")}</span></td>
        <td><button class="work-next-action" type="button" data-work-edit="${esc(project.id)}">${esc(project.nextAction || "할 일 입력")}</button></td>
        <td><span class="work-due ${isDeadline(project) ? "is-soon" : ""}">${esc(dueText(project))}</span></td>
        <td><span class="work-status ${status.cls}">${esc(status.label)}</span></td>
      </tr>
    `;
  }

  function projectCard(project) {
    const status = STATUS[project.status] || STATUS.active;
    return `
      <article class="work-project-card" data-work-project="${esc(project.id)}">
        <div class="work-project-card__top"><button type="button" data-work-edit="${esc(project.id)}">${esc(project.name)}</button><span class="work-status ${status.cls}">${esc(status.label)}</span></div>
        <button class="work-client-link ${clientConnected(project.client) ? "is-connected" : ""}" type="button" data-work-client="${esc(project.client)}"><span>${esc(project.client)}</span><small>${clientConnected(project.client) ? "연결됨" : "미등록"}</small></button>
        <p>${esc(project.summary || "—")}</p>
        <dl><div><dt>현재 단계</dt><dd>${esc(project.stage || "—")}</dd></div><div><dt>지금 할 일</dt><dd>${esc(project.nextAction || "—")}</dd></div><div><dt>일정</dt><dd>${esc(dueText(project))}</dd></div></dl>
      </article>
    `;
  }

  function renderSummary() {
    const open = projects.filter((p) => p.status !== "done" && p.status !== "hold").length;
    const focus = projects.filter((p) => p.priority === "focus" && p.status !== "done").length;
    const review = projects.filter((p) => p.status === "review").length;
    const waiting = projects.filter((p) => p.status === "waiting").length;
    const deadline = projects.filter(isDeadline).length;

    $("#workSummaryOpen").textContent = String(open);
    $("#workSummaryFocus").textContent = String(focus);
    $("#workSummaryReview").textContent = String(review);
    $("#workSummaryWaiting").textContent = String(waiting);
    $("#workSummaryDeadline").textContent = String(deadline);

    $$("[data-work-filter]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.workFilter === currentFilter);
      button.classList.toggle("is-selected", button.dataset.workFilter === currentFilter);
    });
  }

  function renderProjects() {
    const list = visibleProjects();
    const body = $("#workProjectBody");
    const cards = $("#workProjectCards");
    if (body) body.innerHTML = list.length ? list.map(projectRow).join("") : '<tr><td colspan="7" class="work-empty">조건에 맞는 프로젝트가 없습니다.</td></tr>';
    if (cards) cards.innerHTML = list.length ? list.map(projectCard).join("") : '<p class="work-empty">조건에 맞는 프로젝트가 없습니다.</p>';
  }

  function renderFocus() {
    const rank = { focus: 0, normal: 1, low: 2 };
    const list = projects
      .filter((p) => p.status !== "done" && p.status !== "hold")
      .sort((a, b) => {
        const pa = rank[a.priority] ?? 1;
        const pb = rank[b.priority] ?? 1;
        if (pa !== pb) return pa - pb;
        const da = daysUntil(a.due);
        const db = daysUntil(b.due);
        return (da ?? 9999) - (db ?? 9999);
      })
      .slice(0, 6);

    $("#workFocusCount").textContent = String(list.length);
    $("#workFocusList").innerHTML = list.map((project) => `
      <button class="work-focus-item" type="button" data-work-edit="${esc(project.id)}">
        <span class="work-focus-item__meta">${esc(project.client)} · ${esc(project.stage || "진행")}</span>
        <strong>${esc(project.name)}</strong>
        <p>${esc(project.nextAction || "다음 할 일을 입력하세요.")}</p>
        <small>${esc(dueText(project))}</small>
      </button>
    `).join("");
  }

  function renderClientSummary() {
    const linked = new Set(projects.filter((p) => clientConnected(p.client)).map((p) => p.client));
    const used = new Set(projects.map((p) => p.client));
    const unlinked = [...used].filter((name) => !clientConnected(name));
    const root = $("#workClientLinkSummary");
    if (!root) return;
    root.innerHTML = `
      <div><strong>${linked.size}</strong><span>연결 클라이언트</span></div>
      <div><strong>${unlinked.length}</strong><span>미등록</span></div>
    `;
  }

  function renderClientOptions() {
    const list = $("#workProjectClientOptions");
    if (!list) return;
    const names = [...new Set(clients.map((client) => String(client.name || "").trim()).filter(Boolean))];
    list.innerHTML = names.map((name) => `<option value="${esc(name)}"></option>`).join("");
  }

  function renderAll() {
    renderSummary();
    renderProjects();
    renderFocus();
    renderClientSummary();
    renderClientOptions();
  }

  function openModal(id = "") {
    editingId = id;
    const project = projects.find((item) => item.id === id) || {
      id: "",
      name: "",
      client: "",
      summary: "",
      stage: "",
      nextAction: "",
      due: "",
      dueLabel: "",
      status: "active",
      priority: "normal"
    };

    $("#workProjectModalTitle").textContent = id ? "프로젝트 수정" : "프로젝트 추가";
    $("#workProjectId").value = project.id || "";
    $("#workProjectName").value = project.name || "";
    $("#workProjectClient").value = project.client || "";
    $("#workProjectSummary").value = project.summary || "";
    $("#workProjectStage").value = project.stage || "";
    $("#workProjectNextAction").value = project.nextAction || "";
    $("#workProjectDue").value = project.due || "";
    $("#workProjectDueLabel").value = project.dueLabel || "";
    $("#workProjectStatus").value = project.status || "active";
    $("#workProjectPriority").value = project.priority || "normal";
    $("#workProjectDelete").hidden = !id;
    $("#workProjectBackdrop").hidden = false;
    $("#workProjectModal").hidden = false;
    document.body.style.overflow = "hidden";
    setTimeout(() => $("#workProjectName")?.focus(), 30);
  }

  function closeModal() {
    $("#workProjectBackdrop").hidden = true;
    $("#workProjectModal").hidden = true;
    document.body.style.overflow = "";
    editingId = null;
  }

  async function persist(nextProjects) {
    if (!api || !currentUser) throw new Error("로그인이 필요합니다.");
    await api.setDoc(api.doc(api.db, "meta", DASHBOARD_DOC), {
      projects: nextProjects,
      updatedAt: api.serverTimestamp(),
      updatedBy: currentUser.uid
    }, { merge: true });
  }

  async function saveProject(event) {
    event.preventDefault();
    const id = $("#workProjectId").value || `project_${Date.now()}`;
    const previous = projects.find((item) => item.id === id);
    const project = {
      id,
      name: $("#workProjectName").value.trim(),
      client: $("#workProjectClient").value.trim(),
      summary: $("#workProjectSummary").value.trim(),
      stage: $("#workProjectStage").value.trim(),
      nextAction: $("#workProjectNextAction").value.trim(),
      due: $("#workProjectDue").value,
      dueLabel: $("#workProjectDueLabel").value.trim(),
      status: $("#workProjectStatus").value,
      priority: $("#workProjectPriority").value,
      createdAt: previous?.createdAt || Date.now(),
      updatedAt: Date.now()
    };
    const next = previous ? projects.map((item) => item.id === id ? project : item) : [project, ...projects];
    try {
      await persist(next);
      closeModal();
    } catch (error) {
      console.error("프로젝트 저장 실패", error);
      window.alert("프로젝트를 저장하지 못했습니다.");
    }
  }

  async function deleteProject() {
    if (!editingId) return;
    const project = projects.find((item) => item.id === editingId);
    if (!project || !window.confirm(`${project.name} 프로젝트를 삭제할까요?`)) return;
    try {
      await persist(projects.filter((item) => item.id !== editingId));
      closeModal();
    } catch (error) {
      console.error("프로젝트 삭제 실패", error);
      window.alert("프로젝트를 삭제하지 못했습니다.");
    }
  }

  function openClient(name) {
    activateRoute("clients");
    const search = $("#clientSearch");
    if (search) {
      search.value = name;
      search.dispatchEvent(new Event("input", { bubbles: true }));
      search.focus();
    }
  }

  function bindUi() {
    $("#workProjectSearch")?.addEventListener("input", renderProjects);
    $("#workDashboardAdd")?.addEventListener("click", () => openModal());
    $("#workProjectForm")?.addEventListener("submit", saveProject);
    $("#workProjectDelete")?.addEventListener("click", deleteProject);
    $("#workProjectBackdrop")?.addEventListener("click", closeModal);

    document.addEventListener("click", (event) => {
      const filter = event.target.closest("[data-work-filter]");
      if (filter) {
        currentFilter = filter.dataset.workFilter || "open";
        renderAll();
        return;
      }

      const edit = event.target.closest("[data-work-edit]");
      if (edit) {
        openModal(edit.dataset.workEdit);
        return;
      }

      const client = event.target.closest("[data-work-client]");
      if (client) {
        openClient(client.dataset.workClient);
        return;
      }

      const route = event.target.closest("[data-work-route]");
      if (route) {
        activateRoute(route.dataset.workRoute);
        return;
      }

      if (event.target.closest("[data-work-modal-close]")) closeModal();
    }, true);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !$("#workProjectModal")?.hidden) closeModal();
    });
  }

  function subscribe(user) {
    unsubscribeProjects?.();
    unsubscribeClients?.();
    unsubscribeProjects = null;
    unsubscribeClients = null;
    currentUser = user;

    if (!user || !api) {
      projects = [...DEFAULT_PROJECTS];
      renderAll();
      return;
    }

    const projectRef = api.doc(api.db, "meta", DASHBOARD_DOC);
    unsubscribeProjects = api.onSnapshot(projectRef, async (snapshot) => {
      if (!snapshot.exists()) {
        try {
          await api.setDoc(projectRef, {
            projects: DEFAULT_PROJECTS,
            createdAt: api.serverTimestamp(),
            updatedAt: api.serverTimestamp(),
            updatedBy: user.uid
          });
        } catch (error) {
          console.warn("프로젝트 초기 데이터 저장 실패", error);
          projects = [...DEFAULT_PROJECTS];
          renderAll();
        }
        return;
      }

      const data = snapshot.data() || {};
      projects = Array.isArray(data.projects) && data.projects.length ? data.projects : [...DEFAULT_PROJECTS];
      renderAll();
    }, (error) => {
      console.warn("프로젝트 대시보드 동기화 실패", error);
      projects = [...DEFAULT_PROJECTS];
      renderAll();
    });

    unsubscribeClients = api.onSnapshot(api.collection(api.db, "clients"), (snapshot) => {
      clients = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      renderAll();
    }, (error) => console.warn("클라이언트 연동 실패", error));
  }

  function connectFirebase() {
    api = window.NineworksFirebase;
    if (!api) return setTimeout(connectFirebase, 60);
    api.onAuthStateChanged(api.auth, subscribe);
  }

  function observeFinance() {
    reorderNav();
    const observer = new MutationObserver(() => {
      reorderNav();
      if ($("#financeNavButton") && $("#financePage")) {
        window.setTimeout(reorderNav, 0);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 5000);
  }

  function init() {
    injectStyle();
    createNav();
    createPage();
    createModal();
    bindUi();
    renderAll();
    observeFinance();
    queueMicrotask(connectFirebase);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
