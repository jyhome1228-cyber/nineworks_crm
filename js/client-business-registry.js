(() => {
  "use strict";

  const REGISTRY_VERSION = "20260831-2";
  const REGISTRATIONS = [
    {
      displayName: "건강미",
      aliases: ["건강미", "건강미 Spa&Aesthetic", "건강미Spa&Aesthetic"],
      defaultType: "뷰티·에스테틱",
      businessNumber: "418-19-02308",
      legalName: "건강미 Spa&Aesthetic",
      representative: "김정민",
      openingDate: "2024-02-01",
      address: "서울특별시 강남구 선릉로162길 43, 2,3층(청담동)",
      businessType: "서비스업 / 도소매업",
      businessItem: "피부미용 / 전자상거래",
      issueDate: "2024-01-09",
      taxOffice: "강남세무서"
    },
    {
      displayName: "파이토레볼루션",
      aliases: ["파이토레볼루션", "파이토레볼루션(PhytoRevolution)", "PhytoRevolution"],
      defaultType: "연구개발",
      businessNumber: "759-62-00809",
      legalName: "파이토레볼루션(PhytoRevolution)",
      representative: "변호현",
      openingDate: "2026-07-01",
      address: "경기도 고양시 일산동구 중앙로 1036, 고양터미널 4층 5-12호 고양 중장년 기술창업센터(백석동, 베스트 고양터미널)",
      businessType: "서비스업",
      businessItem: "물리, 화학 및 생물학 연구개발업",
      issueDate: "2026-06-29",
      taxOffice: "고양세무서"
    },
    {
      displayName: "선이담",
      aliases: ["선이담"],
      defaultType: "디자인",
      businessNumber: "868-57-00680",
      legalName: "선이담",
      representative: "이인선",
      openingDate: "2025-07-16",
      address: "인천광역시 남동구 남동대로 353, 5층 501호 BI-01호(남촌동, jk루체스타)",
      businessType: "전문, 과학 및 기술서비스업",
      businessItem: "패션, 섬유류 및 기타 전문 디자인업",
      issueDate: "2025-09-02",
      taxOffice: "남동세무서"
    }
  ];

  let api = null;
  let currentUser = null;
  let clients = [];
  let unsubscribeClients = null;
  let syncRunning = false;
  let tableObserver = null;
  let modalObserver = null;

  function normalize(value = "") {
    return String(value)
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[()&·.,_-]/g, "");
  }

  function digits(value = "") {
    return String(value).replace(/\D/g, "");
  }

  function businessPayload(item) {
    return {
      businessNumber: item.businessNumber,
      businessRegistrationNumber: item.businessNumber,
      legalName: item.legalName,
      representative: item.representative,
      openingDate: item.openingDate,
      businessAddress: item.address,
      businessType: item.businessType,
      businessItem: item.businessItem,
      businessRegistrationIssueDate: item.issueDate,
      taxOffice: item.taxOffice,
      businessRegistrationVerified: true,
      businessRegistryVersion: REGISTRY_VERSION,
      businessRegistrationSource: "사업자등록증 확인"
    };
  }

  function findExisting(item, list) {
    const number = digits(item.businessNumber);
    const aliases = item.aliases.map(normalize);
    return list.find((client) => {
      const existingNumber = digits(client.businessNumber || client.businessRegistrationNumber || "");
      if (existingNumber && existingNumber === number) return true;
      return aliases.includes(normalize(client.name || client.legalName || ""));
    });
  }

  async function syncBusinessRegistrations() {
    if (!api || !currentUser || syncRunning) return;
    syncRunning = true;
    try {
      const snapshot = await api.getDocs(api.collection(api.db, "clients"));
      const list = snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));

      for (const item of REGISTRATIONS) {
        const existing = findExisting(item, list);
        const payload = businessPayload(item);

        if (existing) {
          const alreadySynced = existing.businessRegistryVersion === REGISTRY_VERSION
            && digits(existing.businessNumber || existing.businessRegistrationNumber) === digits(item.businessNumber);
          if (!alreadySynced) {
            await api.setDoc(api.doc(api.db, "clients", existing.id), {
              ...payload,
              updatedAt: api.serverTimestamp()
            }, { merge: true });
          }
          continue;
        }

        const id = `client_biz_${digits(item.businessNumber)}`;
        await api.setDoc(api.doc(api.db, "clients", id), {
          id,
          name: item.displayName,
          type: item.defaultType,
          work: "거래처 등록",
          status: "진행 중",
          member: "박재영",
          progress: "",
          nextAction: "",
          nextCheckDate: "",
          contact: "",
          ...payload,
          createdAt: api.serverTimestamp(),
          updatedAt: api.serverTimestamp(),
          createdBy: currentUser.uid
        }, { merge: true });
      }
    } catch (error) {
      console.error("사업자등록 거래처 동기화 실패", error);
    } finally {
      syncRunning = false;
    }
  }

  function injectStyle() {
    if (document.querySelector("#client-business-registry-style")) return;
    const style = document.createElement("style");
    style.id = "client-business-registry-style";
    style.textContent = `
      .client-business-number{display:block;margin-top:4px;color:var(--muted);font-size:10px;font-weight:500;white-space:nowrap}
      .client-business-panel{grid-column:1/-1;margin-top:4px;border:1px solid var(--line-soft);border-radius:10px;padding:14px;background:var(--surface-2)}
      .client-business-panel__head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}
      .client-business-panel__head strong{font-size:12px;color:var(--text)}
      .client-business-panel__head span{font-size:10px;color:var(--muted)}
      .client-business-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 16px}
      .client-business-item{min-width:0}.client-business-item.is-wide{grid-column:1/-1}
      .client-business-item span{display:block;margin-bottom:3px;color:var(--muted);font-size:9.5px;font-weight:650}
      .client-business-item strong{display:block;color:var(--text-soft);font-size:11px;font-weight:550;line-height:1.5;word-break:keep-all}
      html[data-theme="light"] .client-business-panel{border-color:#e3e7ec;background:#f8fafc}
      html[data-theme="light"] .client-business-item strong{color:#344054}
      html[data-theme="light"] .client-business-item span,.client-business-number{color:#667085}
      @media(max-width:620px){.client-business-grid{grid-template-columns:1fr}.client-business-item.is-wide{grid-column:auto}}
    `;
    document.head.appendChild(style);
  }

  function registrationForClient(client) {
    if (!client) return null;
    const number = digits(client.businessNumber || client.businessRegistrationNumber || "");
    return REGISTRATIONS.find((item) => digits(item.businessNumber) === number)
      || REGISTRATIONS.find((item) => item.aliases.map(normalize).includes(normalize(client.name || "")))
      || null;
  }

  function enhanceClientRows() {
    document.querySelectorAll("#clientTableBody tr").forEach((row) => {
      const nameNode = row.querySelector(".client-name");
      if (!nameNode) return;
      const client = clients.find((item) => normalize(item.name) === normalize(nameNode.textContent));
      const businessNumber = client?.businessNumber || client?.businessRegistrationNumber;
      const existingLabel = row.querySelector(".client-business-number");

      if (!businessNumber) {
        existingLabel?.remove();
        return;
      }

      if (existingLabel) {
        const nextText = `사업자 ${businessNumber}`;
        if (existingLabel.textContent !== nextText) existingLabel.textContent = nextText;
        return;
      }

      const label = document.createElement("small");
      label.className = "client-business-number";
      label.textContent = `사업자 ${businessNumber}`;
      nameNode.insertAdjacentElement("afterend", label);
    });
  }

  function businessPanelMarkup(client, registry) {
    const value = (key, fallback = "-") => client[key] || registry[key] || fallback;
    return `
      <div class="client-business-panel__head"><strong>사업자등록 정보</strong><span>사업자등록증 확인</span></div>
      <div class="client-business-grid">
        <div class="client-business-item"><span>등록번호</span><strong>${value("businessNumber", registry.businessNumber)}</strong></div>
        <div class="client-business-item"><span>상호</span><strong>${value("legalName", registry.legalName)}</strong></div>
        <div class="client-business-item"><span>대표자</span><strong>${value("representative", registry.representative)}</strong></div>
        <div class="client-business-item"><span>개업일</span><strong>${value("openingDate", registry.openingDate)}</strong></div>
        <div class="client-business-item is-wide"><span>사업장 주소</span><strong>${value("businessAddress", registry.address)}</strong></div>
        <div class="client-business-item"><span>업태</span><strong>${value("businessType", registry.businessType)}</strong></div>
        <div class="client-business-item"><span>종목</span><strong>${value("businessItem", registry.businessItem)}</strong></div>
        <div class="client-business-item"><span>발급일</span><strong>${value("businessRegistrationIssueDate", registry.issueDate)}</strong></div>
        <div class="client-business-item"><span>관할 세무서</span><strong>${value("taxOffice", registry.taxOffice)}</strong></div>
      </div>`;
  }

  function renderBusinessPanel() {
    const modal = document.querySelector("#clientQuickModal");
    const grid = modal?.querySelector(".crm-form-grid");
    if (!modal || !grid || modal.hidden) return;

    const id = document.querySelector("#clientQuickId")?.value || "";
    const client = clients.find((item) => item.id === id);
    const registry = registrationForClient(client);
    let panel = modal.querySelector("#clientBusinessPanel");

    if (!client || !registry) {
      panel?.remove();
      return;
    }

    if (!panel) {
      panel = document.createElement("section");
      panel.id = "clientBusinessPanel";
      panel.className = "client-business-panel";
      grid.appendChild(panel);
    }

    const nextMarkup = businessPanelMarkup(client, registry);
    if (panel.innerHTML !== nextMarkup) panel.innerHTML = nextMarkup;
  }

  function bindTargetedObservers() {
    tableObserver?.disconnect();
    modalObserver?.disconnect();

    const tableBody = document.querySelector("#clientTableBody");
    if (tableBody) {
      tableObserver = new MutationObserver(() => requestAnimationFrame(enhanceClientRows));
      tableObserver.observe(tableBody, { childList: true, subtree: true });
    }

    const modal = document.querySelector("#clientQuickModal");
    if (modal) {
      modalObserver = new MutationObserver(() => {
        if (!modal.hidden) requestAnimationFrame(renderBusinessPanel);
      });
      modalObserver.observe(modal, { attributes: true, attributeFilter: ["hidden"] });
    }
  }

  function bindClicks() {
    if (document.documentElement.dataset.businessRegistryClicksBound === "true") return;
    document.documentElement.dataset.businessRegistryClicksBound = "true";
    document.addEventListener("click", (event) => {
      if (event.target.closest("[data-client-progress], #addClientButton")) {
        window.setTimeout(renderBusinessPanel, 80);
      }
    }, true);
  }

  function subscribeClients() {
    unsubscribeClients?.();
    unsubscribeClients = null;
    clients = [];
    if (!api || !currentUser) return;
    unsubscribeClients = api.onSnapshot(
      api.collection(api.db, "clients"),
      (snapshot) => {
        clients = snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
        requestAnimationFrame(() => {
          enhanceClientRows();
          renderBusinessPanel();
          bindTargetedObservers();
        });
      },
      (error) => console.warn("사업자정보용 클라이언트 구독 실패", error)
    );
  }

  function connect() {
    api = window.NineworksFirebase;
    if (!api?.auth || !api?.db) return window.setTimeout(connect, 80);
    api.onAuthStateChanged(api.auth, async (user) => {
      currentUser = user;
      unsubscribeClients?.();
      unsubscribeClients = null;
      clients = [];
      if (!user) return;
      await syncBusinessRegistrations();
      subscribeClients();
    });
  }

  function init() {
    injectStyle();
    bindClicks();
    bindTargetedObservers();
    connect();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
