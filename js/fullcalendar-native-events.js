const eventStyle = document.createElement("link");
eventStyle.rel = "stylesheet";
eventStyle.href = new URL("../css/calendar-event-details.css?v=20260801-5", import.meta.url).href;
document.head.appendChild(eventStyle);

const EVENT_HEIGHT = 52;
const EVENT_GAP = 6;
const LANE_HEIGHT = EVENT_HEIGHT + EVENT_GAP;
let layoutFrame = 0;

if (!document.querySelector("#nineworks-calendar-critical-style")) {
  const criticalStyle = document.createElement("style");
  criticalStyle.id = "nineworks-calendar-critical-style";
  criticalStyle.textContent = `
    .fc .fc-daygrid-day-events {
      position: relative !important;
      margin-top: 5px !important;
    }

    .fc .fc-daygrid-event-harness {
      margin-top: 0 !important;
    }

    .fc .fc-daygrid-event,
    .fc .fc-timegrid-event {
      box-sizing: border-box;
      height: ${EVENT_HEIGHT}px !important;
      min-height: ${EVENT_HEIGHT}px !important;
      max-height: ${EVENT_HEIGHT}px !important;
      overflow: hidden;
      padding: 7px 9px !important;
    }

    .nw-event-content {
      display: flex;
      width: 100%;
      min-width: 0;
      height: 100%;
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      gap: 3px;
      overflow: hidden;
    }

    .nw-event-title,
    .nw-event-note {
      display: block;
      width: 100%;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .nw-event-title {
      font-size: 13.5px;
      font-weight: 500;
      line-height: 1.3;
    }

    .nw-event-note {
      font-size: 11.5px;
      font-weight: 400;
      line-height: 1.3;
    }
  `;
  document.head.appendChild(criticalStyle);
}

function rangesOverlap(first, second) {
  const tolerance = 3;
  return first.left < second.right - tolerance && first.right > second.left + tolerance;
}

function getWeekRows(calendarElement) {
  const candidates = [...calendarElement.querySelectorAll(".fc-daygrid-body tr")];
  return candidates.filter((row) => row.querySelector(".fc-daygrid-day"));
}

function layoutWeekRow(row) {
  const elements = [...row.querySelectorAll(".fc-daygrid-event.nw-event-rendered")]
    .filter((element) => element.offsetParent !== null);

  if (!elements.length) {
    row.querySelectorAll(".fc-daygrid-day-events").forEach((container) => {
      container.style.minHeight = "0px";
    });
    return;
  }

  const items = elements.map((element, index) => {
    const rect = element.getBoundingClientRect();
    return {
      element,
      index,
      left: Math.round(rect.left),
      right: Math.round(rect.right),
      width: Math.round(rect.width)
    };
  }).sort((a, b) => a.left - b.left || b.width - a.width || a.index - b.index);

  const lanes = [];

  items.forEach((item) => {
    let laneIndex = lanes.findIndex((lane) => lane.every((placed) => !rangesOverlap(item, placed)));
    if (laneIndex < 0) {
      laneIndex = lanes.length;
      lanes.push([]);
    }
    lanes[laneIndex].push(item);

    const harness = item.element.closest(".fc-daygrid-event-harness");
    if (!harness) return;

    harness.dataset.nwLane = String(laneIndex);
    harness.style.position = "absolute";
    harness.style.top = `${laneIndex * LANE_HEIGHT}px`;
    harness.style.bottom = "auto";
    harness.style.marginTop = "0";
    harness.style.zIndex = String(10 + laneIndex);

    if (!harness.classList.contains("fc-daygrid-event-harness-abs")) {
      harness.style.left = "0";
      harness.style.right = "0";
    }
  });

  const requiredHeight = Math.max(1, lanes.length) * LANE_HEIGHT;
  row.querySelectorAll(".fc-daygrid-day-events").forEach((container) => {
    container.style.position = "relative";
    container.style.minHeight = `${requiredHeight}px`;
    container.style.height = `${requiredHeight}px`;
  });
}

function reflowCalendarLanes() {
  layoutFrame = 0;
  const calendarElement = document.querySelector("#calendar");
  if (!calendarElement) return;
  getWeekRows(calendarElement).forEach(layoutWeekRow);
}

function scheduleLaneLayout() {
  if (layoutFrame) cancelAnimationFrame(layoutFrame);
  layoutFrame = requestAnimationFrame(() => {
    layoutFrame = requestAnimationFrame(reflowCalendarLanes);
  });
}

const Calendar = window.FullCalendar?.Calendar;

if (Calendar && !window.FullCalendar.__nineworksNativeEvents) {
  const cleanSummary = (value = "") => {
    const marker = "[원본·참고 내용]";
    const beforeReference = String(value).split(marker)[0];
    const firstLine = beforeReference
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean) || "";

    return firstLine.length > 58 ? `${firstLine.slice(0, 58)}…` : firstLine;
  };

  class NineworksCalendar extends Calendar {
    constructor(element, options = {}) {
      const originalEventDidMount = options.eventDidMount;
      const originalEventWillUnmount = options.eventWillUnmount;
      const originalDatesSet = options.datesSet;

      super(element, {
        ...options,
        dayMaxEvents: false,
        dayMaxEventRows: false,
        eventOrderStrict: true,
        eventOrder: "start,-duration,title",
        eventContent(info) {
          const data = info.event.extendedProps || {};
          const wrapper = document.createElement("span");
          wrapper.className = "nw-event-content";

          const title = document.createElement("strong");
          title.className = "nw-event-title";
          title.textContent = `${data.client || ""}${data.client ? " · " : ""}${data.title || info.event.title || "일정"}`;

          const note = document.createElement("small");
          note.className = "nw-event-note";
          note.textContent = cleanSummary(data.memo)
            || [data.member, data.category].filter(Boolean).join(" · ");

          wrapper.appendChild(title);
          if (note.textContent) wrapper.appendChild(note);
          return { domNodes: [wrapper] };
        },
        eventDidMount(info) {
          info.el.classList.add("nw-event-rendered");
          info.el.style.height = `${EVENT_HEIGHT}px`;
          info.el.style.minHeight = `${EVENT_HEIGHT}px`;
          info.el.style.maxHeight = `${EVENT_HEIGHT}px`;
          originalEventDidMount?.(info);
          scheduleLaneLayout();
        },
        eventWillUnmount(info) {
          originalEventWillUnmount?.(info);
          scheduleLaneLayout();
        },
        datesSet(info) {
          originalDatesSet?.(info);
          scheduleLaneLayout();
        }
      });
    }
  }

  window.FullCalendar.Calendar = NineworksCalendar;
  window.FullCalendar.__nineworksNativeEvents = true;
}

function observeCalendar() {
  const calendarElement = document.querySelector("#calendar");
  if (!calendarElement) {
    window.setTimeout(observeCalendar, 250);
    return;
  }

  const observer = new MutationObserver(scheduleLaneLayout);
  observer.observe(calendarElement, { childList: true, subtree: true });
  window.addEventListener("resize", scheduleLaneLayout, { passive: true });
  scheduleLaneLayout();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", observeCalendar, { once: true });
} else {
  observeCalendar();
}
