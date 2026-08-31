(() => {
  "use strict";

  const REGISTRY_VERSION = "20260831-1";
  const REGISTRY = {
    displayName: "아밍제이",
    aliases: ["아밍제이", "AMINGJ", "AmingJ", "주식회사 에이엠인터내셔널", "에이엠인터내셔널"],
    defaultType: "코스메틱·커머스",
    businessNumber: "272-88-02993",
    corporateRegistrationNumber: "110111-9042641",
    legalName: "주식회사 에이엠인터내셔널",
    representative: "류창호",
    openingDate: "2024-09-01",
    address: "서울특별시 성동구 성수일로12길 26, 907호(성수동2가, 서울숲 코리아IT센터)",
    businessType: "제조업 / 도매 및 소매업",
    businessItem: "화장품 제조업 / 상품 종합 도매업",
    issueDate: "2025-10-22",
    taxOffice: "성동세무서"
  };

  let api = null;
  let currentUser = null;
  let clients = [];
  let unsubscribeClients = null;
  let syncRunning = false;

  const normalize = (value = "") => String(value)
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[()&·.,_-]/g, "");
  const digits = (value = "") => String(value).replace(/\D/g, "");

  function findClient(list) {
    const aliases = REGISTRY.aliases.map(normalize);
    const businessNumber = digits(REGISTRY.businessNumber);
    return list.find((client) => {
      const existingNumber = digits(client.businessNumber || client.businessRegistrationNumber || "");
      if (existingNumber && existingNumber === businessNumber) return true;
      return aliases.includes(normalize(client.name || client.legalName || ""));
    });
  }

  function payload() {
    return {
      businessNumber: REGISTRY.businessNumber,
      businessRegistrationNumber: REGISTRY.businessNumber,
      corporateRegistrationNumber: REGISTRY.corporateRegistrationNumber,
      legalName: REGISTRY.legalName,
      representative: REGISTRY.representative,
      openingDate: REGISTRY.openingDate,
      businessAddress: REGISTRY.address,
      headOfficeAddress: REGISTRY.address,
      businessType: REGISTRY.businessType,
      businessItem: REGISTRY.businessItem,
      businessRegistrationIssueDate: REGISTRY.issueDate,
      taxOffice: REGISTRY.taxOffice,
      businessRegistrationVerified: true,
      businessRegistryVersion: `amingj-${REGISTRY_VERSION}`,
      businessRegistrationSource: "사업자등록증 확인"
    };
  }

  async function syncRegistry() {
    if (!api || !currentUser || syncRunning) return;
    syncRunning = true;
    try {
      const snapshot = await api.getDocs(api.collection(api.db, "clients"));
      const list = snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
      const existing = findClient(list);
      const data = payload();

      if (existing) {
        await api.setDoc(api.doc(api.db, "clients", existing.id), {
          ...data,
          updatedAt: api.serverTimestamp()
        }, { merge: true });
        return;
      }

      const id = `client_biz_${digits(REGISTRY.businessNumber)}`;
      await api.setDoc(api.doc(api.db, "clients", id), {
        id,
        name: REGISTRY.displayName,
        type: REGISTRY.defaultType,
        work: "거래처 등록",
        status: "진행 중",
        member: "박재영",
        progress: "",
        nextAction: "",
        nextCheckDate: "",
        contact: "",
        ...data,
        createdAt: api.serverTimestamp(),
        updatedAt: api.serverTimestamp(),
        createdBy: currentUser.uid
      }, { merge: true });
    } catch (error) {
      console.error("아밍제이 사업자등록 정보 동기화 실패", error);
    } finally {
      syncRunning = false;
    }
  }

  function isAmingjClient(client) {
    if (!client) return false;
    if (digits(client.businessNumber || client.businessRegistrationNumber || "") === digits(REGISTRY.businessNumber)) return true;
    return REGISTRY.aliases.map(normalize).includes(normalize(client.name || client.legalName || ""));
  }

  function businessPanelMarkup(client) {
    const value = (key, fallback = "-") => client?.[key] || fallback;
    return `
      <div class="client-business-panel__head"><strong>사업자등록 정보</strong><span>법인사업자 · 사업자등록증 확인</span></div>
      <div class="client-business-grid">
        <div class="client-business-item"><span>사업자등록번호</span><strong>${value("businessNumber", REGISTRY.businessNumber)}</strong></div>
        <div class="client-business-item"><span>법인등록번호</span><strong>${value("corporateRegistrationNumber", REGISTRY.corporateRegistrationNumber)}</strong></div>
        <div class="client-business-item"><span>법인명</span><strong>${value("legalName", REGISTRY.legalName)}</strong></div>
        <div class="client-business-item"><span>대표자</span><strong>${value("representative", REGISTRY.representative)}</strong></div>
        <div class="client-business-item"><span>개업일</span><strong>${value("openingDate", REGISTRY.openingDate)}</strong></div>
        <div class="client-business-item"><span>발급일</span><strong>${value("businessRegistrationIssueDate", REGISTRY.issueDate)}</strong></div>
        <div class="client-business-item is-wide"><span>사업장 / 본점 주소</span><strong>${value("businessAddress", REGISTRY.address)}</strong></div>
        <div class="client-business-item"><span>업태</span><strong>${value("businessType", REGISTRY.businessType)}</strong></div>
        <div class="client-business-item"><span>종목</span><strong>${value("businessItem", REGISTRY.businessItem)}</strong></div>
        <div class="client-business-item"><span>관할 세무서</span><strong>${value("taxOffice", REGISTRY.taxOffice)}</strong></div>
      </div>`;
  }

  function renderPanel() {
    const modal = document.querySelector("#clientQuickModal");
    if (!modal || modal.hidden) return;
    const id = document.querySelector("#clientQuickId")?.value || "";
    const client = clients.find((item) => item.id === id);
    if (!isAmingjClient(client)) return;

    const grid = modal.querySelector(".crm-form-grid");
    if (!grid) return;
    let panel = modal.querySelector("#clientBusinessPanel");
    if (!panel) {
      panel = document.createElement("section");
      panel.id = "clientBusinessPanel";
      panel.className = "client-business-panel";
      grid.appendChild(panel);
    }
    const markup = businessPanelMarkup(client);
    if (panel.innerHTML !== markup) panel.innerHTML = markup;
  }

  function bindClicks() {
    if (document.documentElement.dataset.amingjRegistryBound === "true") return;
    document.documentElement.dataset.amingjRegistryBound = "true";
    document.addEventListener("click", (event) => {
      if (!event.target.closest("[data-client-progress]")) return;
      window.setTimeout(renderPanel, 140);
    }, true);
  }

  function subscribe() {
    unsubscribeClients?.();
    if (!currentUser) return;
    unsubscribeClients = api.onSnapshot(
      api.collection(api.db, "clients"),
      (snapshot) => {
        clients = snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
        window.setTimeout(renderPanel, 160);
      },
      (error) => console.warn("아밍제이 사업자정보용 클라이언트 구독 실패", error)
    );
  }

  function connect() {
    api = window.NineworksFirebase;
    if (!api?.auth || !api?.db) return window.setTimeout(connect, 80);
    api.onAuthStateChanged(api.auth, async (user) => {
      currentUser = user;
      clients = [];
      unsubscribeClients?.();
      unsubscribeClients = null;
      if (!user) return;
      await syncRegistry();
      subscribe();
    });
  }

  function init() {
    bindClicks();
    connect();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
