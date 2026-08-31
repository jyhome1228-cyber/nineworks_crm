(() => {
  "use strict";

  const STYLE_ID = "nineworks-calendar-layout-order-style";
  let queued = false;

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #calendarPage .calendar-layout[data-summary-layout="true"] > .calendar-main {
        order: 1;
      }

      #calendarPage .calendar-layout[data-summary-layout="true"] > #clientDragSection,
      #calendarPage .calendar-layout[data-summary-layout="true"] > .client-drag-section {
        grid-column: 1 / -1 !important;
        order: 2;
        width: 100% !important;
        margin: 0 !important;
      }

      #calendarPage .calendar-layout[data-summary-layout="true"] > .schedule-side {
        order: 3;
      }

      #calendarPage .calendar-layout > #clientDragSection,
      #calendarPage .calendar-layout > .client-drag-section {
        grid-column: 1 / -1;
        width: 100%;
        margin-top: 0;
      }
    `;
    document.head.appendChild(style);
  }

  function moveQuickSchedule() {
    queued = false;
    const layout = document.querySelector("#calendarPage .calendar-layout");
    const calendarMain = layout?.querySelector(":scope > .calendar-main");
    const section = document.querySelector("#clientDragSection");
    if (!layout || !calendarMain || !section) return false;

    if (section.parentElement !== layout || calendarMain.nextElementSibling !== section) {
      calendarMain.insertAdjacentElement("afterend", section);
    }
    return true;
  }

  function queueMove() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(moveQuickSchedule);
  }

  function init() {
    ensureStyle();
    queueMove();

    const observer = new MutationObserver(queueMove);
    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener("load", queueMove, { once: true });
    window.addEventListener("resize", queueMove);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
