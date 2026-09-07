const VERSION = "20260907-6";
const STYLE_ID = "nineworks-task-completion-style";
const $ = (selector, scope = document) => scope.querySelector(selector);

let eventRecords = [];
let unsubscribeEvents = null;
let renderQueued = false;

function loadStyle() {
  let link = document.getElementById(STYLE_ID);
  if (!link) {
    link = document.createElement("link");
    link.id = STYLE_ID;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  link.href = new URL(`../css/task-completion.css?v=${VERSION}`, import.meta.url).href;
}

function normalize(value = "") {
  return String(value).replace(/\s+/g, " ").trim().toLowerCase();
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

function goCalendarHome() {
  const calendarNav = $('.nav-link[data-route="calendar"]');
  if (calendarNav) calendarNav.click();
  else {
    document.querySelectorAll("[data-page]").forEach((page) => {
      page.classList.toggle("is-active", page.dataset.page === "calendar");
    });
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function bindLogoHome() {
  const logo = $(".brand--button");
  if (!logo || logo.dataset.homeBound === "true") return;
  logo.dataset.homeBound = "true";
  logo.setAttribute("title", "캘린더 홈으로 이동");
  logo.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    goCalendarHome();
  }, true);
}

function createQuickCompleteButton() {
  const header = $("#eventDrawer .drawer__header");
  const closeButton = $("#closeEventDrawer");
  if (!header || !closeButton) return null;

  let actions = $(".drawer__header-actions", header);
  if (!actions) {
    actions = document.createElement("div");
    actions.className = "drawer__header-actions";
    header.appendChild(actions);
    actions.appendChild(closeButton);
  }

  let button = $("#quickCompleteEvent", actions);
  if (!button) {
    button = document.createElement("button");
    button.id = "quickCompleteEvent";
    button.className = "quick-complete-button";
    button.type = "button";
    button.hidden = true;
    actions.insertBefore(button, closeButton);
  }
  return button;
}

function updateQuickCompleteButton() {
  const button = createQuickCompleteButton();
  const drawer = $("#eventDrawer");
  const status = $("#eventStatus");
  const eventId = $("#eventId");
  if (!button || !drawer || !status || !eventId) return;

  const isOpen = drawer.classList.contains("is-open");
  button.hidden = !isOpen || !eventId.value;
  if (button.hidden) return;

  const completed = status.value === "done";
  button.classList.toggle("is-completed", completed);
  button.setAttribute("aria-label", completed ? "일정을 다시 진행 상태로 변경" : "일정을 완료 처리");
  button.innerHTML = completed
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7M3 4v6h6" /></svg><span>다시 진행</span>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg><span>완료 처리</span>';
}

function bindQuickComplete() {
  const button = createQuickCompleteButton();
  const form = $("#eventForm");
  const status = $("#eventStatus");
  const drawer = $("#eventDrawer");
  if (!button || !form || !status || !drawer || button.dataset.bound === "true") return;

  button.dataset.bound = "true";
  button.addEventListener("click", () => {
    const completed = status.value === "done";
    status.value = completed ? "progress" : "done";
    status.dispatchEvent(new Event("change", { bubbles: true }));
    updateQuickCompleteButton();
    form.requestSubmit();
  });
  status.addEventListener("change", updateQuickCompleteButton);

  new MutationObserver(() => window.setTimeout(updateQuickCompleteButton, 60))
    .observe(drawer, { attributes: true, attributeFilter: ["class"] });
}

function recordForElement(element) {
  const directId = element.dataset.nwEventId || element.dataset.completionEventId || "";
  if (directId) {
    const direct = eventRecords.find((item) => item.id === directId);
    if (direct) return direct;
  }

  const client = normalize(element.querySelector(".nw-client-badge")?.textContent || "");
  const title = normalize(element.querySelector(".nw-task-title")?.textContent || "");
  if (client || title) {
    const match = eventRecords.find((item) => normalize(item.client) === client && normalize(item.title) === title);
    if (match) return match;
  }

  const visible = normalize(element.querySelector(".nw-event-title")?.textContent || element.textContent || "");
  return eventRecords.find((item) => {
    const itemClient = normalize(item.client);
    const itemTitle = normalize(item.title);
    return itemTitle && visible.includes(itemTitle) && (!itemClient || visible.includes(itemClient));
  }) || null;
}

function setElementCompletion(element, completed) {
  ["planned", "progress", "review", "done"].forEach((status) => element.classList.remove(`event-status-${status}`));
  element.classList.add(`event-status-${completed ? "done" : "progress"}`);
  element.classList.toggle("nw-is-completed", completed);

  const control = element.querySelector(".nw-event-complete-toggle");
  if (control) {
    control.classList.toggle("is-checked", completed);
    control.setAttribute("aria-checked", completed ? "true" : "false");
    control.setAttribute("aria-label", completed ? "완료됨. 다시 진행하려면 선택" : "완료 처리");
    control.title = completed ? "완료됨 · 클릭하면 다시 진행" : "클릭하여 완료 처리";
  }
}

async function toggleCalendarCompletion(element, control) {
  if (control.dataset.saving === "true") return;
  const record = recordForElement(element);
  const eventId = record?.id || element.dataset.completionEventId || element.dataset.nwEventId;
  const api = window.NineworksFirebase;
  if (!eventId || !api?.auth?.currentUser) {
    showToast("일정 정보를 확인한 뒤 다시 시도해주세요.");
    return;
  }

  const completed = record ? record.status === "done" : element.classList.contains("event-status-done");
  const nextStatus = completed ? "progress" : "done";
  control.dataset.saving = "true";
  control.classList.add("is-saving");
  setElementCompletion(element, !completed);

  try {
    await api.setDoc(api.doc(api.db, "events", eventId), {
      status: nextStatus,
      updatedAt: api.serverTimestamp()
    }, { merge: true });
    showToast(nextStatus === "done" ? "일정을 완료했습니다." : "일정을 다시 진행 상태로 변경했습니다.");
  } catch (error) {
    console.warn("일정 완료 상태 저장 실패", error);
    setElementCompletion(element, completed);
    showToast("완료 상태를 저장하지 못했습니다.");
  } finally {
    control.dataset.saving = "false";
    control.classList.remove("is-saving");
  }
}

function createCompletionControl(element, record) {
  const titleRow = element.querySelector(".nw-event-title") || element.querySelector(".fc-event-title-container") || element.querySelector(".fc-event-main");
  if (!titleRow) return;

  let control = element.querySelector(".nw-event-complete-toggle");
  if (!control) {
    control = document.createElement("span");
    control.className = "nw-event-complete-toggle";
    control.setAttribute("role", "checkbox");
    control.setAttribute("tabindex", "0");
    control.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8.2 2.8 2.8 6.2-6.3" /></svg>';

    ["pointerdown", "mousedown", "touchstart"].forEach((type) => {
      control.addEventListener(type, (event) => event.stopPropagation(), { passive: type === "touchstart" });
    });
    control.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleCalendarCompletion(element, control);
    });
    control.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      event.stopPropagation();
      toggleCalendarCompletion(element, control);
    });
    titleRow.insertBefore(control, titleRow.firstChild);
  }

  if (record?.id) element.dataset.completionEventId = record.id;
  setElementCompletion(element, record?.status === "done" || element.classList.contains("event-status-done"));
}

function renderCalendarCompletionControls() {
  renderQueued = false;
  const calendar = document.querySelector("#calendar");
  if (!calendar) return;
  calendar.querySelectorAll(".fc-daygrid-event, .fc-timegrid-event").forEach((element) => {
    createCompletionControl(element, recordForElement(element));
  });
}

function queueCalendarControls() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(renderCalendarCompletionControls);
}

function observeCalendar() {
  const calendar = document.querySelector("#calendar");
  if (!calendar) {
    window.setTimeout(observeCalendar, 180);
    return;
  }
  if (calendar.dataset.completionObserver === "true") return;
  calendar.dataset.completionObserver = "true";
  new MutationObserver(queueCalendarControls).observe(calendar, { childList: true, subtree: true });
  queueCalendarControls();
}

function subscribeEvents() {
  const api = window.NineworksFirebase;
  if (!api?.auth || !api?.onAuthStateChanged) {
    window.setTimeout(subscribeEvents, 180);
    return;
  }
  if (document.documentElement.dataset.completionSubscription === "true") return;
  document.documentElement.dataset.completionSubscription = "true";

  api.onAuthStateChanged(api.auth, (user) => {
    unsubscribeEvents?.();
    unsubscribeEvents = null;
    eventRecords = [];
    if (!user) {
      queueCalendarControls();
      return;
    }
    unsubscribeEvents = api.onSnapshot(api.collection(api.db, "events"), (snapshot) => {
      eventRecords = snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
      queueCalendarControls();
    });
  });
}

function initialize() {
  loadStyle();
  bindLogoHome();
  bindQuickComplete();
  updateQuickCompleteButton();
  observeCalendar();
  subscribeEvents();

  new MutationObserver(() => {
    bindLogoHome();
    bindQuickComplete();
    queueCalendarControls();
  }).observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
else initialize();
