const eventStyle = document.createElement("link");
eventStyle.rel = "stylesheet";
eventStyle.href = new URL("../css/calendar-event-details.css", import.meta.url).href;
document.head.appendChild(eventStyle);

/*
 * FullCalendar calculates day-grid lanes immediately when events are rendered.
 * The critical two-line card height must therefore exist synchronously, before
 * the external stylesheet finishes loading. Otherwise the calendar measures a
 * one-line card and later-expanded cards overlap each other.
 */
if (!document.querySelector("#nineworks-calendar-critical-style")) {
  const criticalStyle = document.createElement("style");
  criticalStyle.id = "nineworks-calendar-critical-style";
  criticalStyle.textContent = `
    .fc .fc-daygrid-event,
    .fc .fc-timegrid-event {
      min-height: 52px;
      overflow: hidden;
      padding: 7px 9px !important;
    }

    .fc .fc-daygrid-event-harness {
      margin-top: 5px !important;
    }

    .nw-event-content {
      display: flex;
      width: 100%;
      min-width: 0;
      min-height: 38px;
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

      super(element, {
        ...options,
        dayMaxEvents: false,
        eventOrderStrict: true,
        eventOrder: "start,-duration,title",
        eventContent(info) {
          const data = info.event.extendedProps || {};
          const wrapper = document.createElement("span");
          wrapper.className = "nw-event-content";
          wrapper.style.cssText = [
            "display:flex",
            "width:100%",
            "min-width:0",
            "min-height:38px",
            "flex-direction:column",
            "align-items:flex-start",
            "justify-content:center",
            "gap:3px",
            "overflow:hidden"
          ].join(";");

          const title = document.createElement("strong");
          title.className = "nw-event-title";
          title.style.cssText = "display:block;width:100%;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13.5px;font-weight:500;line-height:1.3";
          title.textContent = `${data.client || ""}${data.client ? " · " : ""}${data.title || info.event.title || "일정"}`;

          const note = document.createElement("small");
          note.className = "nw-event-note";
          note.style.cssText = "display:block;width:100%;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11.5px;font-weight:400;line-height:1.3";
          note.textContent = cleanSummary(data.memo)
            || [data.member, data.category].filter(Boolean).join(" · ");

          wrapper.appendChild(title);
          if (note.textContent) wrapper.appendChild(note);
          return { domNodes: [wrapper] };
        },
        eventDidMount(info) {
          info.el.classList.add("nw-event-rendered");
          info.el.style.minHeight = "52px";
          info.el.style.overflow = "hidden";
          originalEventDidMount?.(info);
        }
      });
    }
  }

  window.FullCalendar.Calendar = NineworksCalendar;
  window.FullCalendar.__nineworksNativeEvents = true;
}
