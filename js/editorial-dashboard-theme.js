(() => {
  "use strict";

  const STYLE_ID = "nineworks-editorial-dashboard-theme";
  const CALENDAR_DETAIL_STYLE_ID = "nineworks-calendar-editorial-detail";
  const UNIVERSAL_SYSTEM_STYLE_ID = "nineworks-seed-universal-system";

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

  function ensureUniversalSystemStyle() {
    let link = document.getElementById(UNIVERSAL_SYSTEM_STYLE_ID);
    if (!link) {
      link = document.createElement("link");
      link.id = UNIVERSAL_SYSTEM_STYLE_ID;
      link.rel = "stylesheet";
      link.href = new URL("../css/seed-universal-system.css?v=20260906-1", import.meta.url).href;
      document.head.appendChild(link);
    }
    return link;
  }

  function ensureThemeStackIsLast() {
    const editorial = ensureEditorialStyle();
    const calendarDetail = ensureCalendarDetailStyle();
    const universalSystem = ensureUniversalSystemStyle();
    const children = Array.from(document.head.children);
    const tail = children.slice(-3);

    if (
      tail[0] === editorial &&
      tail[1] === calendarDetail &&
      tail[2] === universalSystem
    ) {
      return;
    }

    document.head.appendChild(editorial);
    document.head.appendChild(calendarDetail);
    document.head.appendChild(universalSystem);
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
        ensureThemeStackIsLast();
      });
    });

    observer.observe(document.head, { childList: true });
  }

  function init() {
    ensureThemeStackIsLast();
    keepStylesLast();
    document.documentElement.classList.add("nw-editorial-dashboard", "nw-universal-system");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
