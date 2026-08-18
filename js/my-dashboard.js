(() => {
  "use strict";

  const cssId = "nineworks-my-dashboard-style";
  if (!document.getElementById(cssId)) {
    const link = document.createElement("link");
    link.id = cssId;
    link.rel = "stylesheet";
    link.href = new URL("../css/my-dashboard.css?v=20260818-2", import.meta.url).href;
    document.head.appendChild(link);
  }

  const escapeHtml = (value = "") => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const injectDashboardUi = () => {
    const nav = document.querySelector(".main-nav");
    nav?.querySelector('[data-route="mydashboard"]')?.remove();
    document.querySelector('[data-page="mydashboard"]')?.remove();

    const tabs = document.querySelector("#mypagePage .workspace-tabs");
    const content = document.querySelector("#mypagePage .workspace-content");
    if (!tabs || !content) return;

    let tab = tabs.querySelector('[data-workspace-tab="dashboard"]');
    if (!tab) {
      tab = document.createElement("button");
      tab.className = "workspace-tab";
      tab.type = "button";
      tab.dataset.workspaceTab = "dashboard";
      tab.textContent = "마이 대시보드";
      const overviewTab = tabs.querySelector('[data-workspace-tab="overview"]');
      if (overviewTab) overviewTab.insertAdjacentElement("afterend", tab);
      else tabs.prepend(tab);
    }

    if (content.querySelector('[data-workspace-panel="dashboard"]')) return;

    const panel = document.createElement("div");
    panel.className = "workspace-panel my-dashboard-panel";
    panel.dataset.workspacePanel = "dashboard";
    panel.innerHTML = `
      <div class="section-title my-dashboard-title">
        <div>
          <p class="eyebrow">MY DASHBOARD</p>
          <h2>지금 하고 있는 일</h2>
          <p>클라이언트, 업무 내용, 일정만 가볍게 기록해두세요.</p>
        </div>
        <span id="myDashboardCount" class="my-dashboard-count">0 NOTES</span>
      </div>

      <section class="my-dashboard-shell">
        <form id="myDashboardForm" class="my-dashboard-compose" autocomplete="off">
          <label class="my-dashboard-field">
            <span>클라이언트</span>
            <input id="myDashboardClient" type="text" list="myDashboardClientOptions" placeholder="클라이언트명" required />
            <datalist id="myDashboardClientOptions"></datalist>
          </label>
          <label class="my-dashboard-field">
            <span>업무 내용</span>
            <textarea id="myDashboardWork" rows="1" placeholder="지금 하고 있는 일을 적어두세요" required></textarea>
          </label>
          <label class="my-dashboard-field">
            <span>일정</span>
            <input id="myDashboardSchedule" type="text" placeholder="예: 8/20, 이번 주 안, 미정" />
          </label>
          <div class="my-dashboard-compose__actions">
            <button id="myDashboardCancel" class="button button--ghost my-dashboard-cancel" type="button" hidden>취소</button>
            <button id="myDashboardSave" class="button button--primary my-dashboard-save" type="submit">기록</button>
          </div>
        </form>

        <div class="my-dashboard-table-head" aria-hidden="true">
          <span>CLIENT</span>
          <span>WORK</span>
          <span>SCHEDULE</span>
          <span></span>
        </div>
        <div id="myDashboardList" class="my-dashboard-list">
          <div class="my-dashboard-empty">로그인 후 개인 업무 기록을 불러옵니다.</div>
        </div>
      </section>
    `;

    const goalsPanel = content.querySelector('[data-workspace-panel="goals"]');
    if (goalsPanel) content.insertBefore(panel, goalsPanel);
    else content.appendChild(panel);
  };

  injectDashboardUi();

  let firebase = null;
  let currentUser = null;
  let currentDocRef = null;
  let items = [];
  let editingId = null;
  let unsubscribeDashboard = null;
  let unsubscribeClients = null;

  const $ = (selector) => document.querySelector(selector);

  const showToast = (message) => {
    const toast = $("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
  };

  const resetForm = () => {
    editingId = null;
    $("#myDashboardForm")?.reset();
    const save = $("#myDashboardSave");
    const cancel = $("#myDashboardCancel");
    if (save) save.textContent = "기록";
    if (cancel) cancel.hidden = true;
  };

  const renderItems = () => {
    const list = $("#myDashboardList");
    const count = $("#myDashboardCount");
    if (!list) return;

    const sorted = [...items].sort((a, b) => Number(b.updatedAt || b.createdAt || 0) - Number(a.updatedAt || a.createdAt || 0));
    if (count) count.textContent = `${sorted.length} NOTES`;

    if (!sorted.length) {
      list.innerHTML = '<div class="my-dashboard-empty">아직 기록이 없습니다.<br />위 입력칸에서 첫 업무를 바로 적어보세요.</div>';
      return;
    }

    list.innerHTML = sorted.map((item) => `
      <article class="my-dashboard-row" data-dashboard-id="${escapeHtml(item.id)}">
        <div class="my-dashboard-client">${escapeHtml(item.client || "-")}</div>
        <div class="my-dashboard-work">${escapeHtml(item.work || "-")}</div>
        <div class="my-dashboard-schedule">${escapeHtml(item.schedule || "미정")}</div>
        <div class="my-dashboard-row__actions">
          <button type="button" data-dashboard-edit="${escapeHtml(item.id)}">수정</button>
          <button type="button" data-dashboard-delete="${escapeHtml(item.id)}">삭제</button>
        </div>
      </article>
    `).join("");
  };

  const renderClientOptions = (snapshot) => {
    const datalist = $("#myDashboardClientOptions");
    if (!datalist) return;
    const names = snapshot.docs
      .map((doc) => String(doc.data()?.name || "").trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "ko"));
    datalist.innerHTML = [...new Set(names)].map((name) => `<option value="${escapeHtml(name)}"></option>`).join("");
  };

  const subscribeForUser = (user) => {
    unsubscribeDashboard?.();
    unsubscribeClients?.();
    unsubscribeDashboard = null;
    unsubscribeClients = null;
    items = [];
    renderItems();

    if (!user || !firebase) {
      currentDocRef = null;
      const list = $("#myDashboardList");
      if (list) list.innerHTML = '<div class="my-dashboard-empty">로그인 후 개인 업무 기록을 불러옵니다.</div>';
      return;
    }

    currentDocRef = firebase.doc(firebase.db, "meta", `my_dashboard_${user.uid}`);
    unsubscribeDashboard = firebase.onSnapshot(
      currentDocRef,
      (snapshot) => {
        const data = snapshot.exists() ? snapshot.data() : {};
        items = Array.isArray(data.items) ? data.items : [];
        renderItems();
      },
      (error) => {
        console.error("마이 대시보드 동기화 실패", error);
        showToast("마이 대시보드를 불러오지 못했습니다.");
      }
    );

    unsubscribeClients = firebase.onSnapshot(
      firebase.collection(firebase.db, "clients"),
      renderClientOptions,
      (error) => console.warn("클라이언트 목록 동기화 실패", error)
    );
  };

  const persistItems = async (nextItems) => {
    if (!currentUser || !currentDocRef || !firebase) throw new Error("로그인이 필요합니다.");
    await firebase.setDoc(currentDocRef, {
      ownerUid: currentUser.uid,
      items: nextItems,
      updatedAt: firebase.serverTimestamp()
    }, { merge: true });
  };

  const saveItem = async (event) => {
    event.preventDefault();
    if (!currentUser) {
      showToast("로그인 후 기록할 수 있습니다.");
      return;
    }

    const client = $("#myDashboardClient")?.value.trim() || "";
    const work = $("#myDashboardWork")?.value.trim() || "";
    const schedule = $("#myDashboardSchedule")?.value.trim() || "";
    if (!client || !work) return;

    const now = Date.now();
    const existing = editingId ? items.find((item) => item.id === editingId) : null;
    const item = {
      id: editingId || `dash_${now}_${Math.random().toString(36).slice(2, 8)}`,
      client,
      work,
      schedule,
      createdAt: existing?.createdAt || now,
      updatedAt: now
    };
    const wasEditing = Boolean(editingId);
    const nextItems = [...items.filter((entry) => entry.id !== item.id), item];

    try {
      await persistItems(nextItems);
      resetForm();
      showToast(wasEditing ? "업무 기록을 수정했습니다." : "업무 기록을 추가했습니다.");
    } catch (error) {
      console.error(error);
      showToast("업무 기록을 저장하지 못했습니다.");
    }
  };

  const startEdit = (id) => {
    const item = items.find((entry) => entry.id === id);
    if (!item) return;
    editingId = id;
    $("#myDashboardClient").value = item.client || "";
    $("#myDashboardWork").value = item.work || "";
    $("#myDashboardSchedule").value = item.schedule || "";
    $("#myDashboardSave").textContent = "수정 저장";
    $("#myDashboardCancel").hidden = false;
    $("#myDashboardWork").focus();
    $("#myDashboardForm").scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const deleteItem = async (id) => {
    const item = items.find((entry) => entry.id === id);
    if (!item) return;
    if (!window.confirm(`‘${item.client}’ 업무 기록을 삭제할까요?`)) return;
    try {
      await persistItems(items.filter((entry) => entry.id !== id));
      if (editingId === id) resetForm();
      showToast("업무 기록을 삭제했습니다.");
    } catch (error) {
      console.error(error);
      showToast("업무 기록을 삭제하지 못했습니다.");
    }
  };

  const bindUi = () => {
    $("#myDashboardForm")?.addEventListener("submit", saveItem);
    $("#myDashboardCancel")?.addEventListener("click", resetForm);

    document.addEventListener("click", (event) => {
      const editButton = event.target.closest("[data-dashboard-edit]");
      if (editButton) {
        startEdit(editButton.dataset.dashboardEdit);
        return;
      }

      const deleteButton = event.target.closest("[data-dashboard-delete]");
      if (deleteButton) deleteItem(deleteButton.dataset.dashboardDelete);
    });

    $("#myDashboardWork")?.addEventListener("keydown", (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        $("#myDashboardForm")?.requestSubmit();
      }
    });
  };

  const connectFirebase = () => {
    firebase = window.NineworksFirebase;
    if (!firebase) {
      window.setTimeout(connectFirebase, 50);
      return;
    }

    firebase.onAuthStateChanged(firebase.auth, (user) => {
      currentUser = user;
      if (!user) resetForm();
      subscribeForUser(user);
    });
  };

  bindUi();
  queueMicrotask(connectFirebase);
})();