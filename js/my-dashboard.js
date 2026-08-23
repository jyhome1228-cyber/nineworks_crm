(() => {
  "use strict";

  const cssId = "nineworks-my-dashboard-style";
  if (!document.getElementById(cssId)) {
    const link = document.createElement("link");
    link.id = cssId;
    link.rel = "stylesheet";
    link.href = new URL("../css/my-dashboard.css?v=20260824-1", import.meta.url).href;
    document.head.appendChild(link);
  }

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const escapeHtml = (value = "") => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  let firebase = null;
  let currentUser = null;
  let currentDocRef = null;
  let items = [];
  let editingId = null;
  let unsubscribeDashboard = null;
  let unsubscribeClients = null;
  let draggedId = null;
  let viewFilter = "open";

  function ensureUi() {
    const nav = $(".main-nav");
    const content = $(".app-content");
    if (!nav || !content) return false;

    // Remove the old dashboard that lived inside My Page.
    $("#mypagePage [data-workspace-tab='dashboard']")?.remove();
    $("#mypagePage [data-workspace-panel='dashboard']")?.remove();
    $("[data-page='mydashboard']")?.remove();
    nav.querySelector('[data-route="mydashboard"]')?.remove();

    let navButton = nav.querySelector('[data-route="dashboard"]');
    if (!navButton) {
      navButton = document.createElement("button");
      navButton.className = "nav-link";
      navButton.type = "button";
      navButton.dataset.route = "dashboard";
      navButton.textContent = "대시보드";
      const calendar = nav.querySelector('[data-route="calendar"]');
      if (calendar) calendar.insertAdjacentElement("afterend", navButton);
      else nav.prepend(navButton);
    }

    if (!$("#dashboardPage")) {
      const page = document.createElement("main");
      page.id = "dashboardPage";
      page.className = "page my-dashboard-page";
      page.dataset.page = "dashboard";
      page.innerHTML = `
        <section class="page-heading my-dashboard-heading">
          <div>
            <p class="eyebrow">WORK WALL</p>
            <h1>대시보드</h1>
            <p>해야 할 일, 메모, 일정 생각을 포스트잇처럼 붙여두는 개인 업무 벽입니다.</p>
          </div>
          <div class="my-dashboard-heading__summary">
            <span><b id="myDashboardOpenCount">0</b> 진행</span>
            <span><b id="myDashboardDoneCount">0</b> 완료</span>
          </div>
        </section>

        <section class="my-dashboard-compose-panel">
          <form id="myDashboardForm" class="my-dashboard-compose" autocomplete="off">
            <label class="my-dashboard-field my-dashboard-field--client">
              <span>클라이언트</span>
              <input id="myDashboardClient" type="text" list="myDashboardClientOptions" placeholder="클라이언트 또는 개인" />
              <datalist id="myDashboardClientOptions"></datalist>
            </label>
            <label class="my-dashboard-field my-dashboard-field--work">
              <span>포스트잇 내용</span>
              <textarea id="myDashboardWork" rows="1" placeholder="해야 할 일을 짧게 적어두세요.  ⌘/Ctrl + Enter 저장" required></textarea>
            </label>
            <label class="my-dashboard-field my-dashboard-field--schedule">
              <span>언제</span>
              <input id="myDashboardSchedule" type="text" placeholder="오늘 · 이번 주 · 8/28 · 미정" />
            </label>
            <div class="my-dashboard-compose__actions">
              <button id="myDashboardCancel" class="button button--ghost" type="button" hidden>취소</button>
              <button id="myDashboardSave" class="button button--primary" type="submit">＋ 붙이기</button>
            </div>
          </form>
        </section>

        <section class="my-dashboard-board-shell">
          <div class="my-dashboard-board-toolbar">
            <div class="my-dashboard-board-toolbar__left">
              <strong>MY WALL</strong>
              <span id="myDashboardCount">0 NOTES</span>
            </div>
            <div class="my-dashboard-filter" role="tablist" aria-label="대시보드 보기">
              <button class="is-active" type="button" data-dashboard-filter="open">진행</button>
              <button type="button" data-dashboard-filter="all">전체</button>
              <button type="button" data-dashboard-filter="done">완료</button>
            </div>
          </div>
          <div id="myDashboardBoard" class="my-dashboard-board">
            <div class="my-dashboard-empty">로그인 후 내 포스트잇을 불러옵니다.</div>
          </div>
        </section>
      `;
      const calendarPage = $("#calendarPage");
      if (calendarPage) calendarPage.insertAdjacentElement("afterend", page);
      else content.prepend(page);
    }

    return true;
  }

  function popup(message, title = "완료", icon = "✓") {
    let root = $("#myDashboardPopup");
    if (!root) {
      root = document.createElement("div");
      root.id = "myDashboardPopup";
      root.className = "my-dashboard-popup";
      root.setAttribute("role", "status");
      root.setAttribute("aria-live", "polite");
      root.innerHTML = '<div class="my-dashboard-popup__card"><span class="my-dashboard-popup__icon">✓</span><strong></strong><p></p></div>';
      document.body.appendChild(root);
    }
    root.querySelector(".my-dashboard-popup__icon").textContent = icon;
    root.querySelector("strong").textContent = title;
    root.querySelector("p").textContent = message;
    clearTimeout(popup.timer);
    requestAnimationFrame(() => root.classList.add("is-visible"));
    popup.timer = setTimeout(() => root.classList.remove("is-visible"), 1400);
  }

  function showToast(message) {
    const toast = $("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }

  function normalizeItem(item, index) {
    return {
      ...item,
      id: item.id || `dash_legacy_${index}`,
      client: item.client || "",
      work: item.work || "",
      schedule: item.schedule || "",
      done: item.done === true,
      createdAt: Number(item.createdAt || Date.now()),
      updatedAt: Number(item.updatedAt || item.createdAt || Date.now())
    };
  }

  function toneClass(item, index) {
    const seed = [...String(item.id || index)].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return `is-tone-${(seed % 5) + 1}`;
  }

  function visibleItems() {
    if (viewFilter === "done") return items.filter((item) => item.done);
    if (viewFilter === "open") return items.filter((item) => !item.done);
    return [...items];
  }

  function renderItems() {
    const board = $("#myDashboardBoard");
    if (!board) return;

    const openCount = items.filter((item) => !item.done).length;
    const doneCount = items.filter((item) => item.done).length;
    $("#myDashboardOpenCount").textContent = String(openCount);
    $("#myDashboardDoneCount").textContent = String(doneCount);
    $("#myDashboardCount").textContent = `${items.length} NOTES`;

    $$("[data-dashboard-filter]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.dashboardFilter === viewFilter);
    });

    const list = visibleItems();
    if (!list.length) {
      const copy = viewFilter === "done"
        ? "완료한 포스트잇이 아직 없습니다."
        : viewFilter === "open"
          ? "지금 해야 할 일이 없습니다. 위에서 새 포스트잇을 붙여보세요."
          : "아직 포스트잇이 없습니다. 위에서 첫 메모를 붙여보세요.";
      board.innerHTML = `<div class="my-dashboard-empty">${copy}</div>`;
      return;
    }

    board.innerHTML = list.map((item, index) => `
      <article class="my-dashboard-note ${toneClass(item, index)} ${item.done ? "is-done" : ""}" data-dashboard-id="${escapeHtml(item.id)}" draggable="true">
        <div class="my-dashboard-note__top">
          <span class="my-dashboard-note__client">${escapeHtml(item.client || "개인")}</span>
          <button class="my-dashboard-note__drag" type="button" aria-label="포스트잇 순서 이동" title="드래그해서 순서 이동">⠿</button>
        </div>
        <div class="my-dashboard-note__work">${escapeHtml(item.work || "-")}</div>
        <div class="my-dashboard-note__bottom">
          <span class="my-dashboard-note__schedule">${escapeHtml(item.schedule || "일정 미정")}</span>
          <div class="my-dashboard-note__actions">
            <button type="button" data-dashboard-toggle="${escapeHtml(item.id)}">${item.done ? "되돌리기" : "완료"}</button>
            <button type="button" data-dashboard-edit="${escapeHtml(item.id)}">수정</button>
            <button type="button" data-dashboard-delete="${escapeHtml(item.id)}">삭제</button>
          </div>
        </div>
      </article>
    `).join("");
  }

  function renderClientOptions(snapshot) {
    const datalist = $("#myDashboardClientOptions");
    if (!datalist) return;
    const names = snapshot.docs
      .map((doc) => String(doc.data()?.name || "").trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "ko"));
    datalist.innerHTML = [...new Set(names)].map((name) => `<option value="${escapeHtml(name)}"></option>`).join("");
  }

  function resetForm() {
    editingId = null;
    $("#myDashboardForm")?.reset();
    const save = $("#myDashboardSave");
    const cancel = $("#myDashboardCancel");
    if (save) save.textContent = "＋ 붙이기";
    if (cancel) cancel.hidden = true;
  }

  async function persistItems(nextItems) {
    if (!currentUser || !currentDocRef || !firebase) throw new Error("로그인이 필요합니다.");
    await firebase.setDoc(currentDocRef, {
      ownerUid: currentUser.uid,
      items: nextItems,
      updatedAt: firebase.serverTimestamp()
    }, { merge: true });
  }

  async function saveItem(event) {
    event.preventDefault();
    if (!currentUser) return showToast("로그인 후 기록할 수 있습니다.");

    const client = $("#myDashboardClient")?.value.trim() || "개인";
    const work = $("#myDashboardWork")?.value.trim() || "";
    const schedule = $("#myDashboardSchedule")?.value.trim() || "";
    if (!work) {
      $("#myDashboardWork")?.focus();
      return;
    }

    const now = Date.now();
    const existing = editingId ? items.find((item) => item.id === editingId) : null;
    const item = {
      id: editingId || `dash_${now}_${Math.random().toString(36).slice(2, 8)}`,
      client,
      work,
      schedule,
      done: existing?.done === true,
      createdAt: existing?.createdAt || now,
      updatedAt: now
    };

    const wasEditing = Boolean(editingId);
    const nextItems = wasEditing
      ? items.map((entry) => entry.id === item.id ? item : entry)
      : [item, ...items];

    try {
      await persistItems(nextItems);
      resetForm();
      popup(wasEditing ? "포스트잇 내용을 수정했습니다." : "새 포스트잇을 업무 벽에 붙였습니다.", wasEditing ? "수정 완료" : "포스트잇 추가");
    } catch (error) {
      console.error(error);
      showToast("포스트잇을 저장하지 못했습니다.");
    }
  }

  function startEdit(id) {
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
  }

  async function toggleDone(id) {
    const item = items.find((entry) => entry.id === id);
    if (!item) return;
    const nextItems = items.map((entry) => entry.id === id ? { ...entry, done: !entry.done, updatedAt: Date.now() } : entry);
    try {
      await persistItems(nextItems);
      popup(item.done ? "다시 진행 목록으로 옮겼습니다." : "완료한 일로 정리했습니다.", item.done ? "진행으로 변경" : "완료 처리");
    } catch (error) {
      console.error(error);
      showToast("상태를 변경하지 못했습니다.");
    }
  }

  async function deleteItem(id) {
    const item = items.find((entry) => entry.id === id);
    if (!item) return;
    if (!window.confirm("이 포스트잇을 삭제할까요?")) return;
    try {
      await persistItems(items.filter((entry) => entry.id !== id));
      if (editingId === id) resetForm();
      popup("포스트잇을 벽에서 제거했습니다.", "삭제 완료", "−");
    } catch (error) {
      console.error(error);
      showToast("포스트잇을 삭제하지 못했습니다.");
    }
  }

  async function reorderItem(sourceId, targetId) {
    if (!sourceId || !targetId || sourceId === targetId || viewFilter !== "all" && visibleItems().length !== items.length) return;
    const sourceIndex = items.findIndex((item) => item.id === sourceId);
    const targetIndex = items.findIndex((item) => item.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const next = [...items];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    items = next;
    renderItems();
    try {
      await persistItems(next);
    } catch (error) {
      console.error(error);
      showToast("포스트잇 순서를 저장하지 못했습니다.");
    }
  }

  function subscribeForUser(user) {
    unsubscribeDashboard?.();
    unsubscribeClients?.();
    unsubscribeDashboard = null;
    unsubscribeClients = null;
    items = [];
    renderItems();

    if (!user || !firebase) {
      currentDocRef = null;
      const board = $("#myDashboardBoard");
      if (board) board.innerHTML = '<div class="my-dashboard-empty">로그인 후 내 포스트잇을 불러옵니다.</div>';
      return;
    }

    currentDocRef = firebase.doc(firebase.db, "meta", `my_dashboard_${user.uid}`);
    unsubscribeDashboard = firebase.onSnapshot(
      currentDocRef,
      (snapshot) => {
        const data = snapshot.exists() ? snapshot.data() : {};
        items = Array.isArray(data.items) ? data.items.map(normalizeItem) : [];
        renderItems();
      },
      (error) => {
        console.error("대시보드 동기화 실패", error);
        showToast("대시보드를 불러오지 못했습니다.");
      }
    );

    unsubscribeClients = firebase.onSnapshot(
      firebase.collection(firebase.db, "clients"),
      renderClientOptions,
      (error) => console.warn("클라이언트 목록 동기화 실패", error)
    );
  }

  function bindUi() {
    $("#myDashboardForm")?.addEventListener("submit", saveItem);
    $("#myDashboardCancel")?.addEventListener("click", resetForm);
    $("#myDashboardWork")?.addEventListener("keydown", (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        $("#myDashboardForm")?.requestSubmit();
      }
    });

    $("#dashboardPage")?.addEventListener("click", (event) => {
      const filter = event.target.closest("[data-dashboard-filter]");
      if (filter) {
        viewFilter = filter.dataset.dashboardFilter || "open";
        renderItems();
        return;
      }
      const edit = event.target.closest("[data-dashboard-edit]");
      if (edit) return startEdit(edit.dataset.dashboardEdit);
      const toggle = event.target.closest("[data-dashboard-toggle]");
      if (toggle) return toggleDone(toggle.dataset.dashboardToggle);
      const remove = event.target.closest("[data-dashboard-delete]");
      if (remove) return deleteItem(remove.dataset.dashboardDelete);
    });

    const board = $("#myDashboardBoard");
    board?.addEventListener("dragstart", (event) => {
      const note = event.target.closest("[data-dashboard-id]");
      if (!note) return;
      draggedId = note.dataset.dashboardId;
      note.classList.add("is-dragging");
      event.dataTransfer.effectAllowed = "move";
    });
    board?.addEventListener("dragend", (event) => {
      event.target.closest("[data-dashboard-id]")?.classList.remove("is-dragging");
      draggedId = null;
      $$(".my-dashboard-note.is-drag-over", board).forEach((note) => note.classList.remove("is-drag-over"));
    });
    board?.addEventListener("dragover", (event) => {
      const target = event.target.closest("[data-dashboard-id]");
      if (!target || target.dataset.dashboardId === draggedId) return;
      event.preventDefault();
      $$(".my-dashboard-note.is-drag-over", board).forEach((note) => note.classList.remove("is-drag-over"));
      target.classList.add("is-drag-over");
    });
    board?.addEventListener("drop", (event) => {
      const target = event.target.closest("[data-dashboard-id]");
      if (!target || !draggedId) return;
      event.preventDefault();
      target.classList.remove("is-drag-over");
      reorderItem(draggedId, target.dataset.dashboardId);
    });
  }

  function connectFirebase() {
    firebase = window.NineworksFirebase;
    if (!firebase) return window.setTimeout(connectFirebase, 60);
    firebase.onAuthStateChanged(firebase.auth, (user) => {
      currentUser = user;
      if (!user) resetForm();
      subscribeForUser(user);
    });
  }

  function init() {
    if (!ensureUi()) return setTimeout(init, 80);
    bindUi();
    queueMicrotask(connectFirebase);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();