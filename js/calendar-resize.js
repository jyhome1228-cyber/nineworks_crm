const style = document.createElement("link");
style.rel = "stylesheet";
style.href = new URL("../css/calendar-resize.css", import.meta.url).href;
document.head.appendChild(style);

const STORAGE_KEY = "nineworks_calendar_sidebar_width";
const MIN_WIDTH = 240;
const DEFAULT_WIDTH = 300;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function notifyCalendarResize() {
  window.dispatchEvent(new Event("resize"));
}

function addShareButton() {
  const heading = document.querySelector("#calendarPage .page-heading");
  const directButton = document.querySelector("#openEventDrawer");
  if (!heading || !directButton || document.querySelector("#shareCalendarLink")) return;

  let actions = heading.querySelector(".calendar-heading-actions");
  if (!actions) {
    actions = document.createElement("div");
    actions.className = "calendar-heading-actions";
    directButton.parentNode.insertBefore(actions, directButton);
    actions.appendChild(directButton);
  }

  const link = document.createElement("a");
  link.id = "shareCalendarLink";
  link.className = "button button--primary share-calendar-link";
  link.href = new URL("../sharecalander/", import.meta.url).href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "공유 캘린더";
  actions.insertBefore(link, directButton);
}

function initializeResizeHandle() {
  const layout = document.querySelector("#calendarPage .calendar-layout");
  const calendarMain = layout?.querySelector(".calendar-main");
  const sidebar = layout?.querySelector(".schedule-side");
  if (!layout || !calendarMain || !sidebar || layout.querySelector(".calendar-resize-handle")) return;

  const saved = Number(localStorage.getItem(STORAGE_KEY));
  if (Number.isFinite(saved) && saved >= MIN_WIDTH) {
    layout.style.setProperty("--schedule-side-width", `${saved}px`);
  }

  const handle = document.createElement("div");
  handle.className = "calendar-resize-handle";
  handle.setAttribute("role", "separator");
  handle.setAttribute("aria-orientation", "vertical");
  handle.setAttribute("aria-label", "캘린더와 요약 영역 폭 조절");
  handle.tabIndex = 0;
  layout.insertBefore(handle, sidebar);

  let activePointer = null;

  function setSidebarWidth(clientX) {
    const rect = layout.getBoundingClientRect();
    const maxWidth = Math.max(MIN_WIDTH, Math.min(540, rect.width * 0.46));
    const width = clamp(rect.right - clientX - 10, MIN_WIDTH, maxWidth);
    layout.style.setProperty("--schedule-side-width", `${Math.round(width)}px`);
    localStorage.setItem(STORAGE_KEY, String(Math.round(width)));
    notifyCalendarResize();
  }

  handle.addEventListener("pointerdown", (event) => {
    if (window.matchMedia("(max-width: 1080px)").matches) return;
    activePointer = event.pointerId;
    handle.setPointerCapture(activePointer);
    handle.classList.add("is-dragging");
    layout.classList.add("is-resizing");
    event.preventDefault();
  });

  handle.addEventListener("pointermove", (event) => {
    if (activePointer !== event.pointerId) return;
    setSidebarWidth(event.clientX);
  });

  function stopResize(event) {
    if (activePointer !== event.pointerId) return;
    try {
      handle.releasePointerCapture(activePointer);
    } catch (_) {
      // Pointer may already be released.
    }
    activePointer = null;
    handle.classList.remove("is-dragging");
    layout.classList.remove("is-resizing");
    notifyCalendarResize();
  }

  handle.addEventListener("pointerup", stopResize);
  handle.addEventListener("pointercancel", stopResize);

  handle.addEventListener("dblclick", () => {
    layout.style.setProperty("--schedule-side-width", `${DEFAULT_WIDTH}px`);
    localStorage.setItem(STORAGE_KEY, String(DEFAULT_WIDTH));
    notifyCalendarResize();
  });

  handle.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home"].includes(event.key)) return;
    event.preventDefault();
    const current = parseInt(getComputedStyle(layout).getPropertyValue("--schedule-side-width"), 10) || DEFAULT_WIDTH;
    const next = event.key === "Home"
      ? DEFAULT_WIDTH
      : current + (event.key === "ArrowLeft" ? 20 : -20);
    const rect = layout.getBoundingClientRect();
    const maxWidth = Math.max(MIN_WIDTH, Math.min(540, rect.width * 0.46));
    const width = clamp(next, MIN_WIDTH, maxWidth);
    layout.style.setProperty("--schedule-side-width", `${width}px`);
    localStorage.setItem(STORAGE_KEY, String(width));
    notifyCalendarResize();
  });
}

function initialize() {
  addShareButton();
  initializeResizeHandle();

  const observer = new MutationObserver(() => {
    addShareButton();
    initializeResizeHandle();
  });
  const app = document.querySelector("#appView");
  if (app) observer.observe(app, { childList: true, subtree: true, attributes: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize, { once: true });
} else {
  initialize();
}
