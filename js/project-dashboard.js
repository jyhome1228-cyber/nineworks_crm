(() => {
  "use strict";

  const VERSION = "20261002-1";
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
      nextSteps: ["10/16 결과보고 제출", "보완 요청 발생 시 후속 대응"],
      recentWork: ["결과보고 일정 10/16 확정", "현재 산출물과 증빙자료 기준으로 보고 범위 정리"],
      workSections: [
        { title: "결과보고", items: ["수행내용 요약", "성과 및 산출물 정리", "결과보고 문서 구성"] },
        { title: "증빙자료", items: ["디자인 산출물 취합", "진행 과정 자료 정리", "필요 증빙 누락 여부 체크"] },
        { title: "제출", items: ["최종 문서 검수", "10/16 제출", "보완 요청 대응"] }
      ]
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
      nextSteps: ["다음 공동구매 일정 확인", "필요 소재 및 상품정보 선반영"],
      recentWork: ["월·목 정기 공동구매 운영 체계로 관리", "상품·프로모션 소재를 일정에 맞춰 반복 제작"],
      workSections: [
        { title: "정기 공동구매", items: ["월요일 공구 작업", "목요일 공구 작업", "행사별 일정·상품 확인"] },
        { title: "상품 운영", items: ["상품 정보 반영", "상세페이지 수정", "프로모션 배너·콘텐츠 제작"] },
        { title: "사이트 운영", items: ["페이지 수정 요청", "상품 노출 확인", "행사 종료 후 원복·정리"] }
      ]
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
      nextSteps: ["후속 요청 우선순위 정리", "브랜드 톤 일관성 점검"],
      recentWork: ["실버·라이트 옐로우·라이트 블루 중심 비주얼 방향 정리", "제품 연출 및 용기 비주얼 작업 진행"],
      workSections: [
        { title: "브랜드 비주얼", items: ["컬러·타이포 톤 유지", "제품별 비주얼 시스템", "브랜드 카피 적용"] },
        { title: "패키지", items: ["용기·라벨 디자인", "제품군 일관성 체크", "응용 시안 제작"] },
        { title: "운영 콘텐츠", items: ["상세페이지", "프로모션 이미지", "제품 연출 이미지"] }
      ]
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
      nextSteps: ["과일 DB 범위 확장", "사이트 정보구조와 콘텐츠 최종 정리"],
      recentWork: ["TerraSave 명칭 기준으로 프로젝트 정리", "과일 이미지·정보 DB를 서비스 콘텐츠와 연결하는 구조 설계"],
      workSections: [
        { title: "과일 DB", items: ["50~60종 과일 데이터 구축", "클라이맥테릭 여부", "에틸렌 발생·민감도", "처리 방법·권장사항·참고자료"] },
        { title: "브랜드 콘텐츠", items: ["과일 보호망 솔루션 설명", "서비스 장점 구조화", "제품·기술 정보 시각화"] },
        { title: "웹사이트", items: ["과일별 정보 페이지", "DB 탐색 구조", "사이트 UI·콘텐츠 개선"] }
      ]
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
      nextSteps: ["브랜드 디렉션 확정", "BI 개발", "패키지 시스템 전개"],
      recentWork: ["기존 7개 디렉션을 재정리해 적색 중심 브랜드 시스템으로 압축", "성인 프리미엄 구미 포지셔닝과 패키지 무드 구체화"],
      workSections: [
        { title: "브랜드 전략", items: ["성인 프리미엄 구미 포지셔닝", "여성 타깃이지만 전형적 뷰티 무드 지양", "전문성 + 감각성 균형"] },
        { title: "비주얼 디렉션", items: ["메인 레드·버건디 시스템", "볼드 타이포그래피", "과학적·하이엔드 무드", "촬영·SNS 톤 통합"] },
        { title: "BI / 패키지", items: ["BITESS 로고·BI 개발", "멀티비타민 히어로 제품", "제품군 컬러 확장", "이중구조 제형 시각화"] },
        { title: "브랜드 운영", items: ["무드보드", "패키지 목업", "제품 비주얼", "SNS 콘텐츠 시스템"] }
      ]
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
      nextSteps: ["사업내용 정리", "전략 구조 확정", "네이밍 제안"],
      recentWork: ["선금·계약 관련 착수 행정 진행", "전체 작업 순서를 사업정리부터 영업자료까지 단계화"],
      workSections: [
        { title: "1. 사업·전략", items: ["사업내용 정리", "서비스 구조화", "브랜드 전략 수립"] },
        { title: "2. 브랜드 개발", items: ["네이밍 제안", "브랜드 디렉션", "BI 개발"] },
        { title: "3. 비주얼 시스템", items: ["필요 이미지 제작", "응용디자인", "브랜드 사용 체계"] },
        { title: "4. 웹 구축", items: ["랜딩형 페이지", "서비스 전용 페이지", "브랜드 시스템과 병행 개발"] },
        { title: "5. 영업자료", items: ["회사소개서", "영업자료", "전체 산출물 최종 체크"] }
      ]
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
      nextSteps: ["운영 이슈 우선순위 처리", "다음 프로모션 소재 준비"],
      recentWork: ["10월 프로모션 배너 및 지점 운영물 제작", "Cafe24 상품·배송·취소/환불 UX 관련 운영 이슈 대응"],
      workSections: [
        { title: "프로모션", items: ["월간 프로모션 기획 반영", "배너·SNS 소재", "지점별 프로모션 운영물"] },
        { title: "Cafe24", items: ["상품 등록·수정", "옵션·가격 노출", "배송·송장", "취소·교환·반품·환불 흐름"] },
        { title: "브랜드 운영", items: ["프로그램 대표 이미지", "지점 페이지", "멤버십·정책 문안", "상담·로그인 연동 이슈"] }
      ]
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
      nextSteps: ["페이지별 깨짐 점검", "레이아웃 통일", "오픈 전 최종 QA"],
      recentWork: ["홈·어바웃·지도 디자인과 브랜드 페이지 구조를 지속 수정", "저널·샵·브랜드 소개 페이지를 레퍼런스 기준으로 재정리"],
      workSections: [
        { title: "홈 / 어바웃", items: ["브랜드 소개 콘텐츠", "브랜드를 만든 이유와 방향", "메인 이미지·슬라이드 구성"] },
        { title: "콘텐츠 페이지", items: ["저널 리스트", "샵 상품 노출", "브랜드 소개 이미지 롤링"] },
        { title: "공통 UI", items: ["헤더 크기·정렬 통일", "드롭다운 안정화", "폰트·여백 위계"] },
        { title: "지도 / QA", items: ["지도 톤앤매너 개선", "페이지별 레이아웃 깨짐 점검", "모바일 반응형 최종 확인"] }
      ]
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
      nextSteps: ["로고 방향 확정", "최종안 및 기본 사용안 정리"],
      recentWork: ["AM INTERNATIONAL 영문 워드마크 방향으로 로고 시안 개발", "선금 관련 자료와 계산서 발행 절차도 함께 진행"],
      workSections: [
        { title: "BI 개발", items: ["AM INTERNATIONAL 워드마크", "산세리프 기반 타이포 방향", "대안 시안 비교"] },
        { title: "최종 정리", items: ["최종 로고 선택", "기본 비율·여백 정리", "기본 응용안"] },
        { title: "프로젝트 운영", items: ["선금 요청 자료", "계산서 발행", "후속 제작 범위 확인"] }
      ]
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
      nextSteps: ["제품별 데이터 입력", "상품군별 정렬 및 스토어 QA"],
      recentWork: ["인도 Shopify 스토어용 제품군과 입력 항목 정리", "토너·클렌저 등 제품별 Description 작성 진행"],
      workSections: [
        { title: "상품 데이터", items: ["제품명", "가격", "핵심 설명 3~4줄", "용량·기본정보"] },
        { title: "Shopify 입력", items: ["Title", "Product Description", "Product organization", "제품군·태그·분류"] },
        { title: "스토어 QA", items: ["상품 정렬", "제품군 구조", "정보 누락 체크", "페이지 노출 확인"] }
      ]
    }
  ];

  const DEFAULT_BUSINESSES = [
    {
      id: "nineworks",
      name: "9WORKS",
      label: "DESIGN & BRANDING",
      summary: "기업·브랜드의 전략, 아이덴티티, 패키지, 웹과 운영 디자인을 수행하는 디자인 사업.",
      imageUrl: "",
      workstreams: ["브랜드 전략 및 디자인 컨설팅", "BI·CI·패키지", "웹사이트·상세페이지", "클라이언트 운영 디자인", "PRINTING 사업 확장"],
      workSections: [
        { title: "브랜딩", items: ["브랜드 전략", "BI·CI", "패키지", "비주얼 시스템"] },
        { title: "디지털", items: ["웹사이트 기획·디자인", "상세페이지", "브랜드 콘텐츠", "운영 디자인"] },
        { title: "컨설팅", items: ["사업·브랜드 구조화", "실무 프로세스 설계", "외주·지원사업 대응"] },
        { title: "확장 사업", items: ["NINEWORKS PRINTING", "프로젝트 운영 시스템", "AI 기반 제작 워크플로"] }
      ]
    },
    {
      id: "aesost",
      name: "AESOST",
      label: "WEB & DEVELOPMENT",
      summary: "회사 홈페이지부터 업무 시스템까지 구축하는 웹·비즈니스 시스템 개발 사업.",
      imageUrl: "",
      workstreams: ["기업 홈페이지 개발", "관리자·CRM 시스템", "업무 자동화", "내부 도구 개발", "AI 기능 연계"],
      workSections: [
        { title: "웹 개발", items: ["기업·브랜드 홈페이지", "랜딩페이지", "관리 페이지", "반응형 구축"] },
        { title: "비즈니스 시스템", items: ["CRM", "클라이언트 포털", "업무관리 시스템", "데이터 대시보드"] },
        { title: "자동화 / AI", items: ["PDF·문서 자동 분류", "업무 자동화", "AI 기능 연계", "내부 생산성 도구"] }
      ]
    },
    {
      id: "aesost-place",
      name: "AESOST PLACE",
      label: "PROPERTY & SPACE",
      summary: "상가 임대와 공간 운영을 중심으로 향후 경매·부동산 자산 운영까지 확장하는 사업.",
      imageUrl: "",
      workstreams: ["상가 임대 관리", "관리비·임대료 운영", "공간 자산 관리", "향후 경매·부동산 투자 체계화"],
      workSections: [
        { title: "임대 운영", items: ["상가 임대", "임대료 일정", "관리비", "계약·갱신 관리"] },
        { title: "자산 관리", items: ["보증금·현금흐름", "공간 유지관리", "운영비 기록"] },
        { title: "확장", items: ["부동산 경매 검토", "추가 자산 확보", "수익형 부동산 운영 체계"] }
      ]
    },
    {
      id: "solarbiz",
      name: "SOLARBIZ",
      label: "SMALL BUSINESS TOOL",
      summary: "1인 자영업자와 소기업을 위한 매출·세금계산서·운영관리 서비스.",
      imageUrl: "",
      workstreams: ["매출 기록", "세금계산서 정리", "PDF 자동 분류", "비용·미수금 관리", "사업 운영 대시보드"],
      workSections: [
        { title: "매출 관리", items: ["카드매출", "일반 매출 기록", "월·분기 매출 현황"] },
        { title: "세금계산서", items: ["PDF 드래그 업로드", "자동 분류", "거래처·매출 연결", "문서 보관"] },
        { title: "운영관리", items: ["비용 기록", "미수금", "사업 일정", "대시보드 요약"] }
      ]
    },
    {
      id: "growfarmers",
      name: "GROW FARMERS",
      label: "LOCAL & AGRI BRANDING",
      summary: "농산물·농가를 브랜드 전략, 패키지, 콘텐츠와 판매 기회로 연결하는 로컬 브랜딩 사업.",
      imageUrl: "",
      workstreams: ["생산자 분석", "브랜드 전략", "아이덴티티·패키지", "콘텐츠 제작", "농가·협업 연결"],
      workSections: [
        { title: "농가 브랜딩", items: ["생산자·상품 분석", "브랜드 전략", "네이밍·아이덴티티", "패키지"] },
        { title: "콘텐츠", items: ["상품 촬영·비주얼", "소개 콘텐츠", "판매용 상세 콘텐츠"] },
        { title: "연결", items: ["농가·협업처 연결", "유통·판매 기회 탐색", "브랜드 운영 지원"] }
      ]
    },
    {
      id: "jeongwol",
      name: "정월재",
      label: "FORTUNE SERVICE",
      summary: "오늘의 운세, 인연, 궁합, 재물, 부적 등 콘텐츠를 보다 쉽고 재미있게 제공하는 자체 서비스.",
      imageUrl: "",
      workstreams: ["오늘의 운세 UX", "운세 문장·콘텐츠", "결과 화면 구조", "정월부적·정월록", "서비스 기능 개선"],
      workSections: [
        { title: "운세 서비스", items: ["오늘의 운세", "내일의 운세", "인연·궁합", "일·재물", "정월도감"] },
        { title: "콘텐츠", items: ["총평", "재물", "애정", "직장", "학업", "건강", "추천 숫자"] },
        { title: "서비스 확장", items: ["정월부적", "정월록", "로또·숫자 뽑기", "결과 화면 UX 개선"] },
        { title: "운영 방향", items: ["랜덤값 최소화", "지정 데이터 기반 결과", "쉽고 재미있는 해석 방식"] }
      ]
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

  function sanitizeBusinesses(list) {
    const source = Array.isArray(list) ? list : [];
    const byId = new Map();
    source.forEach((item) => {
      const preset = DEFAULT_BUSINESSES.find((entry) => entry.id === item.id) || {};
      byId.set(item.id, {
        ...preset,
        ...item,
        workstreams: Array.isArray(item.workstreams) && item.workstreams.length ? item.workstreams : (preset.workstreams || []),
        workSections: Array.isArray(item.workSections) && item.workSections.length ? item.workSections : (preset.workSections || [])
      });
    });
    DEFAULT_BUSINESSES.forEach((preset) => {
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
    return `<div class="work-card-media work-card-media--fallback" data-visual="${esc(item.id || type)}"><span>${esc(short)}</span><strong>${esc(item.name)}</strong><i aria-hidden="true"></i></div>`;
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
    const workSections = Array.isArray(item.workSections) ? item.workSections : [];
    const recentWork = Array.isArray(item.recentWork) ? item.recentWork : [];
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
        <div class="work-detail-section__title"><span>${type === "project" ? "02" : "01"}</span><h3>업무 구조</h3></div>
        ${workSections.length ? `<div class="work-detail-groups">${workSections.map((group) => `
          <div class="work-detail-group">
            <h4>${esc(group.title || "업무")}</h4>
            <div>${(group.items || []).map((work) => `<span>${esc(work)}</span>`).join("")}</div>
          </div>
        `).join("")}</div>` : `<div class="work-detail-worklist">${workstreams.length ? workstreams.map((work, index) => `<div><span>${String(index + 1).padStart(2, "0")}</span><strong>${esc(work)}</strong></div>`).join("") : "<p>등록된 업무가 없습니다.</p>"}</div>`}
      </section>

      ${type === "project" && recentWork.length ? `
      <section class="work-detail-section">
        <div class="work-detail-section__title"><span>03</span><h3>최근 작업</h3></div>
        <div class="work-detail-recent">${recentWork.map((work) => `<p>${esc(work)}</p>`).join("")}</div>
      </section>` : ""}

      ${type === "project" ? `
      <section class="work-detail-section">
        <div class="work-detail-section__title"><span>${recentWork.length ? "04" : "03"}</span><h3>다음 단계</h3></div>
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
      const nextBusinesses = sanitizeBusinesses(data.businesses);
      projects = nextProjects;
      businesses = nextBusinesses;
      renderAll();

      const storedIds = Array.isArray(data.projects) ? data.projects.map((item) => item.id) : [];
      const needsMigration = !snapshot.exists()
        || storedIds.some((id) => SELF_PROJECT_IDS.has(id) || id === "terracl")
        || !Array.isArray(data.businesses)
        || data.businesses.length === 0
        || nextBusinesses.some((item) => !Array.isArray(item.workSections) || item.workSections.length === 0);

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
