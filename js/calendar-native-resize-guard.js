(() => {
  "use strict";

  const FullCalendar = window.FullCalendar;
  const CurrentCalendar = FullCalendar?.Calendar;
  if (!CurrentCalendar || FullCalendar.__nineworksNativeResizeGuard) return;

  class NineworksNativeResizeGuardCalendar extends CurrentCalendar {
    constructor(element, options = {}) {
      super(element, {
        ...options,
        editable: options.editable !== false,
        eventStartEditable: options.eventStartEditable !== false,
        /* Duration is handled only by the custom right-edge handle. */
        eventDurationEditable: false,
        eventResizableFromStart: false
      });
    }

    setOption(name, value) {
      if (name === "eventDurationEditable" || name === "eventResizableFromStart") {
        return super.setOption(name, false);
      }
      return super.setOption(name, value);
    }
  }

  FullCalendar.Calendar = NineworksNativeResizeGuardCalendar;
  FullCalendar.__nineworksNativeResizeGuard = true;
})();
