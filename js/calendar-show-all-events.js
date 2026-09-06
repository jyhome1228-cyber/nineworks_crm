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
        contentHeight: options.contentHeight ?? "auto"
      });

      super.setOption("dayMaxEvents", false);
      super.setOption("dayMaxEventRows", false);
    }

    setOption(name, value) {
      if (name === "dayMaxEvents" || name === "dayMaxEventRows") {
        return super.setOption(name, false);
      }
      return super.setOption(name, value);
    }
  }

  FullCalendar.Calendar = NineworksShowAllEventsCalendar;
  FullCalendar.__nineworksShowAllEvents = true;
})();
