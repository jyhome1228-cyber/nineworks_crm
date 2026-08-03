const resizeStyle = document.createElement("link");
resizeStyle.rel = "stylesheet";
resizeStyle.href = new URL("../css/calendar-duration-resize.css?v=20260804-1", import.meta.url).href;
document.head.appendChild(resizeStyle);

const BaseCalendar = window.FullCalendar?.Calendar;

if (BaseCalendar && !window.FullCalendar.__nineworksDurationResize) {
  class NineworksDurationCalendar extends BaseCalendar {
    constructor(element, options = {}) {
      const originalEventDidMount = options.eventDidMount;
      const originalEventResizeStart = options.eventResizeStart;
      const originalEventResizeStop = options.eventResizeStop;

      super(element, {
        ...options,
        editable: options.editable !== false,
        eventStartEditable: options.eventStartEditable !== false,
        eventDurationEditable: true,
        eventResizableFromStart: false,
        dragScroll: true,
        longPressDelay: options.longPressDelay ?? 320,
        eventLongPressDelay: options.eventLongPressDelay ?? 320,
        eventDragMinDistance: options.eventDragMinDistance ?? 5,
        eventDidMount(info) {
          originalEventDidMount?.(info);
          if (!info.event.allDay) return;

          info.el.classList.add("nw-duration-resizable");
          const existingTitle = info.el.getAttribute("title") || "";
          const resizeGuide = "오른쪽 끝을 드래그해 일정 기간을 조정합니다.";
          if (!existingTitle.includes(resizeGuide)) {
            info.el.setAttribute("title", [existingTitle, resizeGuide].filter(Boolean).join("\n"));
          }
        },
        eventResizeStart(info) {
          info.el?.classList.add("is-resizing");
          document.body.classList.add("is-calendar-duration-resizing");
          originalEventResizeStart?.(info);
        },
        eventResizeStop(info) {
          info.el?.classList.remove("is-resizing");
          document.body.classList.remove("is-calendar-duration-resizing");
          originalEventResizeStop?.(info);
        }
      });
    }
  }

  window.FullCalendar.Calendar = NineworksDurationCalendar;
  window.FullCalendar.__nineworksDurationResize = true;
}
