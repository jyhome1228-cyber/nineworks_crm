const eventStyle = document.createElement("link");
eventStyle.rel = "stylesheet";
eventStyle.href = new URL("../css/calendar-event-details.css", import.meta.url).href;
document.head.appendChild(eventStyle);

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
          originalEventDidMount?.(info);
        }
      });
    }
  }

  window.FullCalendar.Calendar = NineworksCalendar;
  window.FullCalendar.__nineworksNativeEvents = true;
}
