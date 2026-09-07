(() => {
  "use strict";

  const FullCalendar = window.FullCalendar;
  const CurrentCalendar = FullCalendar?.Calendar;
  if (!CurrentCalendar || FullCalendar.__nineworksLaneStability) return;

  const EVENT_HEIGHT = 42;
  const LANE_GAP = 3;
  const LANE_HEIGHT = EVENT_HEIGHT + LANE_GAP;
  let layoutFrame = 0;
  let delayedTimer = 0;

  const pad = (value) => String(value).padStart(2, "0");
  const dateKey = (value) => {
    const date = new Date(value);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };
  const dateNumber = (key) => {
    const [year, month, day] = String(key || "").split("-").map(Number);
    return new Date(year || 1970, (month || 1) - 1, day || 1).getTime();
  };
  const inclusiveEndKey = (event) => {
    if (!event?.end) return dateKey(event.start);
    const end = new Date(event.end);
    end.setMilliseconds(end.getMilliseconds() - 1);
    return dateKey(end);
  };
  const rangesOverlap = (a, b) => a.start <= b.end && a.end >= b.start;

  function rowRange(row) {
    const cells = [...row.querySelectorAll(".fc-daygrid-day[data-date]")];
    if (!cells.length) return null;
    return {
      startKey: cells[0].dataset.date,
      endKey: cells[cells.length - 1].dataset.date,
      start: dateNumber(cells[0].dataset.date),
      end: dateNumber(cells[cells.length - 1].dataset.date)
    };
  }

  function getRows(calendar) {
    const roleRows = [...calendar.querySelectorAll(".fc-daygrid-body tr[role='row']")]
      .filter((row) => row.querySelector(".fc-daygrid-day[data-date]"));
    return roleRows.length
      ? roleRows
      : [...calendar.querySelectorAll(".fc-daygrid-body tbody > tr")]
        .filter((row) => row.querySelector(".fc-daygrid-day[data-date]"));
  }

  function restoreEmptyRow(row) {
    row.querySelectorAll(".fc-daygrid-day-events").forEach((container) => {
      container.style.removeProperty("height");
      container.style.setProperty("min-height", "0px", "important");
    });
  }

  function fillHarnessWidth(harness, element) {
    if (!harness || !element) return;

    /*
      FullCalendar leaves single-day harnesses at intrinsic/content width.
      Once our lane layout makes them absolute, that intrinsic width becomes
      visible as uneven bars. Single-day segments should always fill the
      complete date cell. Multi-day absolute segments keep FullCalendar's
      own left/right geometry so they still span the exact number of days.
    */
    if (!harness.classList.contains("fc-daygrid-event-harness-abs")) {
      harness.style.setProperty("left", "0", "important");
      harness.style.setProperty("right", "0", "important");
      harness.style.setProperty("width", "auto", "important");
      harness.style.setProperty("max-width", "none", "important");
    }

    element.style.setProperty("display", "block", "important");
    element.style.setProperty("width", "100%", "important");
    element.style.setProperty("max-width", "none", "important");
    element.style.setProperty("box-sizing", "border-box", "important");
  }

  function stabilizeRow(row) {
    const range = rowRange(row);
    if (!range) return;

    const elements = [...row.querySelectorAll(".fc-daygrid-event[data-nw-range-start]")]
      .filter((element) => element.offsetParent !== null);

    if (!elements.length) {
      restoreEmptyRow(row);
      return;
    }

    const items = elements.map((element, index) => {
      const rawStart = dateNumber(element.dataset.nwRangeStart);
      const rawEnd = dateNumber(element.dataset.nwRangeEnd || element.dataset.nwRangeStart);
      const start = Math.max(rawStart, range.start);
      const end = Math.min(rawEnd, range.end);
      return {
        element,
        harness: element.closest(".fc-daygrid-event-harness"),
        index,
        start,
        end,
        duration: Math.max(0, end - start)
      };
    }).filter((item) => item.harness && item.start <= item.end)
      .sort((a, b) => a.start - b.start || b.duration - a.duration || a.index - b.index);

    if (!items.length) {
      restoreEmptyRow(row);
      return;
    }

    const lanes = [];
    items.forEach((item) => {
      let laneIndex = lanes.findIndex((lane) => lane.every((placed) => !rangesOverlap(item, placed)));
      if (laneIndex < 0) {
        laneIndex = lanes.length;
        lanes.push([]);
      }
      lanes[laneIndex].push(item);

      const harness = item.harness;
      harness.dataset.nwStableLane = String(laneIndex);
      harness.style.setProperty("position", "absolute", "important");
      harness.style.setProperty("top", `${laneIndex * LANE_HEIGHT}px`, "important");
      harness.style.setProperty("bottom", "auto", "important");
      harness.style.setProperty("margin-top", "0", "important");
      harness.style.setProperty("height", `${EVENT_HEIGHT}px`, "important");
      harness.style.setProperty("z-index", String(20 + laneIndex), "important");

      fillHarnessWidth(harness, item.element);

      item.element.style.setProperty("height", `${EVENT_HEIGHT}px`, "important");
      item.element.style.setProperty("min-height", `${EVENT_HEIGHT}px`, "important");
      item.element.style.setProperty("max-height", `${EVENT_HEIGHT}px`, "important");
    });

    const requiredHeight = Math.max(1, lanes.length) * LANE_HEIGHT;
    row.querySelectorAll(".fc-daygrid-day-events").forEach((container) => {
      container.style.setProperty("position", "relative", "important");
      container.style.setProperty("min-height", `${requiredHeight}px`, "important");
      container.style.setProperty("height", `${requiredHeight}px`, "important");
    });
  }

  function stabilizeCalendar() {
    layoutFrame = 0;
    const calendar = document.querySelector("#calendar");
    if (!calendar || !calendar.querySelector(".fc-daygrid-body")) return;
    getRows(calendar).forEach(stabilizeRow);
  }

  function scheduleStabilize(delay = 0) {
    if (layoutFrame) cancelAnimationFrame(layoutFrame);
    if (delayedTimer) window.clearTimeout(delayedTimer);

    const run = () => {
      layoutFrame = requestAnimationFrame(() => {
        layoutFrame = requestAnimationFrame(stabilizeCalendar);
      });
    };

    if (delay) delayedTimer = window.setTimeout(run, delay);
    else run();
  }

  function annotateEvent(info) {
    const element = info?.el;
    const event = info?.event;
    if (!element || !event?.start) return;
    element.dataset.nwRangeStart = dateKey(event.start);
    element.dataset.nwRangeEnd = inclusiveEndKey(event);
    element.dataset.nwCalendarEventId = event.id || "";
  }

  class NineworksLaneStabilityCalendar extends CurrentCalendar {
    constructor(element, options = {}) {
      const originalDidMount = options.eventDidMount;
      const originalDatesSet = options.datesSet;
      const originalDrop = options.eventDrop;
      const originalResize = options.eventResize;

      super(element, {
        ...options,
        eventDidMount(info) {
          annotateEvent(info);
          originalDidMount?.(info);
          scheduleStabilize();
          scheduleStabilize(45);
        },
        datesSet(info) {
          originalDatesSet?.(info);
          scheduleStabilize();
          scheduleStabilize(60);
        },
        eventDrop(info) {
          originalDrop?.(info);
          scheduleStabilize(40);
        },
        eventResize(info) {
          originalResize?.(info);
          scheduleStabilize(40);
        }
      });
    }
  }

  FullCalendar.Calendar = NineworksLaneStabilityCalendar;
  FullCalendar.__nineworksLaneStability = true;

  function observeRuntime() {
    const connect = () => {
      const calendar = document.querySelector("#calendar");
      if (!calendar) {
        window.setTimeout(connect, 180);
        return;
      }
      if (calendar.dataset.nwStableLaneObserver === "true") return;
      calendar.dataset.nwStableLaneObserver = "true";

      let queued = false;
      const observer = new MutationObserver((mutations) => {
        const relevant = mutations.some((mutation) => mutation.type === "childList" && (mutation.addedNodes.length || mutation.removedNodes.length));
        if (!relevant || queued) return;
        queued = true;
        requestAnimationFrame(() => {
          queued = false;
          scheduleStabilize();
          scheduleStabilize(45);
        });
      });
      observer.observe(calendar, { childList: true, subtree: true });

      window.addEventListener("resize", () => scheduleStabilize(30), { passive: true });
      scheduleStabilize(80);
    };

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", connect, { once: true });
    else connect();
  }

  observeRuntime();
})();
