const style = document.createElement("link");
style.rel = "stylesheet";
style.href = new URL("../css/task-completion.css", import.meta.url).href;
document.head.appendChild(style);

const $ = (selector, scope = document) => scope.querySelector(selector);

function goCalendarHome() {
  const calendarNav = $('.nav-link[data-route="calendar"]');
  if (calendarNav) {
    calendarNav.click();
  } else {
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

  const observer = new MutationObserver(() => {
    window.setTimeout(updateQuickCompleteButton, 80);
  });
  observer.observe(drawer, { attributes: true, attributeFilter: ["class"] });
}

function initialize() {
  bindLogoHome();
  bindQuickComplete();
  updateQuickCompleteButton();

  const observer = new MutationObserver(() => {
    bindLogoHome();
    bindQuickComplete();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize, { once: true });
} else {
  initialize();
}
