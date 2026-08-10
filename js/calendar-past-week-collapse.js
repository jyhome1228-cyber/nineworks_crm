const pastWeekStyle = document.createElement("style");
pastWeekStyle.id = "nineworks-past-week-style";
pastWeekStyle.textContent = `
  .fc .nw-past-week-collapsed .fc-daygrid-event-harness {
    display: none !important;
  }
  .fc .nw-past-week-collapsed .fc-daygrid-day-events {
    height: 0 !important;
    min-height: 0 !important;
    margin-top: 0 !important;
    overflow: visible !important;
  }
  .fc .nw-past-week-collapsed .fc-daygrid-day-frame {
    min-height: 74px !important;
  }
  .fc .nw-past-week-collapsed .fc-daygrid-day {
    background-image: linear-gradient(rgba(255,255,255,.008), rgba(255,255,255,.008));
  }
  .fc .nw-past-week-toggle {
    position: absolute;
    z-index: 18;
    top: 34px;
    left: 8px;
    max-width: calc(100% - 16px);
    min-height: 27px;
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 7px;
    padding: 0 9px;
    background: rgba(26,26,30,.92);
    color: #85858e;
    font-size: 10.5px;
    font-weight: 650;
    line-height: 25px;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;
  }
  .fc .nw-past-week-toggle:hover {
    border-color: rgba(85,119,255,.34);
    color: #b8c4f7;
  }
  .fc .nw-past-week-expanded .nw-past-week-toggle {
    border-color: rgba(85,119,255,.2);
    color: #9da9dd;
  }
  .fc .nw-past-weeks-all {
    min-height: 30px;
    margin-left: 6px;
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 7px;
    padding: 0 10px;
    background: #1d1d21;
    color: #8c8c95;
    font-size: 10.5px;
    font-weight: 650;
    cursor: pointer;
  }
  .fc .nw-past-weeks-all:hover,
  .fc .nw-past-weeks-all.is-expanded {
    border-color: rgba(85,119,255,.32);
    color: #b9c5f8;
    background: rgba(67,104,245,.06);
  }
  @media (max-width: 820px) {
    .fc .nw-past-week-toggle {
      left: 5px;
      max-width: calc(100% - 10px);
      padding: 0 6px;
      font-size: 9.5px;
    }
    .fc .nw-past-weeks-all {
      padding: 0 8px;
      font-size: 9.5px;
    }
  }
`;
if (!document.querySelector(`#${pastWeekStyle.id}`)) document.head.appendChild(pastWeekStyle);

const expandedWeeks = new Set();
let expandAllPastWeeks = false;
let applyFrame = 0;
let applying = false;

function pad(value) {
  return String(value).padStart(2, "0");
}

function dateKey(date) {
  const value = new Date(date);
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

function parseDateKey(key) {
  const [year, month, day] = String(key || "").split("-").map(Number);
  return new Date(year, month - 1, day);
}

function currentWeekStartKey() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  now.setDate(now.getDate() - now.getDay());
  return dateKey(now);
}

function weekRows(calendar) {
  return [...calendar.querySelectorAll(".fc-daygrid-body tr")]
    .filter((row) => row.querySelector(".fc-daygrid-day[data-date]"));
}

function setText(element, text) {
  if (element && element.textContent !== text) element.textContent = text;
}

function restoreRow(row) {
  row.classList.remove("nw-past-week-collapsed", "nw-past-week-expanded");
  row.querySelectorAll(".fc-daygrid-event-harness").forEach((harness) => {
    harness.style.removeProperty("display");
  });
  row.querySelector(".nw-past-week-toggle")?.remove();
}

function resetPastWeekUi(calendar) {
  weekRows(calendar).forEach(restoreRow);
  calendar.querySelector(".nw-past-weeks-all")?.remove();
}

function ensureWeekToggle(row, weekKey, eventCount, expanded) {
  const firstCell = row.querySelector(".fc-daygrid-day[data-date]");
  const frame = firstCell?.querySelector(".fc-daygrid-day-frame");
  if (!frame) return;
  frame.style.position = "relative";

  let button = frame.querySelector(".nw-past-week-toggle");
  if (!button) {
    button = document.createElement("button");
    button.className = "nw-past-week-toggle";
    button.type = "button";
    frame.appendChild(button);
  }
  button.dataset.weekKey = weekKey;
  button.hidden = eventCount <= 0;
  setText(button, `지난 일정 ${eventCount}건 · ${expanded ? "다시 접기" : "펼쳐보기"}`);
}

function ensureAllControl(calendar, collapsedCount) {
  const toolbar = calendar.querySelector(".fc-header-toolbar");
  const firstChunk = toolbar?.querySelector(".fc-toolbar-chunk");
  if (!firstChunk) return;

  let button = firstChunk.querySelector(".nw-past-weeks-all");
  if (!collapsedCount) {
    button?.remove();
    return;
  }
  if (!button) {
    button = document.createElement("button");
    button.type = "button";
    button.className = "nw-past-weeks-all";
    firstChunk.appendChild(button);
  }
  button.classList.toggle("is-expanded", expandAllPastWeeks);
  setText(button, expandAllPastWeeks ? "지난 일정 다시 접기" : `지난 일정 모두 보기`);
}

function applyPastWeekCollapse() {
  applyFrame = 0;
  if (applying) return;
  const calendar = document.querySelector("#calendar");
  if (!calendar) return;

  // Only auto-collapse on the month view that contains today.
  if (!calendar.querySelector(".fc-daygrid-body") || !calendar.querySelector(".fc-day-today")) {
    resetPastWeekUi(calendar);
    return;
  }

  applying = true;
  try {
    const currentStart = currentWeekStartKey();
    let pastWeekCount = 0;

    weekRows(calendar).forEach((row) => {
      const cells = [...row.querySelectorAll(".fc-daygrid-day[data-date]")];
      if (!cells.length) return;
      const weekKey = cells[0].dataset.date || "";
      const weekEndKey = cells[cells.length - 1].dataset.date || weekKey;
      const isPastWeek = parseDateKey(weekEndKey) < parseDateKey(currentStart);

      if (!isPastWeek) {
        restoreRow(row);
        return;
      }

      const harnesses = [...row.querySelectorAll(".fc-daygrid-event-harness")];
      const eventCount = harnesses.length;
      if (eventCount > 0) pastWeekCount += 1;
      const expanded = expandAllPastWeeks || expandedWeeks.has(weekKey);

      row.dataset.nwPastWeek = weekKey;
      row.classList.toggle("nw-past-week-collapsed", !expanded);
      row.classList.toggle("nw-past-week-expanded", expanded);
      harnesses.forEach((harness) => {
        if (expanded) harness.style.removeProperty("display");
        else harness.style.display = "none";
      });
      ensureWeekToggle(row, weekKey, eventCount, expanded);
    });

    ensureAllControl(calendar, pastWeekCount);
  } finally {
    applying = false;
  }
}

function scheduleApply(delay = 0) {
  if (applyFrame) cancelAnimationFrame(applyFrame);
  if (delay) {
    window.setTimeout(() => {
      applyFrame = requestAnimationFrame(() => requestAnimationFrame(applyPastWeekCollapse));
    }, delay);
    return;
  }
  applyFrame = requestAnimationFrame(() => requestAnimationFrame(applyPastWeekCollapse));
}

function refreshCalendarLanes() {
  window.setTimeout(() => {
    window.dispatchEvent(new Event("resize"));
    scheduleApply(80);
  }, 20);
}

function bindPastWeekControls(calendar) {
  if (calendar.dataset.nwPastWeekControls === "true") return;
  calendar.dataset.nwPastWeekControls = "true";

  calendar.addEventListener("click", (event) => {
    const weekButton = event.target.closest(".nw-past-week-toggle");
    if (weekButton) {
      event.preventDefault();
      event.stopPropagation();
      const key = weekButton.dataset.weekKey;
      if (!key) return;
      if (expandedWeeks.has(key)) expandedWeeks.delete(key);
      else expandedWeeks.add(key);
      expandAllPastWeeks = false;
      scheduleApply();
      refreshCalendarLanes();
      return;
    }

    const allButton = event.target.closest(".nw-past-weeks-all");
    if (allButton) {
      event.preventDefault();
      event.stopPropagation();
      expandAllPastWeeks = !expandAllPastWeeks;
      if (!expandAllPastWeeks) expandedWeeks.clear();
      scheduleApply();
      refreshCalendarLanes();
    }
  }, true);
}

function initPastWeekCollapse() {
  const calendar = document.querySelector("#calendar");
  if (!calendar) {
    window.setTimeout(initPastWeekCollapse, 180);
    return;
  }

  bindPastWeekControls(calendar);
  const observer = new MutationObserver(() => scheduleApply());
  observer.observe(calendar, { childList: true, subtree: true });
  window.addEventListener("resize", () => scheduleApply(), { passive: true });
  scheduleApply(100);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPastWeekCollapse, { once: true });
} else {
  initPastWeekCollapse();
}
