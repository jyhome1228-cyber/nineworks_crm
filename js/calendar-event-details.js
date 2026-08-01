const api = window.NineworksFirebase;

const style = document.createElement("link");
style.rel = "stylesheet";
style.href = new URL("../css/calendar-event-details.css", import.meta.url).href;
document.head.appendChild(style);

let events = [];
let unsubscribeEvents = null;
let renderQueued = false;

function normalize(value = "") {
  return String(value).replace(/\s+/g, " ").trim().toLowerCase();
}

function cleanMemo(value = "") {
  const marker = "[원본·참고 내용]";
  const beforeReference = String(value).split(marker)[0];
  const line = beforeReference
    .split(/\r?\n/)
    .map((item) => item.trim())
    .find(Boolean) || "";
  return line.length > 46 ? `${line.slice(0, 46)}…` : line;
}

function eventKey(item) {
  return normalize(`${item.client || ""} · ${item.title || ""}`);
}

function buildEventMap() {
  const map = new Map();
  events.forEach((item) => map.set(eventKey(item), item));
  return map;
}

function findEventForElement(element, map) {
  const titleAttribute = String(element.getAttribute("title") || "").split("\n")[0];
  const titleElement = element.querySelector(".fc-event-title");
  const visibleTitle = titleElement?.textContent || "";
  const exact = map.get(normalize(titleAttribute)) || map.get(normalize(visibleTitle));
  if (exact) return exact;

  const normalizedVisible = normalize(visibleTitle || titleAttribute);
  return events.find((item) => {
    const title = normalize(item.title);
    const client = normalize(item.client);
    return normalizedVisible.includes(title) && (!client || normalizedVisible.includes(client));
  }) || null;
}

function renderEventDetails() {
  renderQueued = false;
  const calendar = document.querySelector("#calendar");
  if (!calendar) return;

  const map = buildEventMap();
  calendar.querySelectorAll(".fc-daygrid-event, .fc-timegrid-event").forEach((element) => {
    const item = findEventForElement(element, map);
    if (!item) return;

    const container = element.querySelector(".fc-event-main-frame") || element.querySelector(".fc-event-main");
    if (!container) return;

    let note = container.querySelector(".fc-event-note");
    if (!note) {
      note = document.createElement("span");
      note.className = "fc-event-note";
      container.appendChild(note);
    }

    const memo = cleanMemo(item.memo);
    note.textContent = memo || [item.member, item.category].filter(Boolean).join(" · ");
    note.hidden = !note.textContent;

    const fullText = [
      `${item.client || ""} · ${item.title || ""}`,
      memo,
      [item.member, item.category].filter(Boolean).join(" · ")
    ].filter(Boolean).join("\n");
    element.setAttribute("title", fullText);
  });
}

function queueRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(renderEventDetails);
}

function observeCalendar() {
  const calendar = document.querySelector("#calendar");
  if (!calendar) {
    window.setTimeout(observeCalendar, 300);
    return;
  }

  const observer = new MutationObserver(queueRender);
  observer.observe(calendar, { childList: true, subtree: true });
  queueRender();
}

function subscribeEvents(user) {
  unsubscribeEvents?.();
  unsubscribeEvents = null;
  events = [];
  queueRender();

  if (!user || !api) return;
  unsubscribeEvents = api.onSnapshot(api.collection(api.db, "events"), (snapshot) => {
    events = snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
    queueRender();
  });
}

function initialize() {
  observeCalendar();
  api?.onAuthStateChanged(api.auth, subscribeEvents);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize, { once: true });
} else {
  initialize();
}
