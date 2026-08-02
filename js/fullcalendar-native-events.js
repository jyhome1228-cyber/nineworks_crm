const eventStyle = document.createElement("link");
eventStyle.rel = "stylesheet";
eventStyle.href = new URL("../css/calendar-event-details.css?v=20260803-1", import.meta.url).href;
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

    .nw-meeting-star {
      display: inline-block;
      margin-right: 5px;
      color: #ffd166;
      font-size: .92em;
      transform: translateY(-1px);
    }

    .fc .nw-meeting-event {
      box-shadow: inset 0 0 0 1px rgba(255, 209, 102, .24);
    }

    .nw-time-section {
      display: grid;
      gap: 12px;
      border: 1px solid #303036;
      border-radius: 11px;
      padding: 14px;
      background: #202024;
    }

    .nw-time-section__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .nw-time-section__head > span {
      color: #bdbdc5;
      font-size: 12px;
      font-weight: 600;
    }

    .nw-all-day-toggle {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      color: #b9b9c1;
      font-size: 12px;
      cursor: pointer;
    }

    .nw-all-day-toggle input {
      width: 17px;
      height: 17px;
      margin: 0;
      accent-color: var(--primary);
    }

    .nw-time-quick {
      display: grid;
      gap: 6px;
    }

    .nw-time-quick input,
    .nw-time-grid input {
      width: 100%;
      height: 42px;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 0 12px;
      background: #27272c;
      color: #f1f1f3;
    }

    .nw-time-quick input:focus,
    .nw-time-grid input:focus {
      border-color: rgba(85, 119, 255, .72);
      outline: 0;
    }

    .nw-time-quick small {
      min-height: 18px;
      color: #777780;
      font-size: 11px;
    }

    .nw-time-quick small.is-success {
      color: #92d9b3;
    }

    .nw-time-quick small.is-error {
      color: #ff9999;
    }

    .nw-time-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }

    .nw-time-grid label {
      display: grid;
      gap: 6px;
      color: #a9a9b2;
      font-size: 11px;
    }

    .nw-time-grid input:disabled {
      opacity: .45;
      cursor: not-allowed;
    }

    .fc .fc-day-today.nw-today-flash {
      animation: nw-today-pulse 1.35s ease both;
    }

    @keyframes nw-today-pulse {
      0% { box-shadow: inset 0 0 0 0 rgba(85, 119, 255, 0); }
      22% { box-shadow: inset 0 0 0 4px rgba(85, 119, 255, .95), inset 0 0 42px rgba(67, 104, 245, .2); }
      60% { box-shadow: inset 0 0 0 2px rgba(85, 119, 255, .55), inset 0 0 28px rgba(67, 104, 245, .12); }
      100% { box-shadow: inset 0 0 0 0 rgba(85, 119, 255, 0); }
    }

    @media (max-width: 640px) {
      .nw-time-grid {
        grid-template-columns: 1fr;
      }
    }
  `;
  document.head.appendChild(criticalStyle);
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function toDateKey(date) {
  const value = new Date(date);
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

function toTimeKey(date) {
  const value = new Date(date);
  return `${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

function addDaysKey(key, amount) {
  const [year, month, day] = String(key).split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + amount);
  return toDateKey(date);
}

function addMinutesToTime(time, amount) {
  const [hour, minute] = String(time || "09:00").split(":").map(Number);
  const total = hour * 60 + minute + amount;
  return `${pad(Math.floor((total % 1440) / 60))}:${pad(total % 60)}`;
}

function parseTimeToken(token) {
  const text = String(token || "").trim().toLowerCase();
  const markerMatch = text.match(/(오전|오후|am|pm)/i);
  const marker = markerMatch?.[1]?.toLowerCase() || "";
  const match = text.match(/(\d{1,2})(?:\s*[:시]\s*(\d{1,2}))?\s*(반)?/);
  if (!match) return null;

  let hour = Number(match[1]);
  let minute = match[3] ? 30 : Number(match[2] || 0);
  if (hour > 24 || minute > 59) return null;

  if (marker === "오후" || marker === "pm") {
    if (hour < 12) hour += 12;
  } else if (marker === "오전" || marker === "am") {
    if (hour === 12) hour = 0;
  }

  return {
    hour,
    minute,
    explicit: Boolean(marker)
  };
}

function parseQuickTimeRange(value) {
  const normalized = String(value || "")
    .replace(/부터|까지/g, "")
    .replace(/[–—~〜]/g, "-")
    .trim();
  const parts = normalized.split("-").map((part) => part.trim()).filter(Boolean);
  if (parts.length !== 2) return null;

  const start = parseTimeToken(parts[0]);
  const end = parseTimeToken(parts[1]);
  if (!start || !end) return null;

  if (!start.explicit && !end.explicit) {
    if (start.hour >= 7 && end.hour <= 6) {
      end.hour += 12;
    } else if (start.hour <= 6 && end.hour <= 7) {
      start.hour += 12;
      end.hour += 12;
    }
  } else if (start.explicit && !end.explicit) {
    if (start.hour >= 12 && end.hour < 12) end.hour += 12;
  } else if (!start.explicit && end.explicit) {
    if (end.hour >= 12 && start.hour <= 6) start.hour += 12;
  }

  let startMinutes = start.hour * 60 + start.minute;
  let endMinutes = end.hour * 60 + end.minute;
  if (endMinutes <= startMinutes) {
    if (end.hour < 12) endMinutes += 12 * 60;
    if (endMinutes <= startMinutes) endMinutes += 24 * 60;
  }

  const nextDay = endMinutes >= 24 * 60;
  const endWithinDay = endMinutes % (24 * 60);
  return {
    startTime: `${pad(Math.floor(startMinutes / 60) % 24)}:${pad(startMinutes % 60)}`,
    endTime: `${pad(Math.floor(endWithinDay / 60))}:${pad(endWithinDay % 60)}`,
    nextDay
  };
}

function showWorkspaceToast(message) {
  const toast = document.querySelector("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.setTimeout(() => toast.classList.remove("is-visible"), 2400);
}

function setTimeFeedback(message = "", type = "") {
  const feedback = document.querySelector("#eventTimeFeedback");
  if (!feedback) return;
  feedback.textContent = message;
  feedback.classList.remove("is-success", "is-error");
  if (type) feedback.classList.add(`is-${type}`);
}

function syncTimeControlState() {
  const allDay = document.querySelector("#eventAllDay")?.checked ?? true;
  ["#eventStartTime", "#eventEndTime"].forEach((selector) => {
    const input = document.querySelector(selector);
    if (input) input.disabled = allDay;
  });
}

function setDrawerTiming({ allDay = true, startTime = "", endTime = "" } = {}) {
  ensureTimeControls();
  const allDayInput = document.querySelector("#eventAllDay");
  const startInput = document.querySelector("#eventStartTime");
  const endInput = document.querySelector("#eventEndTime");
  const quickInput = document.querySelector("#eventTimeRangeQuick");

  if (allDayInput) allDayInput.checked = allDay;
  if (startInput) startInput.value = allDay ? "" : (startTime || "09:00");
  if (endInput) endInput.value = allDay ? "" : (endTime || addMinutesToTime(startTime || "09:00", 60));
  if (quickInput) quickInput.value = "";
  setTimeFeedback(allDay ? "종일 일정으로 등록됩니다." : `${startInput?.value || ""}–${endInput?.value || ""} 시간 일정`, "");
  syncTimeControlState();
}

function ensureTimeControls() {
  const form = document.querySelector("#eventForm");
  if (!form || document.querySelector("#eventTimeSection")) return;

  const dateGrid = document.querySelector("#eventStart")?.closest(".form-grid");
  if (!dateGrid) return;

  const section = document.createElement("div");
  section.id = "eventTimeSection";
  section.className = "nw-time-section";
  section.innerHTML = `
    <div class="nw-time-section__head">
      <span>시간 설정</span>
      <label class="nw-all-day-toggle">
        <input id="eventAllDay" type="checkbox" checked />
        <span>종일 일정</span>
      </label>
    </div>
    <label class="nw-time-quick">
      <input id="eventTimeRangeQuick" type="text" inputmode="text" placeholder="빠른 입력 · 예: 8-1시, 오전 10시-오후 1시" />
      <small id="eventTimeFeedback">시간을 비워두면 종일 일정으로 등록됩니다.</small>
    </label>
    <div class="nw-time-grid">
      <label><span>시작 시간</span><input id="eventStartTime" type="time" step="1800" disabled /></label>
      <label><span>종료 시간</span><input id="eventEndTime" type="time" step="1800" disabled /></label>
    </div>
  `;
  dateGrid.insertAdjacentElement("afterend", section);

  const allDayInput = document.querySelector("#eventAllDay");
  const quickInput = document.querySelector("#eventTimeRangeQuick");
  const startInput = document.querySelector("#eventStartTime");
  const endInput = document.querySelector("#eventEndTime");

  allDayInput?.addEventListener("change", () => {
    syncTimeControlState();
    setTimeFeedback(allDayInput.checked ? "종일 일정으로 등록됩니다." : "시간을 선택하거나 ‘8-1시’처럼 입력하세요.");
  });

  const applyQuickRange = () => {
    const value = quickInput?.value.trim();
    if (!value) {
      setTimeFeedback("");
      return;
    }
    const parsed = parseQuickTimeRange(value);
    if (!parsed) {
      setTimeFeedback("시간을 ‘8-1시’ 또는 ‘오전 10시-오후 1시’처럼 입력해주세요.", "error");
      return;
    }

    if (allDayInput) allDayInput.checked = false;
    if (startInput) startInput.value = parsed.startTime;
    if (endInput) endInput.value = parsed.endTime;
    if (parsed.nextDay) {
      const endDate = document.querySelector("#eventEnd");
      const startDate = document.querySelector("#eventStart");
      if (endDate && startDate?.value) endDate.value = addDaysKey(startDate.value, 1);
    }
    syncTimeControlState();
    setTimeFeedback(`${parsed.startTime}–${parsed.endTime}${parsed.nextDay ? " · 다음 날 종료" : ""}로 설정했습니다.`, "success");
  };

  quickInput?.addEventListener("change", applyQuickRange);
  quickInput?.addEventListener("blur", applyQuickRange);

  [startInput, endInput].forEach((input) => {
    input?.addEventListener("change", () => {
      if (allDayInput) allDayInput.checked = false;
      syncTimeControlState();
      setTimeFeedback(`${startInput?.value || "--:--"}–${endInput?.value || "--:--"} 시간 일정`);
    });
  });

  form.addEventListener("submit", persistDrawerTiming, true);
}

async function persistDrawerTiming(event) {
  const api = window.NineworksFirebase;
  const form = event.currentTarget;
  if (!api?.auth?.currentUser || !form) return;

  const idInput = document.querySelector("#eventId");
  if (!idInput) return;
  if (!idInput.value) idInput.value = `event_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const start = document.querySelector("#eventStart")?.value;
  const end = document.querySelector("#eventEnd")?.value || start;
  const allDay = document.querySelector("#eventAllDay")?.checked ?? true;
  const startTime = document.querySelector("#eventStartTime")?.value || "";
  const endTime = document.querySelector("#eventEndTime")?.value || "";

  if (!allDay && (!startTime || !endTime)) {
    event.preventDefault();
    event.stopImmediatePropagation();
    setTimeFeedback("시작 시간과 종료 시간을 모두 입력해주세요.", "error");
    return;
  }

  if (!allDay) {
    const startValue = new Date(`${start}T${startTime}:00`);
    const endValue = new Date(`${end}T${endTime}:00`);
    if (!(endValue > startValue)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      setTimeFeedback("종료 시간은 시작 시간보다 뒤여야 합니다.", "error");
      return;
    }
  }

  api.setDoc(api.doc(api.db, "events", idInput.value), {
    allDay,
    start,
    end,
    startTime: allDay ? "" : startTime,
    endTime: allDay ? "" : endTime,
    updatedAt: api.serverTimestamp()
  }, { merge: true }).catch((error) => {
    console.warn("일정 시간 저장 실패", error);
  });
}

function openDrawerForSelection(info) {
  ensureTimeControls();
  const form = document.querySelector("#eventForm");
  form?.reset();

  const startKey = toDateKey(info.start);
  const endKey = info.allDay
    ? addDaysKey(toDateKey(info.end), -1)
    : toDateKey(info.end || info.start);

  const values = {
    eventId: "",
    eventTitle: "",
    eventClient: "",
    eventCategory: "",
    eventStart: startKey,
    eventEnd: endKey,
    eventStatus: "planned",
    eventMemo: "",
    eventLink: ""
  };
  Object.entries(values).forEach(([id, value]) => {
    const input = document.getElementById(id);
    if (input) input.value = value;
  });

  const member = document.querySelector("#eventMember");
  if (member && !member.value) member.selectedIndex = 0;
  const deleteButton = document.querySelector("#deleteEventButton");
  if (deleteButton) deleteButton.hidden = true;
  const drawerTitle = document.querySelector("#drawerTitle");
  if (drawerTitle) drawerTitle.textContent = "일정 추가";

  setDrawerTiming({
    allDay: info.allDay,
    startTime: info.allDay ? "" : toTimeKey(info.start),
    endTime: info.allDay ? "" : toTimeKey(info.end || new Date(info.start.getTime() + 3600000))
  });

  const backdrop = document.querySelector("#drawerBackdrop");
  const drawer = document.querySelector("#eventDrawer");
  if (backdrop) backdrop.hidden = false;
  drawer?.classList.add("is-open");
  drawer?.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  window.setTimeout(() => document.querySelector("#eventTitle")?.focus(), 120);
}

async function populateDrawerFromStoredEvent(id) {
  const api = window.NineworksFirebase;
  if (!api?.auth?.currentUser || !id) return;
  try {
    const snapshot = await api.getDoc(api.doc(api.db, "events", id));
    if (!snapshot.exists()) return;
    const data = snapshot.data();
    setDrawerTiming({
      allDay: data.allDay !== false && !data.startTime,
      startTime: data.startTime || "",
      endTime: data.endTime || ""
    });
  } catch (error) {
    console.warn("일정 시간 불러오기 실패", error);
  }
}

function normalizeCalendarEvent(event) {
  const data = event?.extendedProps || {};
  const isTimed = data.allDay === false || Boolean(data.startTime || data.endTime);
  if (!isTimed || !data.start) return event;

  const startTime = data.startTime || "09:00";
  const endTime = data.endTime || addMinutesToTime(startTime, 60);
  return {
    ...event,
    allDay: false,
    start: `${data.start}T${startTime}:00`,
    end: `${data.end || data.start}T${endTime}:00`
  };
}

function wrapEventsSource(source) {
  if (typeof source === "function") {
    return (fetchInfo, successCallback, failureCallback) => source(
      fetchInfo,
      (events) => successCallback((events || []).map(normalizeCalendarEvent)),
      failureCallback
    );
  }
  if (Array.isArray(source)) return source.map(normalizeCalendarEvent);
  return source;
}

async function persistCalendarTiming(calendarEvent) {
  const api = window.NineworksFirebase;
  if (!api?.auth?.currentUser || !calendarEvent?.id || !calendarEvent.start) return;

  let payload;
  if (calendarEvent.allDay) {
    const start = toDateKey(calendarEvent.start);
    const exclusiveEnd = calendarEvent.end ? toDateKey(calendarEvent.end) : addDaysKey(start, 1);
    payload = {
      start,
      end: addDaysKey(exclusiveEnd, -1),
      allDay: true,
      startTime: "",
      endTime: ""
    };
  } else {
    const endDate = calendarEvent.end || new Date(calendarEvent.start.getTime() + 3600000);
    payload = {
      start: toDateKey(calendarEvent.start),
      end: toDateKey(endDate),
      allDay: false,
      startTime: toTimeKey(calendarEvent.start),
      endTime: toTimeKey(endDate)
    };
  }

  await api.setDoc(api.doc(api.db, "events", calendarEvent.id), {
    ...payload,
    updatedAt: api.serverTimestamp()
  }, { merge: true });
}

function handleTimedMove(info, label) {
  persistCalendarTiming(info.event)
    .then(() => showWorkspaceToast(label))
    .catch((error) => {
      console.error("시간 일정 변경 실패", error);
      info.revert?.();
      showWorkspaceToast("일정 변경을 저장하지 못했습니다.");
    });
}

function flashToday(calendarElement) {
  const todayCells = [...calendarElement.querySelectorAll(".fc-day-today")];
  todayCells.forEach((cell) => {
    cell.classList.remove("nw-today-flash");
    void cell.offsetWidth;
    cell.classList.add("nw-today-flash");
    window.setTimeout(() => cell.classList.remove("nw-today-flash"), 1500);
  });
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
      const originalDateClick = options.dateClick;
      const originalEventClick = options.eventClick;
      const originalSelect = options.select;
      const originalEventDrop = options.eventDrop;
      const originalEventResize = options.eventResize;
      const wrappedEvents = wrapEventsSource(options.events);

      super(element, {
        ...options,
        events: wrappedEvents,
        selectable: true,
        selectMirror: true,
        unselectAuto: true,
        slotDuration: options.slotDuration || "00:30:00",
        snapDuration: options.snapDuration || "00:30:00",
        scrollTime: options.scrollTime || "08:00:00",
        slotMinTime: options.slotMinTime || "06:00:00",
        slotMaxTime: options.slotMaxTime || "24:00:00",
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
          if (data.category === "미팅") {
            const star = document.createElement("span");
            star.className = "nw-meeting-star";
            star.textContent = "★";
            title.appendChild(star);
          }
          title.appendChild(document.createTextNode(`${data.client || ""}${data.client ? " · " : ""}${data.title || info.event.title || "일정"}`));

          const note = document.createElement("small");
          note.className = "nw-event-note";
          const timeLabel = info.event.allDay
            ? ""
            : `${data.startTime || toTimeKey(info.event.start)}–${data.endTime || toTimeKey(info.event.end || info.event.start)}`;
          note.textContent = [
            timeLabel,
            cleanSummary(data.memo) || [data.member, data.category].filter(Boolean).join(" · ")
          ].filter(Boolean).join(" · ");

          wrapper.appendChild(title);
          if (note.textContent) wrapper.appendChild(note);
          return { domNodes: [wrapper] };
        },
        dateClick(info) {
          originalDateClick?.(info);
          window.setTimeout(() => setDrawerTiming({ allDay: true }), 0);
        },
        select(info) {
          if (originalSelect) {
            originalSelect(info);
            window.setTimeout(() => setDrawerTiming({
              allDay: info.allDay,
              startTime: info.allDay ? "" : toTimeKey(info.start),
              endTime: info.allDay ? "" : toTimeKey(info.end)
            }), 0);
          } else {
            openDrawerForSelection(info);
          }
          this.unselect?.();
        },
        eventClick(info) {
          originalEventClick?.(info);
          const data = info.event.extendedProps || {};
          window.setTimeout(() => setDrawerTiming({
            allDay: info.event.allDay && !data.startTime,
            startTime: data.startTime || (info.event.allDay ? "" : toTimeKey(info.event.start)),
            endTime: data.endTime || (info.event.allDay ? "" : toTimeKey(info.event.end || info.event.start))
          }), 0);
        },
        eventDrop(info) {
          if (!info.event.allDay) {
            handleTimedMove(info, "일정 날짜와 시간이 변경되었습니다.");
            return;
          }
          const result = originalEventDrop?.(info);
          Promise.resolve(result).then(() => persistCalendarTiming(info.event)).catch(() => {});
          return result;
        },
        eventResize(info) {
          if (!info.event.allDay) {
            handleTimedMove(info, "일정 시간이 변경되었습니다.");
            return;
          }
          const result = originalEventResize?.(info);
          Promise.resolve(result).then(() => persistCalendarTiming(info.event)).catch(() => {});
          return result;
        },
        eventDidMount(info) {
          info.el.classList.add("nw-event-rendered");
          if (info.event.extendedProps?.category === "미팅") info.el.classList.add("nw-meeting-event");
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

      if (!element.dataset.nwTodayReady) {
        element.dataset.nwTodayReady = "true";
        element.addEventListener("click", (event) => {
          if (!event.target.closest(".fc-today-button")) return;
          window.setTimeout(() => flashToday(element), 90);
        });
      }
    }
  }

  window.FullCalendar.Calendar = NineworksCalendar;
  window.FullCalendar.__nineworksNativeEvents = true;
}

function bindDrawerTimingShortcuts() {
  ensureTimeControls();

  document.addEventListener("click", (event) => {
    if (event.target.closest("#openEventDrawer, [data-request-schedule]")) {
      window.setTimeout(() => setDrawerTiming({ allDay: true }), 0);
      return;
    }

    const storedEventButton = event.target.closest("[data-open-event]");
    if (storedEventButton?.dataset.openEvent) {
      window.setTimeout(() => populateDrawerFromStoredEvent(storedEventButton.dataset.openEvent), 20);
    }
  }, true);
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
  document.addEventListener("DOMContentLoaded", () => {
    ensureTimeControls();
    bindDrawerTimingShortcuts();
    observeCalendar();
  }, { once: true });
} else {
  ensureTimeControls();
  bindDrawerTimingShortcuts();
  observeCalendar();
}
