const resizeStyle = document.createElement("link");
resizeStyle.rel = "stylesheet";
resizeStyle.href = new URL("../css/calendar-duration-resize.css?v=20260804-2", import.meta.url).href;
document.head.appendChild(resizeStyle);

const BaseCalendar = window.FullCalendar?.Calendar;
const firebaseApi = () => window.NineworksFirebase;
let activeResize = null;

function pad(value) {
  return String(value).padStart(2, "0");
}

function toDateKey(date) {
  const value = new Date(date);
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

function addDaysKey(key, amount) {
  const [year, month, day] = String(key).split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + amount);
  return toDateKey(date);
}

function toTimeKey(date) {
  const value = new Date(date);
  return `${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.setTimeout(() => toast.classList.remove("is-visible"), 2400);
}

function clearResizeTargets() {
  document.querySelectorAll("#calendar .is-duration-resize-target").forEach((cell) => {
    cell.classList.remove("is-duration-resize-target");
  });
}

function dateCellAt(x, y) {
  const target = document.elementFromPoint(x, y);
  const cell = target?.closest?.("#calendar [data-date]");
  return cell && document.querySelector("#calendar")?.contains(cell) ? cell : null;
}

function updateResizeTarget(x, y) {
  clearResizeTargets();
  const cell = dateCellAt(x, y);
  cell?.classList.add("is-duration-resize-target");
  if (activeResize) activeResize.targetCell = cell;
}

function eventEndTime(calendarEvent) {
  const props = calendarEvent.extendedProps || {};
  if (props.endTime) return props.endTime;
  if (calendarEvent.end) return toTimeKey(calendarEvent.end);
  if (props.startTime) {
    const [hour, minute] = props.startTime.split(":").map(Number);
    const total = hour * 60 + minute + 60;
    return `${pad(Math.floor((total % 1440) / 60))}:${pad(total % 60)}`;
  }
  return "18:00";
}

async function saveDuration(calendarEvent, targetDate) {
  const api = firebaseApi();
  if (!api?.auth?.currentUser || !calendarEvent?.id) throw new Error("로그인이 필요합니다.");

  const props = calendarEvent.extendedProps || {};
  const startDate = props.start || toDateKey(calendarEvent.start);
  if (targetDate < startDate) throw new Error("종료일은 시작일보다 빠를 수 없습니다.");

  let nextEnd;
  let payload;

  if (calendarEvent.allDay) {
    nextEnd = new Date(`${addDaysKey(targetDate, 1)}T00:00:00`);
    payload = {
      start: startDate,
      end: targetDate,
      allDay: true,
      startTime: "",
      endTime: ""
    };
  } else {
    const startTime = props.startTime || toTimeKey(calendarEvent.start);
    const endTime = eventEndTime(calendarEvent);
    const startValue = new Date(`${startDate}T${startTime}:00`);
    nextEnd = new Date(`${targetDate}T${endTime}:00`);
    if (!(nextEnd > startValue)) throw new Error("종료 시점은 시작 시점보다 뒤여야 합니다.");
    payload = {
      start: startDate,
      end: targetDate,
      allDay: false,
      startTime,
      endTime
    };
  }

  calendarEvent.setEnd(nextEnd);
  calendarEvent.setExtendedProp("end", targetDate);
  calendarEvent.setExtendedProp("allDay", payload.allDay);
  calendarEvent.setExtendedProp("startTime", payload.startTime);
  calendarEvent.setExtendedProp("endTime", payload.endTime);

  await api.setDoc(api.doc(api.db, "events", calendarEvent.id), {
    ...payload,
    updatedAt: api.serverTimestamp()
  }, { merge: true });
}

function finishCustomResize({ save = false } = {}) {
  if (!activeResize) return;
  const state = activeResize;
  activeResize = null;

  state.handle.classList.remove("is-active");
  state.eventElement.classList.remove("is-custom-resizing");
  document.body.classList.remove("is-calendar-duration-resizing");
  clearResizeTargets();

  if (!save) return;
  const targetDate = state.targetCell?.getAttribute("data-date") || "";
  if (!targetDate) {
    showToast("기간을 늘릴 날짜 칸에서 손을 떼어주세요.");
    return;
  }

  saveDuration(state.calendarEvent, targetDate)
    .then(() => showToast(`일정 종료일을 ${targetDate}로 변경했습니다.`))
    .catch((error) => {
      console.warn("일정 기간 변경 실패", error);
      state.calendarEvent.setEnd(state.originalEnd);
      showToast(error?.message || "일정 기간을 변경하지 못했습니다.");
    });
}

function beginCustomResize(event, info, handle) {
  if (event.button !== undefined && event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();

  finishCustomResize();
  activeResize = {
    pointerId: event.pointerId,
    calendarEvent: info.event,
    eventElement: info.el,
    handle,
    originalEnd: info.event.end ? new Date(info.event.end) : null,
    targetCell: info.el.closest("[data-date]")
  };

  handle.classList.add("is-active");
  info.el.classList.add("is-custom-resizing");
  document.body.classList.add("is-calendar-duration-resizing");
  handle.setPointerCapture?.(event.pointerId);
  updateResizeTarget(event.clientX, event.clientY);
}

function addCustomResizeHandle(info) {
  if (!info.el.classList.contains("fc-daygrid-event") || info.isEnd === false) return;
  if (info.el.querySelector(".nw-duration-resize-handle")) return;

  info.el.classList.add("nw-duration-resizable");
  const handle = document.createElement("span");
  handle.className = "nw-duration-resize-handle";
  handle.setAttribute("role", "button");
  handle.setAttribute("aria-label", "일정 종료일 조절");
  handle.title = "오른쪽으로 끌어 일정 기간 조절";
  info.el.appendChild(handle);

  handle.addEventListener("pointerdown", (event) => beginCustomResize(event, info, handle));
  handle.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
  });
}

function bindGlobalPointerEvents() {
  if (document.documentElement.dataset.durationPointerReady === "true") return;
  document.documentElement.dataset.durationPointerReady = "true";

  document.addEventListener("pointermove", (event) => {
    if (!activeResize || event.pointerId !== activeResize.pointerId) return;
    event.preventDefault();
    updateResizeTarget(event.clientX, event.clientY);
  }, { passive: false });

  document.addEventListener("pointerup", (event) => {
    if (!activeResize || event.pointerId !== activeResize.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    finishCustomResize({ save: true });
  }, true);

  document.addEventListener("pointercancel", () => finishCustomResize());
  window.addEventListener("blur", () => finishCustomResize());
}

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
          addCustomResizeHandle(info);

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
  bindGlobalPointerEvents();
}
