(() => {
  "use strict";

  const STYLE_ID = "nineworks-workspace-v2-style";
  const THEME_KEY = "nineworks-crm-theme";
  const data = { events: [], todos: [], requests: [], clients: [] };
  const unsubscribers = [];
  let firebase = null;
  let currentUser = null;
  let calendarInstance = null;
  let settingsTab = "requests";
  let uiSyncQueued = false;

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const escapeHtml = (value = "") => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const pad = (value) => String(value).padStart(2, "0");
  const todayKey = () => {
    const date = new Date();
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };
  const addDays = (key, amount) => {
    const [y, m, d] = String(key).split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + amount);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };
  const shortDate = (key) => {
    if (!key) return "미정";
    const [y, m, d] = String(key).split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
    return `${m}.${pad(d)} (${weekday})`;
  };
  const fullTodayLabel = () => new Intl.DateTimeFormat("ko-KR", {
    year: "numeric", month: "long", day: "numeric", weekday: "long"
  }).format(new Date());

  function loadStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const link = document.createElement("link");
    link.id = STYLE_ID;
    link.rel = "stylesheet";
    link.href = new URL("../css/workspace-v2.css?v=20260830-1", import.meta.url).href;
    document.head.appendChild(link);
  }

  function setTheme(theme, persist = true) {
    const next = theme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    document.querySelector('meta[name="color-scheme"]')?.setAttribute("content", "light dark");
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", next === "dark" ? "#171719" : "#f4f5f7");
    if (persist) localStorage.setItem(THEME_KEY, next);

    const toggle = $("#v2ThemeToggle");
    if (toggle) {
      toggle.setAttribute("aria-label", next === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환");
      toggle.innerHTML = next === "dark"
        ? '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.41M17.66 6.34l1.41-1.41"></path></svg>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z"></path></svg>';
    }
    $$("[data-v2-theme]").forEach((button) => button.classList.toggle("is-active", button.dataset.v2Theme === next));
  }

  function initTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    setTheme(stored === "dark" ? "dark" : "light", false);
  }

  function addThemeToggle() {
    const actions = $(".topbar__actions");
    if (!actions || $("#v2ThemeToggle")) return;
    const button = document.createElement("button");
    button.id = "v2ThemeToggle";
    button.type = "button";
    button.className = "v2-theme-toggle";
    button.addEventListener("click", () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));
    const profile = actions.querySelector(".profile-button");
    if (profile) actions.insertBefore(button, profile);
    else actions.appendChild(button);
    setTheme(document.documentElement.dataset.theme || "light", false);
  }

  function routeTo(route) {
    const nav = $(`.main-nav [data-route="${route}"]`);
    nav?.click();
  }

  function normalizeNav() {
    const nav = $(".main-nav");
    if (!nav) return;

    const dashboard = nav.querySelector('[data-route="dashboard"]');
    const calendar = nav.querySelector('[data-route="calendar"]');
    if (dashboard && calendar && dashboard.previousElementSibling !== calendar) {
      calendar.insertAdjacentElement("afterend", dashboard);
    }

    const requestNav = nav.querySelector('[data-route="requests"], [data-route="settings"]');
    if (requestNav && requestNav.dataset.v2SettingsNav !== "true") {
      requestNav.dataset.v2SettingsNav = "true";
      requestNav.dataset.route = "settings";
      requestNav.innerHTML = '설정 <span id="requestBadge" class="nav-badge v2-hidden-badge">0</span>';
    }

    $$('[data-route="requests"]').forEach((button) => { button.dataset.route = "settings"; });

    const reminderNav = nav.querySelector('[data-route="reminder-settings"]');
    if (reminderNav && !reminderNav.hidden) reminderNav.hidden = true;

    const bell = $("#notificationButton");
    if (bell && !bell.hidden) bell.hidden = true;
  }

  function transformSettingsPage() {
    const page = $("#requestsPage");
    if (!page) return false;
    if (page.dataset.page !== "settings") page.dataset.page = "settings";
    page.classList.add("settings-page");

    const heading = page.querySelector(".page-heading");
    if (heading && heading.dataset.v2Ready !== "true") {
      heading.dataset.v2Ready = "true";
      const eyebrow = heading.querySelector(".eyebrow");
      const title = heading.querySelector("h1");
      const copy = heading.querySelector("p:not(.eyebrow)");
      if (eyebrow) eyebrow.textContent = "SETTINGS";
      if (title) title.textContent = "업무 환경을 한곳에서 관리합니다.";
      if (copy) copy.textContent = "클라이언트 요청, 개인 알림, 화면 테마를 설정합니다.";
    }

    let tabs = $("#v2SettingsTabs", page);
    if (!tabs) {
      tabs = document.createElement("div");
      tabs.id = "v2SettingsTabs";
      tabs.className = "v2-settings-tabs";
      tabs.innerHTML = `
        <button class="v2-settings-tab is-active" type="button" data-v2-settings="requests">요청 관리</button>
        <button class="v2-settings-tab" type="button" data-v2-settings="notifications">알림 관리</button>
        <button class="v2-settings-tab" type="button" data-v2-settings="appearance">화면 설정</button>`;
      heading?.insertAdjacentElement("afterend", tabs);
      tabs.addEventListener("click", (event) => {
        const button = event.target.closest("[data-v2-settings]");
        if (!button) return;
        settingsTab = button.dataset.v2Settings || "requests";
        renderSettingsTab();
      });
    }

    const board = page.querySelector(".request-board");
    if (board && !$("#v2SettingsRequests", page)) {
      const section = document.createElement("section");
      section.id = "v2SettingsRequests";
      section.className = "v2-settings-section is-active";
      board.insertAdjacentElement("beforebegin", section);
      section.appendChild(board);
    }

    if (!$("#v2SettingsNotifications", page)) {
      const section = document.createElement("section");
      section.id = "v2SettingsNotifications";
      section.className = "v2-settings-section v2-settings-section--notifications";
      section.innerHTML = '<div class="panel v2-settings-card"><h2>알림 관리</h2><p>브라우저 알림 모듈을 불러오는 중입니다.</p></div>';
      page.appendChild(section);
    }

    if (!$("#v2SettingsAppearance", page)) {
      const section = document.createElement("section");
      section.id = "v2SettingsAppearance";
      section.className = "v2-settings-section v2-settings-section--appearance";
      section.innerHTML = `
        <article class="panel v2-settings-card">
          <h2>화면 테마</h2>
          <p>기본은 라이트 모드로 사용하고, 필요할 때 다크 모드로 전환할 수 있습니다. 선택한 모드는 이 브라우저에 저장됩니다.</p>
          <div class="v2-theme-options">
            <button class="v2-theme-option" type="button" data-v2-theme="light"><strong>Light</strong><small>업무 시간에 보기 편한 기본 화면</small></button>
            <button class="v2-theme-option" type="button" data-v2-theme="dark"><strong>Dark</strong><small>저조도 환경에 맞춘 어두운 화면</small></button>
          </div>
        </article>`;
      page.appendChild(section);
      section.addEventListener("click", (event) => {
        const button = event.target.closest("[data-v2-theme]");
        if (button) setTheme(button.dataset.v2Theme);
      });
    }

    renderSettingsTab();
    moveReminderSettingsIntoSettings();
    return true;
  }

  function renderSettingsTab() {
    const page = $("#requestsPage");
    if (!page) return;
    $$("[data-v2-settings]", page).forEach((button) => button.classList.toggle("is-active", button.dataset.v2Settings === settingsTab));
    const sections = {
      requests: $("#v2SettingsRequests", page),
      notifications: $("#v2SettingsNotifications", page),
      appearance: $("#v2SettingsAppearance", page)
    };
    Object.entries(sections).forEach(([key, section]) => section?.classList.toggle("is-active", key === settingsTab));
    const addRequest = $("#addRequestButton");
    if (addRequest) addRequest.hidden = settingsTab !== "requests";
  }

  function moveReminderSettingsIntoSettings() {
    const source = $("#reminderSettingsPage");
    const target = $("#v2SettingsNotifications");
    if (!source || !target || source.dataset.v2Moved === "true") return;
    source.dataset.v2Moved = "true";
    target.innerHTML = "";
    [...source.children].forEach((child) => target.appendChild(child));
    source.hidden = true;
    source.classList.remove("is-active");
  }

  function dashboardMarkup() {
    return `
      <section class="page-heading v2-dashboard-heading">
        <div>
          <p class="eyebrow">TODAY WORKSPACE</p>
          <h1>오늘 해야 할 일을 바로 확인합니다.</h1>
          <p>해야 할 일과 캘린더 일정을 한 화면에서 보고, 새 업무는 바로 캘린더에 연결됩니다.</p>
          <span class="v2-dashboard-date">${escapeHtml(fullTodayLabel())}</span>
        </div>
        <div class="v2-dashboard-heading__actions">
          <button class="button button--ghost" type="button" data-v2-route="calendar">캘린더 보기</button>
          <button class="button button--primary" type="button" data-v2-focus-todo>＋ 해야 할 일</button>
        </div>
      </section>

      <section class="v2-dashboard-grid">
        <article class="v2-stat"><span>오늘 일정</span><strong id="v2TodayEventCount">0</strong><small>건</small></article>
        <article class="v2-stat"><span>해야 할 일</span><strong id="v2TodoCount">0</strong><small>건</small></article>
        <article class="v2-stat"><span>지연 업무</span><strong id="v2OverdueCount">0</strong><small>건</small></article>
        <article class="v2-stat"><span>새 요청</span><strong id="v2RequestCount">0</strong><small>건</small></article>
      </section>

      <section class="v2-dashboard-main">
        <div class="v2-dashboard-stack">
          <article class="panel v2-dashboard-panel">
            <div class="v2-panel-head"><div><p class="eyebrow">TODAY</p><h2>오늘 처리할 업무</h2><p>오늘 일정과 마감된 할 일을 함께 보여줍니다.</p></div><button class="text-button" type="button" data-v2-route="calendar">전체 일정</button></div>
            <div id="v2TodayWork" class="v2-list"></div>
          </article>

          <article class="panel v2-dashboard-panel" id="v2QuickTodoPanel">
            <div class="v2-panel-head"><div><p class="eyebrow">QUICK TO DO</p><h2>해야 할 일 빠른 등록</h2><p>등록하면 대시보드와 캘린더에 동시에 표시됩니다.</p></div></div>
            <form id="v2QuickTodoForm" class="v2-quick-form">
              <select id="v2TodoClient" aria-label="클라이언트"><option value="나인웍스">나인웍스</option></select>
              <input id="v2TodoTitle" type="text" placeholder="해야 할 일을 입력하세요" required />
              <input id="v2TodoDue" type="date" required />
              <button class="button button--primary" type="submit">추가</button>
            </form>
          </article>
        </div>

        <aside class="v2-dashboard-stack">
          <article class="panel v2-dashboard-panel">
            <div class="v2-panel-head"><div><p class="eyebrow">NEXT 7 DAYS</p><h2>이번 주 흐름</h2><p>7일 안의 일정과 할 일입니다.</p></div></div>
            <div id="v2WeekWork" class="v2-list"></div>
          </article>
          <article class="panel v2-dashboard-panel">
            <div class="v2-panel-head"><div><p class="eyebrow">REQUESTS</p><h2>확인할 요청</h2><p>새 요청과 작업 중 요청을 빠르게 확인합니다.</p></div><button class="text-button" type="button" data-v2-route="settings">요청 관리</button></div>
            <div id="v2RequestPreview" class="v2-list"></div>
          </article>
        </aside>
      </section>`;
  }

  function transformDashboard() {
    const page = $("#dashboardPage");
    if (!page) return false;
    if (page.dataset.v2Ready === "true") return true;
    page.dataset.v2Ready = "true";
    page.classList.add("v2-dashboard");
    page.innerHTML = dashboardMarkup();
    page.addEventListener("click", (event) => {
      const route = event.target.closest("[data-v2-route]");
      if (route) return routeTo(route.dataset.v2Route);
      if (event.target.closest("[data-v2-focus-todo]")) {
        $("#v2TodoTitle")?.focus();
        $("#v2QuickTodoPanel")?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      if (event.target.closest("[data-v2-request]")) {
        settingsTab = "requests";
        routeTo("settings");
        setTimeout(renderSettingsTab, 0);
      }
    });
    $("#v2QuickTodoForm")?.addEventListener("submit", saveQuickTodo);
    page.addEventListener("change", (event) => {
      const checkbox = event.target.closest("[data-v2-toggle-todo]");
      if (checkbox) toggleTodo(checkbox.dataset.v2ToggleTodo, checkbox.checked);
    });
    if ($("#v2TodoDue")) $("#v2TodoDue").value = todayKey();
    renderAll();
    return true;
  }

  function renderClientSelect() {
    const select = $("#v2TodoClient");
    if (!select) return;
    const previous = select.value || "나인웍스";
    const names = ["나인웍스", ...data.clients.map((client) => client.name).filter(Boolean)];
    select.innerHTML = [...new Set(names)].sort((a, b) => a.localeCompare(b, "ko"))
      .map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join("");
    if ([...select.options].some((option) => option.value === previous)) select.value = previous;
  }

  function todayEvents() {
    const today = todayKey();
    return data.events
      .filter((item) => item.status !== "done" && String(item.start || "") <= today && String(item.end || item.start || "") >= today)
      .sort((a, b) => String(a.end || a.start).localeCompare(String(b.end || b.start)));
  }

  function activeTodos() {
    return data.todos.filter((item) => item.done !== true).sort((a, b) => String(a.due || "9999-12-31").localeCompare(String(b.due || "9999-12-31")));
  }

  function renderStats() {
    const today = todayKey();
    const todos = activeTodos();
    const overdue = todos.filter((todo) => todo.due && todo.due < today);
    const requests = data.requests.filter((request) => request.status === "new");
    if ($("#v2TodayEventCount")) $("#v2TodayEventCount").textContent = String(todayEvents().length);
    if ($("#v2TodoCount")) $("#v2TodoCount").textContent = String(todos.length);
    if ($("#v2OverdueCount")) $("#v2OverdueCount").textContent = String(overdue.length);
    if ($("#v2RequestCount")) $("#v2RequestCount").textContent = String(requests.length);
  }

  function todoRow(todo, label = "할 일") {
    return `
      <div class="v2-work-row">
        <span class="v2-work-kind is-todo">${escapeHtml(label)}</span>
        <label class="v2-todo-check v2-work-main"><input type="checkbox" data-v2-toggle-todo="${escapeHtml(todo.id)}" ${todo.done ? "checked" : ""} /><span><strong>${escapeHtml(todo.title || "할 일")}</strong><small>${escapeHtml(todo.client || "나인웍스")} · 캘린더 연동</small></span></label>
        <span class="v2-work-meta">${escapeHtml(shortDate(todo.due))}</span>
      </div>`;
  }

  function eventRow(event) {
    return `
      <div class="v2-work-row">
        <span class="v2-work-kind">일정</span>
        <div class="v2-work-main"><strong>${escapeHtml(event.title || "일정")}</strong><small>${escapeHtml([event.client, event.member, event.category].filter(Boolean).join(" · "))}</small></div>
        <span class="v2-work-meta">${escapeHtml(shortDate(event.end || event.start))}</span>
      </div>`;
  }

  function renderTodayWork() {
    const target = $("#v2TodayWork");
    if (!target) return;
    const today = todayKey();
    const todos = activeTodos().filter((todo) => todo.due && todo.due <= today).map((todo) => ({ kind: "todo", date: todo.due, item: todo }));
    const events = todayEvents().map((event) => ({ kind: "event", date: event.end || event.start, item: event }));
    const items = [...todos, ...events].sort((a, b) => String(a.date).localeCompare(String(b.date)));
    target.innerHTML = items.length
      ? items.slice(0, 10).map((entry) => entry.kind === "todo" ? todoRow(entry.item, entry.item.due < today ? "지연" : "할 일") : eventRow(entry.item)).join("")
      : '<p class="v2-empty">오늘 처리할 업무가 없습니다.</p>';
  }

  function renderWeekWork() {
    const target = $("#v2WeekWork");
    if (!target) return;
    const today = todayKey();
    const limit = addDays(today, 7);
    const todos = activeTodos().filter((todo) => todo.due && todo.due >= today && todo.due <= limit).map((todo) => ({ kind: "todo", date: todo.due, item: todo }));
    const events = data.events.filter((event) => event.status !== "done" && event.start && event.start >= today && event.start <= limit).map((event) => ({ kind: "event", date: event.start, item: event }));
    const items = [...todos, ...events].sort((a, b) => String(a.date).localeCompare(String(b.date)));
    target.innerHTML = items.length
      ? items.slice(0, 8).map((entry) => entry.kind === "todo" ? todoRow(entry.item) : eventRow(entry.item)).join("")
      : '<p class="v2-empty">7일 안에 예정된 업무가 없습니다.</p>';
  }

  function renderRequests() {
    const target = $("#v2RequestPreview");
    if (!target) return;
    const list = data.requests
      .filter((request) => request.status !== "done")
      .sort((a, b) => String(a.due || "9999-12-31").localeCompare(String(b.due || "9999-12-31")))
      .slice(0, 5);
    target.innerHTML = list.length ? list.map((request) => `
      <button class="v2-request-row" type="button" data-v2-request="${escapeHtml(request.id)}">
        <span><strong>${escapeHtml(request.title || "요청")}</strong><small>${escapeHtml([request.client, request.assignee].filter(Boolean).join(" · "))}</small></span>
        <span>${escapeHtml(shortDate(request.due))}</span>
      </button>`).join("") : '<p class="v2-empty">확인할 요청이 없습니다.</p>';
  }

  function renderAll() {
    renderStats();
    renderTodayWork();
    renderWeekWork();
    renderRequests();
    renderClientSelect();
    calendarInstance?.refetchEvents();
  }

  async function saveQuickTodo(event) {
    event.preventDefault();
    if (!firebase || !currentUser) return;
    const title = $("#v2TodoTitle")?.value.trim();
    const client = $("#v2TodoClient")?.value || "나인웍스";
    const due = $("#v2TodoDue")?.value || todayKey();
    if (!title) return;
    const id = `todo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    try {
      await firebase.setDoc(firebase.doc(firebase.db, "todos", id), {
        id, title, client, due, done: false,
        createdAtServer: firebase.serverTimestamp(),
        updatedAt: firebase.serverTimestamp(),
        updatedBy: currentUser.uid
      }, { merge: true });
      $("#v2TodoTitle").value = "";
      $("#v2TodoDue").value = todayKey();
      $("#v2TodoTitle").focus();
    } catch (error) {
      console.error("빠른 할 일 저장 실패", error);
    }
  }

  async function toggleTodo(id, done) {
    if (!firebase || !currentUser) return;
    const todo = data.todos.find((item) => item.id === id);
    if (!todo) return;
    try {
      await firebase.setDoc(firebase.doc(firebase.db, "todos", id), {
        ...todo, done, updatedAt: firebase.serverTimestamp(), updatedBy: currentUser.uid
      }, { merge: true });
    } catch (error) {
      console.error("할 일 상태 저장 실패", error);
    }
  }

  function todoCalendarEvents() {
    return activeTodos()
      .filter((todo) => todo.due)
      .map((todo) => ({
        id: `todo-calendar-${todo.id}`,
        title: `${todo.client ? `${todo.client} · ` : ""}${todo.title}`,
        start: todo.due,
        end: addDays(todo.due, 1),
        allDay: true,
        extendedProps: { __nineworksTodo: true, todoId: todo.id, client: todo.client, title: todo.title, due: todo.due }
      }));
  }

  function patchCalendar() {
    if (!window.FullCalendar?.Calendar || window.FullCalendar.Calendar.__nineworksWorkspaceV2) return;
    try {
      const OriginalCalendar = window.FullCalendar.Calendar;
      class WorkspaceCalendar extends OriginalCalendar {
        constructor(element, options = {}) {
          const originalEvents = options.events;
          const originalClassNames = options.eventClassNames;
          const originalClick = options.eventClick;
          const originalDidMount = options.eventDidMount;
          const mergedOptions = {
            ...options,
            events(fetchInfo, successCallback, failureCallback) {
              const done = (baseEvents = []) => successCallback([...(baseEvents || []), ...todoCalendarEvents()]);
              if (typeof originalEvents === "function") {
                try {
                  const result = originalEvents(fetchInfo, done, failureCallback);
                  if (result && typeof result.then === "function") {
                    result.then((value) => { if (Array.isArray(value)) done(value); }).catch((error) => failureCallback?.(error));
                  }
                } catch (error) {
                  failureCallback?.(error);
                }
              } else if (Array.isArray(originalEvents)) done(originalEvents);
              else done([]);
            },
            eventClassNames(info) {
              if (info.event.extendedProps?.__nineworksTodo) return ["calendar-todo-event"];
              const result = typeof originalClassNames === "function" ? originalClassNames(info) : originalClassNames;
              return Array.isArray(result) ? result : result ? [result] : [];
            },
            eventClick(info) {
              if (info.event.extendedProps?.__nineworksTodo) {
                routeTo("dashboard");
                setTimeout(() => $("#v2QuickTodoPanel")?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
                return;
              }
              originalClick?.(info);
            },
            eventDidMount(info) {
              if (info.event.extendedProps?.__nineworksTodo) {
                info.el.title = `해야 할 일 · ${info.event.extendedProps.title || info.event.title}\n${shortDate(info.event.extendedProps.due)}`;
                return;
              }
              originalDidMount?.(info);
            }
          };
          super(element, mergedOptions);
          calendarInstance = this;
        }
      }
      WorkspaceCalendar.__nineworksWorkspaceV2 = true;
      window.FullCalendar.Calendar = WorkspaceCalendar;
    } catch (error) {
      console.warn("캘린더-할 일 연동 확장 실패", error);
    }
  }

  function subscribeCollection(name) {
    const unsubscribe = firebase.onSnapshot(firebase.collection(firebase.db, name), (snapshot) => {
      data[name] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      renderAll();
    }, (error) => console.warn(`${name} v2 동기화 실패`, error));
    unsubscribers.push(unsubscribe);
  }

  function cleanupSubscriptions() {
    while (unsubscribers.length) {
      try { unsubscribers.pop()?.(); } catch {}
    }
    data.events = [];
    data.todos = [];
    data.requests = [];
    data.clients = [];
    renderAll();
  }

  function connectFirebase() {
    firebase = window.NineworksFirebase;
    if (!firebase) return setTimeout(connectFirebase, 60);
    firebase.onAuthStateChanged(firebase.auth, (user) => {
      currentUser = user;
      cleanupSubscriptions();
      if (!user) return;
      ["events", "todos", "requests", "clients"].forEach(subscribeCollection);
    });
  }

  function syncUi() {
    normalizeNav();
    transformDashboard();
    transformSettingsPage();
    moveReminderSettingsIntoSettings();
    addThemeToggle();
  }

  function scheduleUiSync() {
    if (uiSyncQueued) return;
    uiSyncQueued = true;
    requestAnimationFrame(() => {
      uiSyncQueued = false;
      syncUi();
    });
  }

  function observeDynamicUi() {
    const observer = new MutationObserver(scheduleUiSync);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function init() {
    loadStyle();
    initTheme();
    patchCalendar();
    syncUi();
    observeDynamicUi();
    connectFirebase();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
