(() => {
  "use strict";

  const LANE_HEIGHT = 35;
  const EVENT_HEIGHT = 31;
  const HORIZONTAL_INSET = 5;
  let queued = false;
  let applying = false;

  function rows(calendar) {
    const roleRows = [...calendar.querySelectorAll(".fc-daygrid-body tr[role='row']")];
    return roleRows.length ? roleRows : [...calendar.querySelectorAll(".fc-daygrid-body tbody > tr")];
  }

  function currentTop(harness) {
    const inline = Number.parseFloat(harness.style.top);
    if (Number.isFinite(inline)) return inline;
    const computed = Number.parseFloat(getComputedStyle(harness).top);
    return Number.isFinite(computed) ? computed : 0;
  }

  function compactRow(row) {
    const harnesses = [...row.querySelectorAll(".fc-daygrid-event-harness-abs")];
    const containers = [...row.querySelectorAll(".fc-daygrid-day-events")];

    if (!harnesses.length) {
      containers.forEach((container) => {
        container.style.removeProperty("min-height");
        container.style.removeProperty("height");
        container.style.setProperty("overflow", "visible", "important");
      });
      return;
    }

    const tops = [...new Set(harnesses.map(currentTop).map((top) => Math.round(top)))]
      .sort((a, b) => a - b);
    const levelByTop = new Map(tops.map((top, index) => [top, index]));

    harnesses.forEach((harness) => {
      const level = levelByTop.get(Math.round(currentTop(harness))) || 0;
      harness.style.setProperty("top", `${level * LANE_HEIGHT}px`, "important");
      harness.style.setProperty("height", `${EVENT_HEIGHT}px`, "important");
      harness.style.setProperty("min-height", `${EVENT_HEIGHT}px`, "important");
      harness.style.setProperty("max-height", `${EVENT_HEIGHT}px`, "important");
      harness.style.setProperty("left", `${HORIZONTAL_INSET}px`, "important");
      harness.style.setProperty("right", `${HORIZONTAL_INSET}px`, "important");
      harness.style.setProperty("width", "auto", "important");
      harness.style.setProperty("margin-top", "0", "important");
      harness.style.setProperty("margin-bottom", "0", "important");
    });

    const requiredHeight = Math.max(LANE_HEIGHT, tops.length * LANE_HEIGHT + 3);
    containers.forEach((container) => {
      container.style.setProperty("min-height", `${requiredHeight}px`, "important");
      container.style.setProperty("height", `${requiredHeight}px`, "important");
      container.style.setProperty("overflow", "visible", "important");
    });
  }

  function apply() {
    queued = false;
    if (applying) return;
    const calendar = document.querySelector("#calendar");
    if (!calendar) return;

    applying = true;
    rows(calendar).forEach(compactRow);
    applying = false;
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => requestAnimationFrame(apply));
  }

  function init() {
    const calendar = document.querySelector("#calendar");
    if (!calendar) {
      window.setTimeout(init, 120);
      return;
    }

    const observer = new MutationObserver(() => {
      if (!applying) schedule();
    });
    observer.observe(calendar, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"]
    });

    window.addEventListener("resize", schedule, { passive: true });
    document.addEventListener("click", (event) => {
      if (event.target.closest("[data-route], .fc-button, .nw-past-week-toggle, .nw-past-weeks-all")) {
        window.setTimeout(schedule, 24);
      }
    }, true);

    schedule();
    window.setTimeout(schedule, 120);
    window.setTimeout(schedule, 420);
    window.setTimeout(schedule, 900);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();