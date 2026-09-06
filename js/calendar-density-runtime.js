(() => {
  "use strict";

  const LANE_HEIGHT = 29;
  const EVENT_HEIGHT = 27;
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
    if (!harnesses.length) {
      row.querySelectorAll(".fc-daygrid-day-events").forEach((container) => {
        container.style.removeProperty("min-height");
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
      harness.style.setProperty("margin-top", "0", "important");
      harness.style.setProperty("margin-bottom", "0", "important");
    });

    const requiredHeight = Math.max(LANE_HEIGHT, tops.length * LANE_HEIGHT + 1);
    row.querySelectorAll(".fc-daygrid-day-events").forEach((container) => {
      container.style.setProperty("min-height", `${requiredHeight}px`, "important");
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
      window.setTimeout(init, 160);
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
        window.setTimeout(schedule, 40);
      }
    }, true);

    schedule();
    window.setTimeout(schedule, 250);
    window.setTimeout(schedule, 900);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
