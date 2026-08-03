const pageStyle = document.createElement("link");
pageStyle.rel = "stylesheet";
pageStyle.href = new URL("../css/reminder-settings-page.css?v=20260803-1", import.meta.url).href;
document.head.appendChild(pageStyle);

let reminderApi = null;
let reminderState = null;
let unsubscribeReminderState = null;
let searchTerm = "";

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function dateLabel(event) {
  const [year, month, day] = String(event.start || "").split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()] || "";
  const time = event.allDay === false || event.startTime
    ? `${event.startTime || "09:00"}${event.endTime ? `–${event.endTime}` : ""}`
    : "종일";
  return { date: `${month}.${pad(day)} (${weekday})`, time };
}

function offsetLabel(value) {
  const number = Number(value);
  if (number === 0) return "시작 시간";
  if (number === 60) return "1시간 전";
  return `${number}분 전`;
}

function createNavAndPage() {
  const nav = document.querySelector(".main-nav");
  if (nav && !document.querySelector('[data-route="reminder-settings"]')) {
    const button = document.createElement("button");
    button.className = "nav-link";
    button.type = "button";
    button.dataset.route = "reminder-settings";
    button.textContent = "알림관리";
    nav.appendChild(button);
    button.addEventListener("click", routeToReminderSettings);
  }

  if (document.querySelector("#reminderSettingsPage")) return;
  const appContent = document.querySelector(".app-content");
  if (!appContent) return;

  const page = document.createElement("main");
  page.id = "reminderSettingsPage";
  page.className = "page";
  page.dataset.page = "reminder-settings";
  page.innerHTML = `
    <section class="reminder-page-heading">
      <div>
        <p class="eyebrow">PERSONAL REMINDER</p>
        <h1>내 업무 알림을 관리합니다.</h1>
        <p>전체 알림과 소리를 켜거나 끄고, 일정별 알림 시간을 개인 계정 기준으로 설정합니다.</p>
      </div>
      <button id="reminderPageTest" class="button button--ghost" type="button">테스트 알림</button>
    </section>

    <section class="reminder-status-grid">
      <article class="reminder-status-card"><span>브라우저 권한</span><strong id="reminderPermissionStatus">확인 중</strong></article>
      <article class="reminder-status-card"><span>내 알림 상태</span><strong id="reminderGlobalStatus">꺼짐</strong></article>
      <article class="reminder-status-card"><span>알림 예정 일정</span><strong id="reminderUpcomingCount">0건</strong></article>
    </section>

    <section class="reminder-settings-layout">
      <article class="panel reminder-settings-panel">
        <div class="reminder-panel-title">
          <div><p class="eyebrow">MY SETTINGS</p><h2>개인 알림 설정</h2><p>이 설정은 현재 로그인한 계정에만 적용됩니다.</p></div>
        </div>
        <div class="reminder-setting-list">
          <div class="reminder-setting-row">
            <div class="reminder-setting-copy"><strong>전체 업무 알림</strong><small>크롬 팝업 알림을 모두 켜거나 끕니다.</small></div>
            <label class="reminder-switch"><input id="reminderGlobalToggle" type="checkbox" /><span></span></label>
          </div>
          <div class="reminder-setting-row">
            <div class="reminder-setting-copy"><strong>알림 소리</strong><small>팝업과 함께 나인웍스 알림음을 재생합니다.</small></div>
            <label class="reminder-switch"><input id="reminderSoundToggle" type="checkbox" /><span></span></label>
          </div>
          <div class="reminder-setting-row">
            <div class="reminder-setting-copy"><strong>내 담당 일정만</strong><small>담당자가 내 이름인 일정만 알림을 받습니다.</small></div>
            <label class="reminder-switch"><input id="reminderAssignedToggle" type="checkbox" /><span></span></label>
          </div>
          <div class="reminder-setting-row">
            <div class="reminder-setting-copy"><strong>종일 일정 알림 시간</strong><small>시간이 없는 일정은 선택한 시각에 알려드립니다.</small></div>
            <input id="reminderAllDayTime" class="reminder-time-input" type="time" step="1800" />
          </div>
          <div class="reminder-setting-row" style="align-items:flex-start;flex-direction:column;">
            <div class="reminder-setting-copy"><strong>기본 알림 시점</strong><small>별도 설정이 없는 일정에 적용됩니다.</small></div>
            <div id="reminderDefaultOffsets" class="reminder-offset-group">
              ${[60, 30, 10, 0].map((value) => `<label class="reminder-offset-chip"><input type="checkbox" value="${value}" /><span>${offsetLabel(value)}</span></label>`).join("")}
            </div>
          </div>
        </div>
        <div class="reminder-settings-actions">
          <button id="reminderPermissionButton" class="button button--primary" type="button">알림 권한 켜기</button>
          <button id="reminderSettingsTest" class="button button--ghost" type="button">테스트</button>
        </div>
      </article>

      <article class="panel reminder-events-panel">
        <div class="reminder-panel-title">
          <div><p class="eyebrow">UPCOMING SCHEDULE</p><h2>일정별 알림</h2><p>앞으로 60일 이내의 일정 중 알림을 받을 항목을 선택합니다.</p></div>
          <div class="reminder-events-toolbar"><input id="reminderEventSearch" type="search" placeholder="브랜드·일정 검색" /></div>
        </div>
        <div id="reminderEventList" class="reminder-event-list"></div>
      </article>
    </section>`;
  appContent.appendChild(page);
  bindPageEvents();
}

function routeToReminderSettings() {
  document.querySelectorAll("[data-page]").forEach((page) => page.classList.toggle("is-active", page.dataset.page === "reminder-settings"));
  document.querySelectorAll(".nav-link").forEach((button) => button.classList.toggle("is-active", button.dataset.route === "reminder-settings"));
  window.scrollTo({ top: 0, behavior: "smooth" });
  renderPage();
}

function upcomingEvents() {
  if (!reminderState) return [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const limit = new Date(now);
  limit.setDate(limit.getDate() + 60);
  const startKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const endKey = `${limit.getFullYear()}-${pad(limit.getMonth() + 1)}-${pad(limit.getDate())}`;
  return reminderState.events
    .filter((event) => event.status !== "done" && event.start >= startKey && event.start <= endKey)
    .filter((event) => {
      const haystack = `${event.title || ""} ${event.client || ""} ${event.member || ""}`.toLowerCase();
      return !searchTerm || haystack.includes(searchTerm);
    })
    .sort((a, b) => String(a.start).localeCompare(String(b.start)) || String(a.startTime || "").localeCompare(String(b.startTime || "")));
}

function eventRowMarkup(event) {
  const config = reminderApi.getEventConfig(event);
  const labels = dateLabel(event);
  const hasOverride = config.source === "personal";
  return `
    <div class="reminder-event-row ${config.enabled ? "" : "is-disabled"}" data-reminder-event="${escapeHtml(event.id)}">
      <div class="reminder-event-date"><strong>${escapeHtml(labels.date)}</strong><span>${escapeHtml(labels.time)}</span></div>
      <div class="reminder-event-body">
        <button class="reminder-event-title" type="button" data-open-reminder-event="${escapeHtml(event.id)}">${event.category === "미팅" ? "★ " : ""}${escapeHtml(event.client ? `${event.client} · ${event.title}` : event.title || "일정")}</button>
        <div class="reminder-event-meta">${escapeHtml([event.member, event.category, hasOverride ? "개인 설정" : "기본 설정"].filter(Boolean).join(" · "))}</div>
      </div>
      <div class="reminder-event-controls">
        <div class="reminder-event-control-top">
          ${hasOverride ? `<button class="reminder-reset-button" type="button" data-reset-reminder-event="${escapeHtml(event.id)}">기본값 복원</button>` : ""}
          <label class="reminder-switch"><input type="checkbox" data-toggle-reminder-event="${escapeHtml(event.id)}" ${config.enabled ? "checked" : ""} /><span></span></label>
        </div>
        <div class="event-reminder-offsets">
          ${[60, 30, 10, 0].map((value) => `<label class="reminder-offset-chip"><input type="checkbox" data-event-offset="${escapeHtml(event.id)}" value="${value}" ${config.offsets.includes(value) ? "checked" : ""} /><span>${offsetLabel(value)}</span></label>`).join("")}
        </div>
      </div>
    </div>`;
}

function renderPage() {
  if (!reminderState || !document.querySelector("#reminderSettingsPage")) return;
  const settings = reminderState.settings;
  const permissionText = reminderState.permission === "granted" ? "허용됨" : reminderState.permission === "denied" ? "차단됨" : reminderState.permission === "unsupported" ? "지원 안 함" : "허용 필요";
  document.querySelector("#reminderPermissionStatus").textContent = permissionText;
  document.querySelector("#reminderGlobalStatus").textContent = settings.enabled ? "켜짐" : "꺼짐";

  const globalToggle = document.querySelector("#reminderGlobalToggle");
  const soundToggle = document.querySelector("#reminderSoundToggle");
  const assignedToggle = document.querySelector("#reminderAssignedToggle");
  const allDayTime = document.querySelector("#reminderAllDayTime");
  if (globalToggle) globalToggle.checked = settings.enabled;
  if (soundToggle) soundToggle.checked = settings.soundEnabled;
  if (assignedToggle) assignedToggle.checked = settings.onlyAssigned;
  if (allDayTime) allDayTime.value = settings.allDayTime;

  document.querySelectorAll("#reminderDefaultOffsets input").forEach((input) => {
    input.checked = settings.defaultOffsets.includes(Number(input.value));
  });

  const list = upcomingEvents();
  document.querySelector("#reminderUpcomingCount").textContent = `${list.filter((event) => reminderApi.getEventConfig(event).enabled).length}건`;
  const eventList = document.querySelector("#reminderEventList");
  eventList.innerHTML = list.length ? list.map(eventRowMarkup).join("") : '<p class="reminder-empty">설정할 예정 일정이 없습니다.</p>';

  const testButtons = [document.querySelector("#reminderPageTest"), document.querySelector("#reminderSettingsTest")];
  testButtons.forEach((button) => { if (button) button.disabled = !(settings.enabled && reminderState.permission === "granted"); });
  const permissionButton = document.querySelector("#reminderPermissionButton");
  if (permissionButton) permissionButton.textContent = settings.enabled ? "알림 켜짐" : "알림 권한 켜기";
}

async function updateEventFromRow(eventId) {
  const row = document.querySelector(`[data-reminder-event="${CSS.escape(eventId)}"]`);
  if (!row) return;
  const enabled = row.querySelector(`[data-toggle-reminder-event="${CSS.escape(eventId)}"]`)?.checked ?? true;
  const offsets = [...row.querySelectorAll(`[data-event-offset="${CSS.escape(eventId)}"]:checked`)].map((input) => Number(input.value));
  await reminderApi.setEventOverride(eventId, { enabled, offsets: offsets.length ? offsets : [0] });
}

function bindPageEvents() {
  document.querySelector("#reminderGlobalToggle")?.addEventListener("change", async (event) => {
    try {
      if (event.target.checked) await reminderApi.requestEnable();
      else await reminderApi.disable();
    } catch {
      event.target.checked = false;
    }
  });
  document.querySelector("#reminderSoundToggle")?.addEventListener("change", (event) => reminderApi.setSettings({ soundEnabled: event.target.checked }));
  document.querySelector("#reminderAssignedToggle")?.addEventListener("change", (event) => reminderApi.setSettings({ onlyAssigned: event.target.checked }));
  document.querySelector("#reminderAllDayTime")?.addEventListener("change", (event) => reminderApi.setSettings({ allDayTime: event.target.value }));
  document.querySelector("#reminderDefaultOffsets")?.addEventListener("change", () => {
    const offsets = [...document.querySelectorAll("#reminderDefaultOffsets input:checked")].map((input) => Number(input.value));
    reminderApi.setSettings({ defaultOffsets: offsets.length ? offsets : [0] });
  });
  document.querySelector("#reminderPermissionButton")?.addEventListener("click", () => reminderApi.requestEnable().catch(() => {}));
  document.querySelector("#reminderPageTest")?.addEventListener("click", () => reminderApi.sendTest());
  document.querySelector("#reminderSettingsTest")?.addEventListener("click", () => reminderApi.sendTest());
  document.querySelector("#reminderEventSearch")?.addEventListener("input", (event) => { searchTerm = event.target.value.trim().toLowerCase(); renderPage(); });

  document.querySelector("#reminderEventList")?.addEventListener("change", (event) => {
    const id = event.target.dataset.toggleReminderEvent || event.target.dataset.eventOffset;
    if (id) updateEventFromRow(id);
  });
  document.querySelector("#reminderEventList")?.addEventListener("click", async (event) => {
    const open = event.target.closest("[data-open-reminder-event]");
    if (open) reminderApi.openEvent(open.dataset.openReminderEvent);
    const reset = event.target.closest("[data-reset-reminder-event]");
    if (reset) await reminderApi.resetEventOverride(reset.dataset.resetReminderEvent);
  });
}

function initializeReminderPage() {
  reminderApi = window.NineworksReminder;
  if (!reminderApi) {
    window.setTimeout(initializeReminderPage, 180);
    return;
  }
  createNavAndPage();
  unsubscribeReminderState?.();
  unsubscribeReminderState = reminderApi.subscribe((state) => {
    reminderState = state;
    renderPage();
  });
  window.addEventListener("nineworks:open-reminder-settings", routeToReminderSettings);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initializeReminderPage, { once: true });
else initializeReminderPage();
