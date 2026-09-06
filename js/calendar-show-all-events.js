(() => {
  "use strict";

  const FullCalendar = window.FullCalendar;
  const CurrentCalendar = FullCalendar?.Calendar;
  if (!CurrentCalendar || FullCalendar.__nineworksShowAllEvents) return;

  class NineworksShowAllEventsCalendar extends CurrentCalendar {
    constructor(element, options = {}) {
      super(element, {
        ...options,
        dayMaxEvents: false,
        dayMaxEventRows: false,
        fixedWeekCount: options.fixedWeekCount ?? false,
        height: options.height ?? "auto",
        contentHeight: options.contentHeight ?? "auto",
        editable: options.editable !== false,
        eventStartEditable: options.eventStartEditable !== false,
        /* Duration resizing is handled by our single custom right-edge handle. */
        eventDurationEditable: false,
        eventResizableFromStart: false
      });

      super.setOption("dayMaxEvents", false);
      super.setOption("dayMaxEventRows", false);
      super.setOption("eventDurationEditable", false);
      super.setOption("eventResizableFromStart", false);
    }

    setOption(name, value) {
      if (name === "dayMaxEvents" || name === "dayMaxEventRows") {
        return super.setOption(name, false);
      }
      if (name === "eventDurationEditable" || name === "eventResizableFromStart") {
        return super.setOption(name, false);
      }
      return super.setOption(name, value);
    }
  }

  FullCalendar.Calendar = NineworksShowAllEventsCalendar;
  FullCalendar.__nineworksShowAllEvents = true;
})();
