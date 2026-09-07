(() => {
  "use strict";

  const STYLE_ID = "nineworks-calendar-card-meta-style";
  const FullCalendar = window.FullCalendar;
  const CurrentCalendar = FullCalendar?.Calendar;
  if (!CurrentCalendar || FullCalendar.__nineworksCalendarCardMeta) return;

  const pad = (value) => String(value).padStart(2, "0");
  const toDateKey = (value) => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };

  function inclusiveEndKey(info, data = {}) {
    if (data.end) return String(data.end);
    if (!info?.event?.end) return data.start || toDateKey(info?.event?.start);
    const end = new Date(info.event.end);
    if (info.event.allDay) end.setDate(end.getDate() - 1);
    return toDateKey(end);
  }

  function shortDate(key = "") {
    const [year, month, day] = String(key).split("-").map(Number);
    if (!year || !month || !day) return "";
    return `${month}.${day}`;
  }

  function periodLabel(start = "", end = "") {
    const from = shortDate(start);
    const to = shortDate(end || start);
    if (!from) return "";
    return from === to ? from : `${from}–${to}`;
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const link = document.createElement("link");
    link.id = STYLE_ID;
    link.rel = "stylesheet";
    link.href = new URL("../css/calendar-card-meta.css?v=20260907-1", import.meta.url).href;
    document.head.appendChild(link);
  }

  function createMetaEventContent(info) {
    const data = info.event.extendedProps || {};
    const wrapper = document.createElement("div");
    wrapper.className = "nw-event-content nw-event-content--meta";

    const title = document.createElement("strong");
    title.className = "nw-event-title";
    title.dataset.nwHierarchyReady = "true";

    if (data.client) {
      const badge = document.createElement("span");
      badge.className = "nw-client-badge";
      badge.textContent = data.client;
      badge.title = data.client;
      title.appendChild(badge);
    }

    const task = document.createElement("span");
    task.className = "nw-task-title";
    task.textContent = data.title || info.event.title || "일정";
    task.title = task.textContent;
    title.appendChild(task);
    wrapper.appendChild(title);

    const startKey = data.start || toDateKey(info.event.start);
    const endKey = inclusiveEndKey(info, data) || startKey;
    const assignee = data.member || (data.__nineworksTodo ? "할 일" : "담당 미지정");
    const period = periodLabel(startKey, endKey);

    const meta = document.createElement("div");
    meta.className = "nw-event-meta";

    const member = document.createElement("span");
    member.className = "nw-event-assignee";
    member.textContent = assignee;
    meta.appendChild(member);

    if (period) {
      const separator = document.createElement("span");
      separator.className = "nw-event-meta-separator";
      separator.textContent = "·";
      meta.appendChild(separator);

      const periodNode = document.createElement("span");
      periodNode.className = "nw-event-period";
      periodNode.textContent = period;
      periodNode.dataset.start = startKey;
      periodNode.dataset.end = endKey;
      meta.appendChild(periodNode);
    }

    wrapper.appendChild(meta);
    return { domNodes: [wrapper] };
  }

  class CalendarCardMetaCalendar extends CurrentCalendar {
    constructor(element, options = {}) {
      super(element, options);
      this.setOption("eventContent", createMetaEventContent);
    }
  }

  FullCalendar.Calendar = CalendarCardMetaCalendar;
  FullCalendar.__nineworksCalendarCardMeta = true;

  function drawerPeriodLabel(start = "", end = "") {
    if (!start) return "일정 미정";
    const normalizedEnd = end || start;
    return start === normalizedEnd ? start.replaceAll("-", ".") : `${start.replaceAll("-", ".")}–${normalizedEnd.replaceAll("-", ".")}`;
  }

  function ensureDrawerMeta() {
    const form = document.querySelector("#eventForm");
    if (!form) return null;

    let root = document.querySelector("#eventScheduleMeta");
    if (!root) {
      root = document.createElement("div");
      root.id = "eventScheduleMeta";
      root.innerHTML = `
        <div class="event-schedule-meta__item">
          <span>담당자</span>
          <strong id="eventScheduleMetaMember">담당 미지정</strong>
        </div>
        <div class="event-schedule-meta__item">
          <span>작업기간</span>
          <strong id="eventScheduleMetaPeriod">일정 미정</strong>
        </div>`;

      const actions = form.querySelector(".drawer__actions");
      if (actions) actions.insertAdjacentElement("beforebegin", root);
      else form.appendChild(root);
    }
    return root;
  }

  function syncDrawerMeta() {
    const root = ensureDrawerMeta();
    if (!root) return;
    const member = document.querySelector("#eventMember")?.value || "담당 미지정";
    const start = document.querySelector("#eventStart")?.value || "";
    const end = document.querySelector("#eventEnd")?.value || start;
    const memberNode = document.querySelector("#eventScheduleMetaMember");
    const periodNode = document.querySelector("#eventScheduleMetaPeriod");
    if (memberNode) memberNode.textContent = member;
    if (periodNode) periodNode.textContent = drawerPeriodLabel(start, end);
  }

  function bindDrawerMeta() {
    const form = document.querySelector("#eventForm");
    const drawer = document.querySelector("#eventDrawer");
    if (!form || !drawer) {
      window.setTimeout(bindDrawerMeta, 180);
      return;
    }

    ensureDrawerMeta();
    syncDrawerMeta();

    ["#eventMember", "#eventStart", "#eventEnd"].forEach((selector) => {
      const input = document.querySelector(selector);
      if (!input || input.dataset.nwMetaBound === "true") return;
      input.dataset.nwMetaBound = "true";
      input.addEventListener("change", syncDrawerMeta);
      input.addEventListener("input", syncDrawerMeta);
    });

    if (drawer.dataset.nwMetaObserver !== "true") {
      drawer.dataset.nwMetaObserver = "true";
      new MutationObserver(() => {
        if (!drawer.classList.contains("is-open")) return;
        window.setTimeout(syncDrawerMeta, 60);
        window.setTimeout(syncDrawerMeta, 180);
      }).observe(drawer, { attributes: true, attributeFilter: ["class"] });
    }
  }

  function init() {
    ensureStyle();
    bindDrawerMeta();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
