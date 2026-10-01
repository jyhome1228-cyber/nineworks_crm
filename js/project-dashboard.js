(() => {
  "use strict";

  const VERSION = "20261001-2";
  const DASHBOARD_DOC = "project_dashboard";

  const SELF_PROJECT_IDS = new Set([
    "jeongwol",
    "solarbiz",
    "nineworks-web",
    "nineworks-crm",
    "printing",
    "research"
  ]);

  const DEFAULT_PROJECTS = [
    {
      id: "sogwadam",
      name: "소과담",
      client: "소과담",
      summary: "지원사업 디자인 및 결과보고 업무",
      stage: "결과보고",
      nextAction: "10/16 결과보고 자료 준비 및 제출",
      due: "2026-10-16",
      status: "active",
      priority: "focus",
      imageUrl: "",
      workstreams: ["결과보고서 내용 정리", "성과·증빙자료 취합", "제출 전 최종 체크"],
      nextSteps: ["10/16 결과보고 제출", "보완 요청 발생 시 후속 대응"]
    },
    {
      id: "dailyhabit",
      name: "데일리해빗",
      client: "아밍제이",
      summary: "브랜드·커머스 상시 운영과 정기 공동구매 작업",
      stage: "상시 운영",
      nextAction: "월·목 공동구매 작업 및 상품 운영",
      dueLabel: "월·목 정기",
      status: "active",
      priority: "focus",
      imageUrl: "",
      workstreams: ["월요일 공동구매 작업", "목요일 공동구매 작업", "상품·상세페이지 운영", "사이트 수정 및 콘텐츠 반영"],
      nextSteps: ["다음 공동구매 일정 확인", "필요 소재 및 상품정보 선반영"]
    },
    {
      id: "odebell",
      name: "ODE BELL",
      client: "아밍제이",
      summary: "뷰티 브랜드 패키지와 브랜드 비주얼 운영",
      stage: "비주얼 개발",
      nextAction: "패키지·콘텐츠 후속 디자인 정리",
      status: "active",
      priority: "normal",
      imageUrl: "",
      workstreams: ["패키지 디자인", "제품 비주얼 제작", "브랜드 콘텐츠", "상세페이지 및 운영물"],
      nextSteps: ["후속 요청 우선순위 정리", "브랜드 톤 일관성 점검"]
    },
    {
      id: "terrasave",
      name: "TerraSave",
      client: "테라세이브",
      summary: "과일 보호·신선도 유지 솔루션 브랜드 및 웹 구축",
      stage: "서비스 구축",
      nextAction: "과일 DB와 사이트 콘텐츠 정리",
      status: "active",
      priority: "normal",
      imageUrl: "",
      workstreams: ["브랜드 정리", "과일 DB 구축", "에틸렌·민감도 정보 구조화", "웹사이트 콘텐츠 및 UI 개선"],
      nextSteps: ["과일 DB 범위 확장", "사이트 정보구조와 콘텐츠 최종 정리"]
    },
    {
      id: "bitess",
      name: "BITESS",
      client: "RP BIO",
      summary: "프리미엄 성인 구미 신규 브랜드 구축",
      stage: "브랜드 디렉션",
      nextAction: "디렉션 확정 후 BI·패키지 개발 진행",
      status: "active",
      priority: "focus",
      imageUrl: "",
      workstreams: ["브랜드 전략", "비주얼 디렉션", "컬러 시스템", "BI 개발", "패키지 디자인", "제품·SNS 비주얼"],
      nextSteps: ["브랜드 디렉션 확정", "BI 개발", "패키지 시스템 전개"]
    },
    {
      id: "orient",
      name: "오리엔트그룹",
      client: "오리엔트그룹",
      summary: "브랜드 전략부터 웹·영업자료까지 통합 구축",
      stage: "전략·네이밍",
      nextAction: "사업내용 정리 → 전략 → 네이밍 순차 진행",
      status: "active",
      priority: "focus",
      imageUrl: "",
      workstreams: ["사업내용 정리", "브랜드 전략", "네이밍", "브랜드 디렉션", "BI 개발", "비주얼 시스템", "웹사이트", "회사소개서·영업자료"],
      nextSteps: ["사업내용 정리", "전략 구조 확정", "네이밍 제안"]
    },
    {
      id: "ggm",
      name: "건강미",
      client: "건강미",
      summary: "브랜드·Cafe24·프로모션 월간 운영",
      stage: "상시 운영",
      nextAction: "프로모션·상품등록·쇼핑몰 운영 요청 처리",
      status: "active",
      priority: "focus",
      imageUrl: "",
      workstreams: ["월간 프로모션", "Cafe24 쇼핑몰 운영", "상품 등록·수정", "배송·교환·환불 UX", "지점·브랜드 디자인"],
      nextSteps: ["운영 이슈 우선순위 처리", "다음 프로모션 소재 준비"]
    },
    {
      id: "ririm",
      name: "리림",
      client: "리림",
      summary: "브랜드 웹사이트 구축 및 콘텐츠 정리",
      stage: "사이트 마무리",
      nextAction: "전체 페이지 레이아웃·헤더·콘텐츠 QA",
      status: "review",
      priority: "normal",
      imageUrl: "",
      workstreams: ["홈·어바웃 구성", "브랜드 소개 페이지", "헤더·내비게이션 통일", "지도·지점 정보", "전체 반응형 QA"],
      nextSteps: ["페이지별 깨짐 점검", "레이아웃 통일", "오픈 전 최종 QA"]
    },
    {
      id: "aminternational",
      name: "AM International",
      client: "AM International",
      summary: "기업 BI 및 로고 개발",
      stage: "로고 개발",
      nextAction: "영문 로고 디렉션 확정 및 후속안 정리",
      status: "active",
      priority: "normal",
      imageUrl: "",
      workstreams: ["영문 로고 개발", "타이포그래피 방향", "기본 BI 정리", "후속 응용안"],
      nextSteps: ["로고 방향 확정", "최종안 및 기본 사용안 정리"]
    },
    {
      id: "esencia",
      name: "ESEN’CIA",
      client: "ESEN’CIA",
      summary: "Shopify 상품·스토어 구축",
      stage: "상품 등록",
      nextAction: "제품별 설명과 Product organization 입력",
      status: "active",
      priority: "normal",
      imageUrl: "",
      workstreams: ["제품명·기본정보 정리", "Product Description", "Product organization", "스토어 상품 등록", "상품군 구조 정리"],
      nextSteps: ["제품별 데이터 입력", "상품군별 정렬 및 스토어 QA"]
    }
  ];

  const DEFAULT_BUSINESSES = [
    {
      id: "nineworks",
      name: "9WORKS",
      label: "DESIGN & BRANDING",
      summary: "기업·브랜드의 전략, 아이덴티티, 패키지, 웹과 운영 디자인을 수행하는 디자인 사업.",
      imageUrl: "",
      workstreams: ["브랜드 전략 및 디자인 컨설팅", "BI·CI·패키지", "웹사이트·상세페이지", "클라이언트 운영 디자인", "PRINTING 사업 확장"]
    },
    {
      id: "aesost",
      name: "AESOST",
      label: "WEB & DEVELOPMENT",
      summary: "회사 홈페이지부터 업무 시스템까지 구축하는 웹·비즈니스 시스템 개발 사업.",
      imageUrl: "",
      workstreams: ["기업 홈페이지 개발", "관리자·CRM 시스템", "업무 자동화", "내부 도구 개발", "AI 기능 연계"]
    },
    {
      id: "aesost-place",
      name: "AESOST PLACE",
      label: "PROPERTY & SPACE",
      summary: "상가 임대와 공간 운영을 중심으로 향후 경매·부동산 자산 운영까지 확장하는 사업.",
      imageUrl: "",
      workstreams: ["상가 임대 관리", "관리비·임대료 운영", "공간 자산 관리", "향후 경매·부동산 투자 체계화"]
    },
    {
      id: "solarbiz",
      name: "SOLARBIZ",
      label: "SMALL BUSINESS TOOL",
      summary: "1인 자영업자와 소기업을 위한 매출·세금계산서·운영관리 서비스.",
      imageUrl: "",
      workstreams: ["매출 기록", "세금계산서 정리", "PDF 자동 분류", "비용·미수금 관리", "사업 운영 대시보드"]
    },
    {
      id: "growfarmers",
      name: "GROW FARMERS",
      label: "LOCAL & AGRI BRANDING",
      summary: "농산물·농가를 브랜드 전략, 패키지, 콘텐츠와 판매 기회로 연결하는 로컬 브랜딩 사업.",
      imageUrl: "",
      workstreams: ["생산자 분석", "브랜드 전략", "아이덴티티·패키지", "콘텐츠 제작", "농가·협업 연결"]
    },
    {
      id: "jeongwol",
      name: "정월재",
      label: "FORTUNE SERVICE",
      summary: "오늘의 운세, 인연, 궁합, 재물, 부적 등 콘텐츠를 보다 쉽고 재미있게 제공하는 자체 서비스.",
      imageUrl: "",
      workstreams: ["오늘의 운세 UX", "운세 문장·콘텐츠", "결과 화면 구조", "정월부적·정월록", "서비스 기능 개선"]
    }
  ];

  const STATUS = {
    active: { label: "진행중", cls: "is-active" },
    review: { label: "검수중", cls: "is-review" },
    waiting: { label: "대기", cls: "is-waiting" },
    done: { label: "완료", cls: "is-done" },
    hold: { label: "보류", cls: "is-hold" }
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
  let businesses = [...DEFAULT_BUSINESSES];
  let clients = [];
  let currentMode = "projects";
  let currentFilter = "open";
  let editingId = null;
  let detailType = "project";
  let detailId = null;
  let unsubscribeProjects = null;
  let unsubscribeClients = null;

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
    nav.querySelector('[data-route="mypage"]')?.remove();

    let work = nav.querySelector('[data-route="work"]');
    if (!work) {
      work = document.createElement("button");
      work.type = "button";
      work.className = "nav-link";
      work.dataset.route = "work";
      work.textContent = "내 업무";
      nav.prepend(work);
    }

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
    ["work", "calendar", "finance", "clients", "requests", "sales"].forEach((route) => {
      const item = nav.querySelector(`[data-route="${route}"]`);
      if (item) nav.appendChild(item);
    });
    const finance = $("#financeNavButton");
    if (finance) finance.textContent = "자금 · 계약";
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
          <p class="eyebrow">MY WORK</p>
          <h1>내 업무</h1>
          <p>클라이언트 프로젝트와 자체 사업을 분리해 현재 진행상황과 다음 할 일을 관리합니다.</p>
        </div>
        <button id="workDashboardAdd" class="button button--primary" type="button">＋ 프로젝트 추가</button>
      </section>

      <div class="work-mode-tabs" role="tablist" aria-label="업무 구분">
        <button class="is-active" type="button" data-work-mode="projects">클라이언트 업무 <span id="projectModeCount">0</span></button>
        <button type="button" data-work-mode="businesses">내 사업체 <span id="businessModeCount">0</span></button>
      </div>

      <section id="projectWorkspace">
        <section class="work-summary-grid" aria-label="프로젝트 요약">
          <button class="work-summary-card is-selected" type="button" data-work-filter="open"><span>진행 프로젝트</span><strong id="workSummaryOpen">0</strong><small>완료 제외 전체</small></button>
          <button class="work-summary-card" type="button" data-work-filter="focus"><span>집중 관리</span><strong id="workSummaryFocus">0</strong><small>지금 우선 확인</small></button>
          <button class="work-summary-card" type="button" data-work-filter="review"><span>검수 필요</span><strong id="workSummaryReview">0</strong><small>마무리·확인 단계</small></button>
          <button class="work-summary-card" type="button" data-work-filter="waiting"><span>대기</span><strong id="workSummaryWaiting">0</strong><small>회신·착수 대기</small></button>
          <button class="work-summary-card" type="button" data-work-filter="deadline"><span>마감 일정</span><strong id="workSummaryDeadline">0</strong><small>21일 이내</small></button>
        </section>

        <section class="panel work-card-panel">
          <div class="work-project-toolbar">
            <div>
              <h2>프로젝트 업무 현황</h2>
              <p>이미지와 핵심 설명으로 훑어보고, 카드를 눌러 상세 업무를 확인합니다.</p>
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
          <div id="workProjectGrid" class="work-project-grid"></div>
        </section>
      </section>

      <section id="businessWorkspace" hidden>
        <section class="panel work-card-panel">
          <div class="work-project-toolbar">
            <div>
              <h2>내 사업체</h2>
              <p>클라이언트 업무와 분리해서 직접 운영하는 사업과 서비스를 정리합니다.</p>
            </div>
          </div>
          <div id="workBusinessGrid" class="work-business-grid"></div>
        </section>
      </section>
    `;

    const calendar = $("#calendarPage");
    if (calendar) calendar.insertAdjacentElement("beforebegin", page);
    else content.prepend(page);

    $("#calendarPage")?.classList.remove("is-active");
    $$(".main-nav .nav-link").forEach((link) => link.classList.toggle("is-active", link.dataset.route === "work"));
  }

  function createEditModal() {
    if ($("#workProjectModal")) return;
    const backdrop = document.createElement("div");
    backdrop.id = "workProjectBackdrop";
    backdrop.className = "work-project-backdrop";
    backdrop.hidden = true;

    const modal = document.createElement("section");
    modal.id = "workProjectModal";
    modal.className = "work-project-modal";
    modal.hidden = true;
    modal.innerHTML = `
      <div class="work-project-modal__head">
        <div><p class="eyebrow">PROJECT</p><h2 id="workProjectModalTitle">프로젝트 수정</h2></div>
        <button class="work-project-modal__close" type="button" data-work-modal-close>×</button>
      </div>
      <form id="workProjectForm" class="work-project-form">
        <input id="workProjectId" type="hidden" />
        <div class="work-project-form-grid">
          <label><span>프로젝트명 *</span><input id="workProjectName" required /></label>
          <label><span>클라이언트 *</span><input id="workProjectClient" list="workProjectClientOptions" required /><datalist id="workProjectClientOptions"></datalist></label>
        </div>
        <label><span>대표 이미지 URL</span><input id="workProjectImage" type="url" placeholder="이미지 주소를 입력하면 카드에 표시됩니다." /></label>
        <label><span>간략 내용</span><input id="workProjectSummary" /></label>
        <div class="work-project-form-grid">
          <label><span>현재 단계</span><input id="workProjectStage" /></label>
          <label><span>마감일</span><input id="workProjectDue" type="date" /></label>
        </div>
        <label><span>지금 해야 할 일 *</span><textarea id="workProjectNextAction" rows="3" required></textarea></label>
        <label><span>진행 업무 <small>한 줄에 하나씩</small></span><textarea id="workProjectWorkstreams" rows="6"></textarea></label>
        <label><span>다음 단계 <small>한 줄에 하나씩</small></span><textarea id="workProjectNextSteps" rows="4"></textarea></label>
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

  function createDetailDrawer() {
    if ($("#workDetailDrawer")) return;
    const backdrop = document.createElement("div");
    backdrop.id = "workDetailBackdrop";
    backdrop.className = "work-detail-backdrop";
    backdrop.hidden = true;

    const drawer = document.createElement("aside");
    drawer.id = "workDetailDrawer";
    drawer.className = "work-detail-drawer";
    drawer.setAttribute("aria-hidden", "true");
    drawer.innerHTML = `
      <div class="work-detail-head">
        <div><p id="workDetailEyebrow" class="eyebrow">PROJECT</p><h2 id="workDetailTitle"></h2></div>
        <button class="work-detail-close" type="button" data-work-detail-close>×</button>
      </div>
      <div id="workDetailContent" class="work-detail-content"></div>
    `;
    document.body.append(backdrop, drawer);
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
    if (diff === null) return "일정 미정";
    if (diff === 0) return "D-DAY";
    if (diff > 0) return `D-${diff}`;
    return `${Math.abs(diff)}일 지연`;
  }

  function isDeadline(project) {
    const diff = daysUntil(project.due);
    return diff !== null && diff >= 0 && diff <= 21 && project.status !== "done";
  }

  function splitLines(value) {
    return String(value || "").split("\n").map((v) => v.trim()).filter(Boolean);
  }

  function mergeDefault(project) {
    const id = project.id === "terracl" ? "terrasave" : project.id;
    const preset = DEFAULT_PROJECTS.find((item) => item.id === id) || {};
    return {
      ...preset,
      ...project,
      id,
      name: id === "terrasave" ? "TerraSave" : (project.name || preset.name || ""),
      client: id === "terrasave" ? "테라세이브" : (project.client || preset.client || ""),
      workstreams: Array.isArray(project.workstreams) && project.workstreams.length ? project.workstreams : (preset.workstreams || []),
      nextSteps: Array.isArray(project.nextSteps) && project.nextSteps.length ? project.nextSteps : (preset.nextSteps || [])
    };
  }

  function sanitizeProjects(list) {
    const normalized = (Array.isArray(list) ? list : []).map(mergeDefault).filter((item) => !SELF_PROJECT_IDS.has(item.id));
    const byId = new Map(normalized.map((item) => [item.id, item]));
    DEFAULT_PROJECTS.forEach((preset) => {
      if (!byId.has(preset.id)) byId.set(preset.id, preset);
    });
    return [...byId.values()];
  }

  function visibleProjects() {
    const q = ($("#workProjectSearch")?.value || "").trim().toLowerCase();
    return projects.filter((project) => {
      const haystack = `${project.name} ${project.client} ${project.summary} ${project.stage} ${project.nextAction}`.toLowerCase();
      if (q && !haystack.includes(q)) return false;
      if (currentFilter === "all") return true;
      if (currentFilter === "focus") return project.priority === "focus" && project.status !== "done";
      if (currentFilter === "review") return project.status === "review";
      if (currentFilter === "waiting") return project.status === "waiting";
      if (currentFilter === "deadline") return isDeadline(project);
      return project.status !== "done" && project.status !== "hold";
    });
  }

  function visualMarkup(item, type) {
    if (item.imageUrl) {
      return `<div class="work-card-media"><img src="${esc(item.imageUrl)}" alt="${esc(item.name)} 대표 이미지" loading="lazy" /></div>`;
    }
    const short = type === "business" ? (item.label || "OWN BUSINESS") : (item.client || "PROJECT");
    return `<div class="work-card-media work-card-media--fallback"><span>${esc(short)}</span><strong>${esc(item.name)}</strong></div>`;
  }

  function projectCard(project) {
    const status = STATUS[project.status] || STATUS.active;
    return `
      <article class="work-project-card" data-work-open="project:${esc(project.id)}">
        ${visualMarkup(project, "project")}
        <div class="work-project-card__body">
          <div class="work-project-card__meta"><span>${esc(project.client)}</span><span class="work-status ${status.cls}">${esc(status.label)}</span></div>
          <h3>${esc(project.name)}</h3>
          <p>${esc(project.summary || "—")}</p>
          <div class="work-project-card__stage"><span>현재 단계</span><strong>${esc(project.stage || "—")}</strong></div>
          <div class="work-project-card__next"><span>지금 해야 할 일</span><strong>${esc(project.nextAction || "할 일을 입력하세요.")}</strong></div>
          <div class="work-project-card__footer"><span>${esc(dueText(project))}</span><button type="button" data-work-open="project:${esc(project.id)}">상세 보기 →</button></div>
        </div>
      </article>
    `;
  }

  function businessCard(item) {
    return `
      <article class="work-project-card work-business-card" data-work-open="business:${esc(item.id)}">
        ${visualMarkup(item, "business")}
        <div class="work-project-card__body">
          <div class="work-project-card__meta"><span>${esc(item.label || "OWN BUSINESS")}</span><span class="work-own-badge">자체 운영</span></div>
          <h3>${esc(item.name)}</h3>
          <p>${esc(item.summary)}</p>
          <div class="work-business-preview">
            ${(item.workstreams || []).slice(0, 3).map((work) => `<span>${esc(work)}</span>`).join("")}
          </div>
          <div class="work-project-card__footer"><span>직접 운영</span><button type="button" data-work-open="business:${esc(item.id)}">사업 보기 →</button></div>
        </div>
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
    $("#projectModeCount").textContent = String(projects.length);
    $("#businessModeCount").textContent = String(businesses.length);

    $$("[data-work-filter]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.workFilter === currentFilter);
      button.classList.toggle("is-selected", button.dataset.workFilter === currentFilter);
    });
  }

  function renderProjects() {
    const grid = $("#workProjectGrid");
    const list = visibleProjects();
    if (grid) grid.innerHTML = list.length ? list.map(projectCard).join("") : '<p class="work-empty">조건에 맞는 프로젝트가 없습니다.</p>';
  }

  function renderBusinesses() {
    const grid = $("#workBusinessGrid");
    if (grid) grid.innerHTML = businesses.map(businessCard).join("");
  }

  function renderMode() {
    $("#projectWorkspace").hidden = currentMode !== "projects";
    $("#businessWorkspace").hidden = currentMode !== "businesses";
    $("#workDashboardAdd").hidden = currentMode !== "projects";
    $$("[data-work-mode]").forEach((button) => button.classList.toggle("is-active", button.dataset.workMode === currentMode));
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
    renderBusinesses();
    renderMode();
    renderClientOptions();
  }

  function openDetail(type, id) {
    detailType = type;
    detailId = id;
    const item = type === "business"
      ? businesses.find((entry) => entry.id === id)
      : projects.find((entry) => entry.id === id);
    if (!item) return;

    $("#workDetailEyebrow").textContent = type === "business" ? "OWN BUSINESS" : esc(item.client || "PROJECT");
    $("#workDetailTitle").textContent = item.name;

    const workstreams = Array.isArray(item.workstreams) ? item.workstreams : [];
    const nextSteps = type === "project" && Array.isArray(item.nextSteps) ? item.nextSteps : [];
    const status = type === "project" ? (STATUS[item.status] || STATUS.active) : null;

    $("#workDetailContent").innerHTML = `
      ${visualMarkup(item, type)}
      <section class="work-detail-intro">
        <div class="work-detail-tags">
          ${type === "project" ? `<span>${esc(item.client)}</span><span class="work-status ${status.cls}">${esc(status.label)}</span><span>${esc(dueText(item))}</span>` : `<span>${esc(item.label)}</span><span class="work-own-badge">자체 운영</span>`}
        </div>
        <p>${esc(item.summary || "")}</p>
      </section>

      ${type === "project" ? `
      <section class="work-detail-section">
        <div class="work-detail-section__title"><span>01</span><h3>현재 상태</h3></div>
        <div class="work-detail-status-grid">
          <div><span>현재 단계</span><strong>${esc(item.stage || "—")}</strong></div>
          <div><span>지금 해야 할 일</span><strong>${esc(item.nextAction || "—")}</strong></div>
        </div>
      </section>` : ""}

      <section class="work-detail-section">
        <div class="work-detail-section__title"><span>${type === "project" ? "02" : "01"}</span><h3>진행 업무</h3></div>
        <div class="work-detail-worklist">
          ${workstreams.length ? workstreams.map((work, index) => `<div><span>${String(index + 1).padStart(2, "0")}</span><strong>${esc(work)}</strong></div>`).join("") : "<p>등록된 업무가 없습니다.</p>"}
        </div>
      </section>

      ${type === "project" ? `
      <section class="work-detail-section">
        <div class="work-detail-section__title"><span>03</span><h3>다음 단계</h3></div>
        <div class="work-detail-worklist is-next">
          ${nextSteps.length ? nextSteps.map((work, index) => `<div><span>${String(index + 1).padStart(2, "0")}</span><strong>${esc(work)}</strong></div>`).join("") : "<p>등록된 다음 단계가 없습니다.</p>"}
        </div>
      </section>

      <section class="work-detail-actions">
        <button class="button button--ghost" type="button" data-work-client="${esc(item.client)}">클라이언트 보기</button>
        <button class="button button--primary" type="button" data-work-edit="${esc(item.id)}">프로젝트 수정</button>
      </section>` : ""}
    `;

    $("#workDetailBackdrop").hidden = false;
    $("#workDetailDrawer").classList.add("is-open");
    $("#workDetailDrawer").setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeDetail() {
    $("#workDetailBackdrop").hidden = true;
    $("#workDetailDrawer").classList.remove("is-open");
    $("#workDetailDrawer").setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    detailId = null;
  }

  function openModal(id = "") {
    closeDetail();
    editingId = id;
    const project = projects.find((item) => item.id === id) || {
      id: "", name: "", client: "", summary: "", stage: "", nextAction: "", due: "", dueLabel: "",
      status: "active", priority: "normal", imageUrl: "", workstreams: [], nextSteps: []
    };

    $("#workProjectModalTitle").textContent = id ? "프로젝트 수정" : "프로젝트 추가";
    $("#workProjectId").value = project.id || "";
    $("#workProjectName").value = project.name || "";
    $("#workProjectClient").value = project.client || "";
    $("#workProjectImage").value = project.imageUrl || "";
    $("#workProjectSummary").value = project.summary || "";
    $("#workProjectStage").value = project.stage || "";
    $("#workProjectNextAction").value = project.nextAction || "";
    $("#workProjectDue").value = project.due || "";
    $("#workProjectDueLabel").value = project.dueLabel || "";
    $("#workProjectStatus").value = project.status || "active";
    $("#workProjectPriority").value = project.priority || "normal";
    $("#workProjectWorkstreams").value = (project.workstreams || []).join("\n");
    $("#workProjectNextSteps").value = (project.nextSteps || []).join("\n");
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

  async function persist(nextProjects, nextBusinesses = businesses) {
    if (!api || !currentUser) throw new Error("로그인이 필요합니다.");
    await api.setDoc(api.doc(api.db, "meta", DASHBOARD_DOC), {
      projects: nextProjects,
      businesses: nextBusinesses,
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
      imageUrl: $("#workProjectImage").value.trim(),
      summary: $("#workProjectSummary").value.trim(),
      stage: $("#workProjectStage").value.trim(),
      nextAction: $("#workProjectNextAction").value.trim(),
      due: $("#workProjectDue").value,
      dueLabel: $("#workProjectDueLabel").value.trim(),
      status: $("#workProjectStatus").value,
      priority: $("#workProjectPriority").value,
      workstreams: splitLines($("#workProjectWorkstreams").value),
      nextSteps: splitLines($("#workProjectNextSteps").value),
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
    closeDetail();
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
    $("#workDetailBackdrop")?.addEventListener("click", closeDetail);

    document.addEventListener("click", (event) => {
      const mode = event.target.closest("[data-work-mode]");
      if (mode) {
        currentMode = mode.dataset.workMode || "projects";
        renderMode();
        return;
      }

      const filter = event.target.closest("[data-work-filter]");
      if (filter) {
        currentFilter = filter.dataset.workFilter || "open";
        renderAll();
        return;
      }

      const edit = event.target.closest("[data-work-edit]");
      if (edit) {
        event.stopPropagation();
        openModal(edit.dataset.workEdit);
        return;
      }

      const client = event.target.closest("[data-work-client]");
      if (client) {
        event.stopPropagation();
        openClient(client.dataset.workClient);
        return;
      }

      const open = event.target.closest("[data-work-open]");
      if (open) {
        const [type, id] = String(open.dataset.workOpen || "").split(":");
        openDetail(type, id);
        return;
      }

      if (event.target.closest("[data-work-modal-close]")) closeModal();
      if (event.target.closest("[data-work-detail-close]")) closeDetail();
    }, true);

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (!$("#workProjectModal")?.hidden) closeModal();
      if ($("#workDetailDrawer")?.classList.contains("is-open")) closeDetail();
    });
  }

  function subscribe(user) {
    unsubscribeProjects?.();
    unsubscribeClients?.();
    currentUser = user;

    if (!user || !api) {
      projects = [...DEFAULT_PROJECTS];
      businesses = [...DEFAULT_BUSINESSES];
      renderAll();
      return;
    }

    const ref = api.doc(api.db, "meta", DASHBOARD_DOC);
    unsubscribeProjects = api.onSnapshot(ref, async (snapshot) => {
      const data = snapshot.exists() ? snapshot.data() : {};
      const nextProjects = sanitizeProjects(data.projects);
      const nextBusinesses = Array.isArray(data.businesses) && data.businesses.length ? data.businesses : DEFAULT_BUSINESSES;
      projects = nextProjects;
      businesses = nextBusinesses;
      renderAll();

      const storedIds = Array.isArray(data.projects) ? data.projects.map((item) => item.id) : [];
      const needsMigration = !snapshot.exists()
        || storedIds.some((id) => SELF_PROJECT_IDS.has(id) || id === "terracl")
        || !Array.isArray(data.businesses)
        || data.businesses.length === 0;

      if (needsMigration) {
        try {
          await api.setDoc(ref, {
            projects: nextProjects,
            businesses: nextBusinesses,
            updatedAt: api.serverTimestamp(),
            updatedBy: user.uid
          }, { merge: true });
        } catch (error) {
          console.warn("업무 대시보드 마이그레이션 실패", error);
        }
      }
    }, (error) => {
      console.warn("프로젝트 대시보드 동기화 실패", error);
      projects = [...DEFAULT_PROJECTS];
      businesses = [...DEFAULT_BUSINESSES];
      renderAll();
    });

    unsubscribeClients = api.onSnapshot(api.collection(api.db, "clients"), (snapshot) => {
      clients = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      renderClientOptions();
    }, (error) => console.warn("클라이언트 연동 실패", error));
  }

  function connectFirebase() {
    api = window.NineworksFirebase;
    if (!api) return setTimeout(connectFirebase, 60);
    api.onAuthStateChanged(api.auth, subscribe);
  }

  function observeFinance() {
    reorderNav();
    const observer = new MutationObserver(reorderNav);
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 5000);
  }

  function init() {
    injectStyle();
    createNav();
    createPage();
    createEditModal();
    createDetailDrawer();
    bindUi();
    renderAll();
    observeFinance();
    queueMicrotask(connectFirebase);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
