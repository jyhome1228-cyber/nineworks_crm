import "./amingj-business-registry.js?v=20260831-1";

(() => {
  "use strict";

  const STYLE_ID = "nineworks-settings-requests-v2-style";
  const STATUS_LABEL = {
    new: "새 요청",
    confirmed: "확인 완료",
    working: "작업 중",
    done: "완료"
  };

  let api = null;
  let currentUser = null;
  let requests = [];
  let unsubscribe = null;
  let root = null;

  const $ = (selector, scope = document) => scope.querySelector(selector);

  function escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function loadStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const link = document.createElement("link");
    link.id = STYLE_ID;
    link.rel = "stylesheet";
    link.href = new URL("../css/settings-requests-v2.css?v=20260831-1", import.meta.url).href;
    document.head.appendChild(link);
  }

  function shortDate(value = "") {
    if (!value) return "일정 미정";
    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return String(value);
    return `${Number(match[2])}.${String(match[3]).padStart(2, "0")}`;
  }

  function requestRow(request, completed = false) {
    const status = request.status || "new";
    const primaryAction = completed
      ? `<button class="nw-request-action is-primary" type="button" data-request-reopen="${escapeHtml(request.id)}">다시 열기</button>`
      : status === "working"
        ? `<button class="nw-request-action is-primary" type="button" data-request-complete="${escapeHtml(request.id)}">완료 처리</button>`
        : `<button class="nw-request-action is-primary" type="button" data-request-progress="${escapeHtml(request.id)}">작업 시작</button>`;

    return `
      <article class="nw-request-row" data-settings-request="${escapeHtml(request.id)}">
        <div class="nw-request-row__main">
          <span class="nw-request-row__client">${escapeHtml(request.client || "클라이언트 미지정")}</span>
          <strong>${escapeHtml(request.title || "요청사항")}</strong>
          <p>${escapeHtml(request.content || "요청 내용이 없습니다.")}</p>
        </div>
        <div class="nw-request-row__meta">
          <strong>${escapeHtml(request.assignee || "미지정")}</strong>
          <span>${escapeHtml(shortDate(request.due))}</span>
        </div>
        <div><span class="nw-request-status" data-status="${escapeHtml(status)}">${escapeHtml(STATUS_LABEL[status] || status)}</span></div>
        <div class="nw-request-row__actions">
          ${!completed ? `<button class="nw-request-action" type="button" data-request-schedule="${escapeHtml(request.id)}">일정 연결</button>` : ""}
          ${primaryAction}
        </div>
      </article>`;
  }

  function render() {
    if (!root) return;
    const active = requests
      .filter((request) => request.status !== "done")
      .sort((a, b) => String(a.due || "9999").localeCompare(String(b.due || "9999")));
    const completed = requests
      .filter((request) => request.status === "done")
      .sort((a, b) => String(b.due || "").localeCompare(String(a.due || "")));

    const activeList = $("#nwRequestActiveList", root);
    const completedList = $("#nwRequestCompletedList", root);
    const activeCount = $("#nwRequestActiveCount", root);
    const completedCount = $("#nwRequestCompletedCount", root);

    if (activeCount) activeCount.textContent = String(active.length);
    if (completedCount) completedCount.textContent = String(completed.length);
    if (activeList) {
      activeList.innerHTML = active.length
        ? active.map((request) => requestRow(request, false)).join("")
        : '<p class="nw-request-empty">현재 진행 중인 요청이 없습니다.</p>';
    }
    if (completedList) {
      completedList.innerHTML = completed.length
        ? completed.map((request) => requestRow(request, true)).join("")
        : '<p class="nw-request-empty">완료된 요청이 아직 없습니다.</p>';
    }
  }

  function ensureUi() {
    const section = $("#v2SettingsRequests");
    if (!section) return false;
    const legacy = section.querySelector(".request-board");
    legacy?.setAttribute("aria-hidden", "true");

    root = $("#nwSettingsRequests", section);
    if (!root) {
      root = document.createElement("div");
      root.id = "nwSettingsRequests";
      root.className = "nw-settings-requests";
      root.innerHTML = `
        <section class="nw-request-panel">
          <header class="nw-request-panel__head">
            <div class="nw-request-panel__title">
              <span class="nw-request-panel__eyebrow">IN PROGRESS</span>
              <h2>진행 중 요청</h2>
            </div>
            <span id="nwRequestActiveCount" class="nw-request-count">0</span>
          </header>
          <div id="nwRequestActiveList" class="nw-request-panel__body"></div>
        </section>
        <section class="nw-request-panel">
          <header class="nw-request-panel__head">
            <div class="nw-request-panel__title">
              <span class="nw-request-panel__eyebrow">COMPLETED</span>
              <h2>완료된 요청</h2>
            </div>
            <span id="nwRequestCompletedCount" class="nw-request-count">0</span>
          </header>
          <div id="nwRequestCompletedList" class="nw-request-panel__body"></div>
        </section>`;
      section.prepend(root);
      root.addEventListener("click", handleAction);
    }

    render();
    return true;
  }

  async function updateRequest(id, patch) {
    if (!api || !currentUser || !id) return;
    const item = requests.find((request) => request.id === id);
    if (!item) return;
    try {
      await api.setDoc(api.doc(api.db, "requests", id), {
        ...patch,
        updatedAt: api.serverTimestamp(),
        updatedBy: currentUser.uid
      }, { merge: true });
    } catch (error) {
      console.error("요청 상태 변경 실패", error);
    }
  }

  function handleAction(event) {
    const complete = event.target.closest("[data-request-complete]");
    if (complete) {
      updateRequest(complete.dataset.requestComplete, { status: "done" });
      return;
    }

    const progress = event.target.closest("[data-request-progress]");
    if (progress) {
      updateRequest(progress.dataset.requestProgress, { status: "working" });
      return;
    }

    const reopen = event.target.closest("[data-request-reopen]");
    if (reopen) {
      updateRequest(reopen.dataset.requestReopen, { status: "confirmed" });
    }
  }

  function subscribe(user) {
    unsubscribe?.();
    unsubscribe = null;
    requests = [];
    currentUser = user;
    render();
    if (!user) return;

    unsubscribe = api.onSnapshot(
      api.collection(api.db, "requests"),
      (snapshot) => {
        requests = snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
        render();
      },
      (error) => console.warn("설정 요청 목록 불러오기 실패", error)
    );
  }

  function connect() {
    api = window.NineworksFirebase;
    if (!api?.auth || !api?.db) {
      window.setTimeout(connect, 100);
      return;
    }
    api.onAuthStateChanged(api.auth, subscribe);
  }

  function observeUi() {
    let queued = false;
    new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        ensureUi();
      });
    }).observe(document.body, { childList: true, subtree: true });
  }

  function init() {
    loadStyle();
    ensureUi();
    observeUi();
    connect();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
