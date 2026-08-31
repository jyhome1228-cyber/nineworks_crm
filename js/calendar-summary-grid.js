const summaryStyle = document.createElement("link");
summaryStyle.rel = "stylesheet";
summaryStyle.href = new URL("../css/calendar-summary-grid.css?v=20260831-2", import.meta.url).href;
document.head.appendChild(summaryStyle);

let unsubscribeWeeklyEvents = null;
let currentWeeklyEvents = [];

function pad(value) {
  return String(value).padStart(2, "0");
}

function dateKey(date) {
  const value = new Date(date);
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

function fromDateKey(key) {
  const [year, month, day] = String(key).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date, amount) {
  const value = new Date(date);
  value.setDate(value.getDate() + amount);
  return value;
}

function getCurrentWeekRange() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = addDays(today, -today.getDay());
  const end = addDays(start, 6);
  return { start: dateKey(start), end: dateKey(end) };
}

function weekdayLabel(key) {
  const date = fromDateKey(key);
  return ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
}

function shortDateLabel(key) {
  const date = fromDateKey(key);
  return `${date.getMonth() + 1}.${date.getDate()}`;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function ensureSummaryLayout() {
  const layout = document.querySelector(".calendar-layout");
  const side = layout?.querySelector(".schedule-side");
  if (!layout || !side) return false;

  layout.dataset.summaryLayout = "true";
  layout.querySelectorAll(".calendar-resize-handle").forEach((element) => element.remove());

  let panel = document.querySelector("#weeklyWorkPanel");
  if (!panel) {
    panel = document.createElement("section");
    panel.id = "weeklyWorkPanel";
    panel.className = "panel side-panel";
    panel.innerHTML = `
      <div class="panel-heading">
        <div>
          <p class="eyebrow">THIS WEEK</p>
          <h2>주간 업무일정</h2>
        </div>
        <span id="weeklyWorkCount" class="count-badge">0</span>
      </div>
      <div id="weeklyWorkList" class="compact-list"></div>
    `;
  }

  // Weekly work is the primary summary, so keep it first even when other modules re-render the side area.
  if (side.firstElementChild !== panel) side.insertBefore(panel, side.firstElementChild);

  window.setTimeout(() => window.dispatchEvent(new Event("resize")), 80);
  return true;
}

function weeklyEventMarkup(event) {
  const start = event.start || event.end;
  return `
    <button class="weekly-work-item" type="button" data-open-event="${escapeHtml(event.id)}">
      <span class="weekly-work-item__date">
        <span>${escapeHtml(weekdayLabel(start))}</span>
        <strong>${escapeHtml(shortDateLabel(start))}</strong>
      </span>
      <span class="weekly-work-item__body">
        <strong class="weekly-work-item__title">${escapeHtml(event.title || "일정")}</strong>
        <small class="weekly-work-item__meta">${escapeHtml([event.client, event.member].filter(Boolean).join(" · "))}</small>
      </span>
    </button>
  `;
}

function renderWeeklyEvents() {
  const list = document.querySelector("#weeklyWorkList");
  const count = document.querySelector("#weeklyWorkCount");
  if (!list || !count) return;

  const { start, end } = getCurrentWeekRange();
  const events = currentWeeklyEvents
    .filter((event) => {
      const eventStart = event.start || event.end || "";
      const eventEnd = event.end || event.start || "";
      return event.status !== "done" && eventStart <= end && eventEnd >= start;
    })
    .sort((a, b) => String(a.start || "").localeCompare(String(b.start || "")));

  count.textContent = String(events.length);
  list.innerHTML = events.length
    ? events.slice(0, 8).map(weeklyEventMarkup).join("")
    : '<p class="empty-state">이번 주 예정된 업무가 없습니다.</p>';
}

function subscribeWeeklyEvents() {
  const api = window.NineworksFirebase;
  if (!api?.auth || !api?.db || !api?.onAuthStateChanged) {
    window.setTimeout(subscribeWeeklyEvents, 250);
    return;
  }

  api.onAuthStateChanged(api.auth, (user) => {
    unsubscribeWeeklyEvents?.();
    unsubscribeWeeklyEvents = null;
    currentWeeklyEvents = [];
    renderWeeklyEvents();

    if (!user) return;
    unsubscribeWeeklyEvents = api.onSnapshot(
      api.collection(api.db, "events"),
      (snapshot) => {
        currentWeeklyEvents = snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
        renderWeeklyEvents();
      },
      (error) => console.warn("주간 업무일정 불러오기 실패", error)
    );
  });
}

function initializeSummaryGrid() {
  if (!ensureSummaryLayout()) {
    window.setTimeout(initializeSummaryGrid, 200);
    return;
  }

  const layout = document.querySelector(".calendar-layout");
  if (layout && !layout.dataset.summaryObserverReady) {
    layout.dataset.summaryObserverReady = "true";
    const observer = new MutationObserver(() => {
      layout.querySelectorAll(".calendar-resize-handle").forEach((element) => element.remove());
      ensureSummaryLayout();
    });
    observer.observe(layout, { childList: true, subtree: true });
  }

  renderWeeklyEvents();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeSummaryGrid, { once: true });
} else {
  initializeSummaryGrid();
}

subscribeWeeklyEvents();
