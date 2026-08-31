(() => {
  "use strict";

  let normalized = false;
  let observer = null;
  let attempts = 0;

  function normalizeInitialView() {
    if (normalized) return;
    const calendar = document.querySelector("#calendar");
    if (!calendar) return false;

    const monthButton = calendar.querySelector(".fc-dayGridMonth-button");
    if (!monthButton) return false;

    const weekView = calendar.querySelector(".fc-dayGridWeek-view, .fc-timeGridWeek-view");
    const monthView = calendar.querySelector(".fc-dayGridMonth-view");

    normalized = true;
    if (!monthView && weekView) {
      monthButton.click();
    }

    requestAnimationFrame(() => {
      calendar.querySelectorAll(".fc-button").forEach((button) => button.blur());
    });
    observer?.disconnect();
    observer = null;
    return true;
  }

  function tryNormalize() {
    if (normalizeInitialView()) return;
    attempts += 1;
    if (attempts < 20) window.setTimeout(tryNormalize, 120);
  }

  function init() {
    const calendar = document.querySelector("#calendar");
    if (calendar) {
      observer = new MutationObserver(() => normalizeInitialView());
      observer.observe(calendar, { childList: true, subtree: true });
    }
    tryNormalize();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
