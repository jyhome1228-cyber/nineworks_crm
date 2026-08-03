const BaseCalendar = window.FullCalendar?.Calendar;

if (BaseCalendar && !window.FullCalendar.__nineworksVisualPolish) {
  if (!document.querySelector("#nineworks-calendar-visual-style")) {
    const style = document.createElement("style");
    style.id = "nineworks-calendar-visual-style";
    style.textContent = `
      /* Sunday starts the week and uses a restrained red accent. */
      .fc .nw-sunday-header .fc-col-header-cell-cushion,
      .fc .nw-sunday-cell .fc-daygrid-day-number {
        color: #d97878 !important;
      }

      .fc .nw-sunday-header {
        background: rgba(217, 120, 120, 0.025);
      }

      .fc .nw-sunday-cell {
        background-image: linear-gradient(rgba(217, 120, 120, 0.018), rgba(217, 120, 120, 0.018));
      }

      /* Make schedule names easier to scan. */
      .fc .nw-event-title {
        font-size: 14.5px !important;
        font-weight: 550 !important;
        letter-spacing: -0.025em;
      }

      /* Keep today subtly visible, then strongly pulse when the Today button is used. */
      .fc .fc-day-today {
        background-color: rgba(67, 104, 245, 0.035) !important;
      }

      .fc .fc-day-today.nw-today-focus {
        position: relative;
        z-index: 3;
        animation: nw-today-cell-focus 1.65s ease both;
      }

      .fc .fc-day-today.nw-today-focus .fc-daygrid-day-number,
      .fc .fc-day-today.nw-today-focus .fc-col-header-cell-cushion {
        animation: nw-today-number-focus 1.65s ease both;
      }

      .fc .fc-today-button:not(:disabled) {
        cursor: pointer;
      }

      @keyframes nw-today-cell-focus {
        0% {
          box-shadow: inset 0 0 0 0 rgba(85, 119, 255, 0);
          background-color: rgba(67, 104, 245, 0.035);
        }
        24% {
          box-shadow: inset 0 0 0 3px rgba(85, 119, 255, 0.95), inset 0 0 48px rgba(67, 104, 245, 0.22);
          background-color: rgba(67, 104, 245, 0.14);
        }
        62% {
          box-shadow: inset 0 0 0 2px rgba(85, 119, 255, 0.48), inset 0 0 30px rgba(67, 104, 245, 0.1);
          background-color: rgba(67, 104, 245, 0.08);
        }
        100% {
          box-shadow: inset 0 0 0 0 rgba(85, 119, 255, 0);
          background-color: rgba(67, 104, 245, 0.035);
        }
      }

      @keyframes nw-today-number-focus {
        0%, 100% {
          color: inherit;
          transform: scale(1);
          text-shadow: none;
        }
        24% {
          color: #ffffff;
          transform: scale(1.35);
          text-shadow: 0 0 18px rgba(107, 135, 255, 0.95);
        }
        62% {
          color: #dbe2ff;
          transform: scale(1.12);
          text-shadow: 0 0 10px rgba(107, 135, 255, 0.55);
        }
      }

      @media (max-width: 760px) {
        .fc .nw-event-title {
          font-size: 13.5px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

  function activateTodayButton(calendarElement) {
    const button = calendarElement.querySelector(".fc-today-button");
    if (!button) return;
    button.disabled = false;
    button.removeAttribute("disabled");
    button.setAttribute("aria-disabled", "false");
    button.classList.remove("fc-button-disabled");
  }

  function focusToday(calendarElement) {
    const cells = [...calendarElement.querySelectorAll(".fc-day-today")];
    if (!cells.length) return;

    const primary = cells.find((cell) => cell.classList.contains("fc-daygrid-day")) || cells[0];
    primary.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });

    cells.forEach((cell) => {
      cell.classList.remove("nw-today-flash", "nw-today-focus");
      void cell.offsetWidth;
      cell.classList.add("nw-today-focus");
      window.setTimeout(() => cell.classList.remove("nw-today-focus"), 1750);
    });
  }

  class NineworksVisualCalendar extends BaseCalendar {
    constructor(element, options = {}) {
      const originalDayHeaderDidMount = options.dayHeaderDidMount;
      const originalDayCellDidMount = options.dayCellDidMount;
      const originalDatesSet = options.datesSet;
      const originalEventDidMount = options.eventDidMount;

      super(element, {
        ...options,
        firstDay: 0,
        dayHeaderContent(info) {
          return DAY_LABELS[info.date.getDay()];
        },
        dayHeaderDidMount(info) {
          info.el.classList.toggle("nw-sunday-header", info.date.getDay() === 0);
          originalDayHeaderDidMount?.(info);
        },
        dayCellDidMount(info) {
          info.el.classList.toggle("nw-sunday-cell", info.date.getDay() === 0);
          originalDayCellDidMount?.(info);
        },
        eventDidMount(info) {
          originalEventDidMount?.(info);
          const title = info.el.querySelector(".nw-event-title");
          if (title) title.style.fontSize = "14.5px";
        },
        datesSet(info) {
          originalDatesSet?.(info);
          window.requestAnimationFrame(() => activateTodayButton(element));
        }
      });

      const handleToday = (event) => {
        if (!event.target.closest(".fc-today-button")) return;
        window.setTimeout(() => {
          activateTodayButton(element);
          focusToday(element);
        }, 160);
      };

      element.addEventListener("pointerdown", (event) => {
        if (event.target.closest(".fc-today-button")) activateTodayButton(element);
      }, true);
      element.addEventListener("click", handleToday, true);

      window.setTimeout(() => activateTodayButton(element), 0);
    }
  }

  window.FullCalendar.Calendar = NineworksVisualCalendar;
  window.FullCalendar.__nineworksVisualPolish = true;
}
