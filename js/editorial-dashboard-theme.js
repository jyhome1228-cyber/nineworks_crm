(() => {
  "use strict";

  const STYLE_ID = "nineworks-editorial-dashboard-theme";
  const CALENDAR_DETAIL_STYLE_ID = "nineworks-calendar-editorial-detail";
  const UNIVERSAL_SYSTEM_STYLE_ID = "nineworks-seed-universal-system";
  const DETAIL_REFINEMENT_STYLE_ID = "nineworks-ui-detail-refinements";
  const QUICK_SCHEDULE_STYLE_ID = "nineworks-quick-schedule-input";
  const CALENDAR_MONOCHROME_STYLE_ID = "nineworks-calendar-monochrome-final";
  const ENTRY_LOADER_STYLE_ID = "nineworks-entry-loading";

  function ensureStyle(id, href) {
    let link = document.getElementById(id);
    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    }
    return link;
  }

  function ensureEditorialStyle() {
    return ensureStyle(STYLE_ID, new URL("../css/editorial-dashboard-theme.css?v=20260902-1", import.meta.url).href);
  }

  function ensureCalendarDetailStyle() {
    return ensureStyle(CALENDAR_DETAIL_STYLE_ID, new URL("../css/calendar-editorial-detail.css?v=20260902-1", import.meta.url).href);
  }

  function ensureUniversalSystemStyle() {
    return ensureStyle(UNIVERSAL_SYSTEM_STYLE_ID, new URL("../css/seed-universal-system.css?v=20260906-1", import.meta.url).href);
  }

  function ensureDetailRefinementStyle() {
    return ensureStyle(DETAIL_REFINEMENT_STYLE_ID, new URL("../css/ui-detail-refinements.css?v=20260906-1", import.meta.url).href);
  }

  function ensureQuickScheduleStyle() {
    const href = new URL("../css/quick-schedule-input.css?v=20260906-2", import.meta.url).href;
    const link = ensureStyle(QUICK_SCHEDULE_STYLE_ID, href);
    if (link.href !== href) link.href = href;
    return link;
  }

  function ensureCalendarMonochromeStyle() {
    const href = new URL("../css/calendar-monochrome-final.css?v=20260906-2", import.meta.url).href;
    const link = ensureStyle(CALENDAR_MONOCHROME_STYLE_ID, href);
    if (link.href !== href) link.href = href;
    return link;
  }

  function ensureEntryLoaderStyle() {
    return ensureStyle(ENTRY_LOADER_STYLE_ID, new URL("../css/entry-loading.css?v=20260906-1", import.meta.url).href);
  }

  function mountEntryLoader() {
    if (!document.body || document.getElementById("nwEntryLoader")) return;
    const loader = document.createElement("div");
    loader.id = "nwEntryLoader";
    loader.className = "nw-entry-loader";
    loader.setAttribute("role", "status");
    loader.setAttribute("aria-live", "polite");
    loader.innerHTML = `
      <div class="nw-entry-loader__inner">
        <img class="nw-entry-loader__logo" src="./assets/nineworks-logo.svg?v=20260906-5" alt="NINEWORKS" />
        <div class="nw-entry-loader__bars" aria-hidden="true"><i></i><i></i><i></i></div>
        <p class="nw-entry-loader__label">WORKSPACE LOADING</p>
      </div>
    `;
    document.body.prepend(loader);

    const startedAt = performance.now();
    let finished = false;
    let observer = null;

    const finish = () => {
      if (finished) return;
      finished = true;
      observer?.disconnect();
      const elapsed = performance.now() - startedAt;
      const delay = Math.max(0, 420 - elapsed);
      window.setTimeout(() => {
        loader.classList.add("is-leaving");
        window.setTimeout(() => loader.remove(), 260);
      }, delay);
    };

    const checkReady = () => {
      const root = document.documentElement;
      if (root.classList.contains("nw-auth-resolved") && root.classList.contains("nw-theme-ready")) finish();
    };

    observer = new MutationObserver(checkReady);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    checkReady();
    window.setTimeout(finish, 2600);
  }

  function ensureThemeStackIsLast() {
    const editorial = ensureEditorialStyle();
    const calendarDetail = ensureCalendarDetailStyle();
    const universalSystem = ensureUniversalSystemStyle();
    const detailRefinement = ensureDetailRefinementStyle();
    const quickSchedule = ensureQuickScheduleStyle();
    const calendarMonochrome = ensureCalendarMonochromeStyle();
    const entryLoader = ensureEntryLoaderStyle();
    const children = Array.from(document.head.children);
    const tail = children.slice(-7);

    if (
      tail[0] === editorial &&
      tail[1] === calendarDetail &&
      tail[2] === universalSystem &&
      tail[3] === detailRefinement &&
      tail[4] === quickSchedule &&
      tail[5] === calendarMonochrome &&
      tail[6] === entryLoader
    ) {
      return;
    }

    document.head.appendChild(editorial);
    document.head.appendChild(calendarDetail);
    document.head.appendChild(universalSystem);
    document.head.appendChild(detailRefinement);
    document.head.appendChild(quickSchedule);
    document.head.appendChild(calendarMonochrome);
    document.head.appendChild(entryLoader);
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
    mountEntryLoader();
    document.documentElement.classList.add("nw-editorial-dashboard", "nw-universal-system");
    import("./quick-schedule-input.js?v=20260906-2").catch((error) => console.warn("빠른 일정 입력 모듈 로드 실패", error));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();