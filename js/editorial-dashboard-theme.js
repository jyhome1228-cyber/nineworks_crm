(() => {
  "use strict";

  const STYLE_ID = "nineworks-editorial-dashboard-theme";
  const CALENDAR_DETAIL_STYLE_ID = "nineworks-calendar-editorial-detail";

  function ensureEditorialStyle() {
    let link = document.getElementById(STYLE_ID);
    if (!link) {
      link = document.createElement("link");
      link.id = STYLE_ID;
      link.rel = "stylesheet";
      link.href = new URL("../css/editorial-dashboard-theme.css?v=20260902-1", import.meta.url).href;
      document.head.appendChild(link);
    }
    return link;
  }

  function ensureCalendarDetailStyle() {
    let link = document.getElementById(CALENDAR_DETAIL_STYLE_ID);
    if (!link) {
      link = document.createElement("link");
      link.id = CALENDAR_DETAIL_STYLE_ID;
      link.rel = "stylesheet";
      link.href = new URL("../css/calendar-editorial-detail.css?v=20260902-1", import.meta.url).href;
      document.head.appendChild(link);
    }
    return link;
  }

  function keepStylesLast() {
    if (document.documentElement.dataset.editorialThemeObserver === "true") return;
    document.documentElement.dataset.editorialThemeObserver = "true";

    let queued = false;
    const observer = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        const editorial = ensureEditorialStyle();
        const calendarDetail = ensureCalendarDetailStyle();
        if (document.head.lastElementChild !== editorial) document.head.appendChild(editorial);
        if (document.head.lastElementChild !== calendarDetail) document.head.appendChild(calendarDetail);
      });
    });
    observer.observe(document.head, { childList: true });
  }

  function init() {
    const editorial = ensureEditorialStyle();
    const calendarDetail = ensureCalendarDetailStyle();
    if (document.head.lastElementChild !== editorial) document.head.appendChild(editorial);
    if (document.head.lastElementChild !== calendarDetail) document.head.appendChild(calendarDetail);
    keepStylesLast();
    document.documentElement.classList.add("nw-editorial-dashboard");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
