const resizeStyle = document.createElement("link");
resizeStyle.rel = "stylesheet";
resizeStyle.href = new URL("../css/calendar-duration-resize.css?v=20260804-4", import.meta.url).href;
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

function visibleDateCells() {
  return [...document.querySelectorAll("#calendar .fc-daygrid-day[data-date]")]
    .filter((cell) => cell.offsetParent !== null)
    .sort((a, b) => String(a.dataset.date).localeCompare(String(b.dataset.date)));
}

function clearResizeTargets() {
  document.querySelectorAll("#calendar .is-duration-resize-target").forEach((cell) => {
    cell.classList.remove("is-duration-resize-target");
  });
}

function dateCellAt(x, y) {
  const calendar = document.querySelector("#calendar");
  if (!calendar) return null;

  const direct = document.elementFromPoint(x, y)?.closest?.("#calendar .fc-daygrid-day[data-date]");
  if (direct && calendar.contains(direct)) return direct;

  const cells = visibleDateCells();
  const sameRow = cells.filter((cell) => {
    const rect = cell.getBoundingClientRect();
    return y >= rect.top && y <= rect.bottom;
  });
  if (!sameRow.length) return null;

  return sameRow.reduce((nearest, cell) => {
    const rect = cell.getBoundingClientRect();
    const distance = x < rect.left ? rect.left - x : x > rect.right ? x - rect.right : 0;
    if (!nearest || distance < nearest.distance) return { cell, distance };
    return nearest;
  }, null)?.cell || null;
}

function eventSegmentElements(eventId) {
  return [...document.querySelectorAll("#calendar .fc-daygrid-event[data-nw-event-id]")]
    .filter((element) => element.dataset.nwEventId === eventId);
}

function markSourceSegments(eventId, active) {
  eventSegmentElements(eventId).forEach((segment) => {
    segment.classList.toggle("is-duration-resize-source", active);
  });
}

function clearPreview() {
  document.querySelector("#nwDurationResizePreview")?.remove();
}

function createPreviewHost() {
  clearPreview();
  const host = document.createElement("div");
  host.id = "nwDurationResizePreview";
  host.className = "nw-duration-preview";
  host.setAttribute("aria-hidden", "true");
  document.body.appendChild(host);
  return host;
}

function normalizedTargetCell(cell) {
  if (!activeResize || !cell) return null;
  const targetDate = cell.getAttribute("data-date") || "";
  if (targetDate >= activeResize.startDate) return cell;
  return visibleDateCells().find((candidate) => candidate.dataset.date === activeResize.startDate)
    || visibleDateCells().find((candidate) => candidate.dataset.date > activeResize.startDate)
    || null;
}

function rowTopForPreview(row, fallbackOffset) {
  if (!activeResize) return row.getBoundingClientRect().top + fallbackOffset;
  const rowRect = row.getBoundingClientRect();
  const existing = activeResize.segmentRects.find((item) => {
    const middle = item.rect.top + item.rect.height / 2;
    return middle >= rowRect.top && middle <= rowRect.bottom;
  });
  return existing ? existing.rect.top : rowRect.top + fallbackOffset;
}

function appendPreviewContent(segment, isFirstSegment) {
  if (!activeResize || !isFirstSegment) return;
  const content = activeResize.eventElement.querySelector(".nw-event-content")?.cloneNode(true);
  if (!content) return;
  content.classList.add("nw-duration-preview-content");
  segment.appendChild(content);
}

function previewRightEdge({ pointerX, left, cellRect, isTargetRow }) {
  if (!isTargetRow) return cellRect.right - 3;
  return Math.max(left + 24, Math.min(pointerX, cellRect.right - 3));
}

function renderContinuousPreview(pointerX) {
  if (!activeResize?.previewHost || !activeResize.targetCell) return;

  const targetDate = activeResize.targetCell.getAttribute("data-date") || "";
  const cells = visibleDateCells();
  const startCell = cells.find((cell) => cell.dataset.date === activeResize.startDate)
    || cells.find((cell) => cell.dataset.date > activeResize.startDate);
  if (!startCell || !targetDate) return;

  const visibleStartDate = startCell.dataset.date;
  const rangeCells = cells.filter((cell) => {
    const date = cell.dataset.date;
    return date >= visibleStartDate && date <= targetDate;
  });
  if (!rangeCells.length) return;

  const groupedRows = [];
  rangeCells.forEach((cell) => {
    const row = cell.closest("tr");
    if (!row) return;
    let group = groupedRows.find((item) => item.row === row);
    if (!group) {
      group = { row, cells: [] };
      groupedRows.push(group);
    }
    group.cells.push(cell);
  });

  activeResize.previewHost.replaceChildren();

  groupedRows.forEach((group, index) => {
    group.cells.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
    const firstCell = group.cells[0];
    const lastCell = group.cells[group.cells.length - 1];
    const firstRect = firstCell.getBoundingClientRect();
    const lastRect = lastCell.getBoundingClientRect();
    const isTargetRow = group.row === activeResize.targetCell.closest("tr");

    const left = firstRect.left + 3;
    const right = previewRightEdge({
      pointerX,
      left,
      cellRect: lastRect,
      isTargetRow
    });

    const segment = document.createElement("div");
    segment.className = "nw-duration-preview-segment";
    segment.style.left = `${left}px`;
    segment.style.top = `${rowTopForPreview(group.row, activeResize.laneOffset)}px`;
    segment.style.width = `${Math.max(24, right - left)}px`;
    segment.style.height = `${activeResize.eventRect.height}px`;
    segment.style.setProperty("--nw-preview-background", activeResize.visual.backgroundColor);
    segment.style.setProperty("--nw-preview-color", activeResize.visual.color);
    segment.style.setProperty("--nw-preview-radius", activeResize.visual.borderRadius);
    segment.style.setProperty("--nw-preview-shadow", activeResize.visual.boxShadow);
    appendPreviewContent(segment, index === 0);
    activeResize.previewHost.appendChild(segment);
  });
}

function updateResizeTarget(x, y) {
  if (!activeResize) return;
  clearResizeTargets();
  const cell = normalizedTargetCell(dateCellAt(x, y));
  cell?.classList.add("is-duration-resize-target");
  activeResize.targetCell = cell;
  activeResize.lastPointerX = x;
  renderContinuousPreview(x);
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

function restoreOriginalDuration(state) {
  state.calendarEvent.setEnd(state.originalEnd);
  state.calendarEvent.setExtendedProp("end", state.originalProps.end || state.startDate);
  state.calendarEvent.setExtendedProp("allDay", state.originalProps.allDay);
  state.calendarEvent.setExtendedProp("startTime", state.originalProps.startTime || "");
  state.calendarEvent.setExtendedProp("endTime", state.originalProps.endTime || "");
}

function finishCustomResize({ save = false } = {}) {
  if (!activeResize) return;
  const state = activeResize;
  activeResize = null;

  state.handle.classList.remove("is-active");
  state.eventElement.classList.remove("is-custom-resizing");
  markSourceSegments(state.calendarEvent.id, false);
  document.body.classList.remove("is-calendar-duration-resizing");
  clearResizeTargets();
  clearPreview();

  if (!save) return;
  const targetDate = state.targetCell?.getAttribute("data-date") || "";
  if (!targetDate) {
    showToast("캘린더 안에서 손을 떼어주세요.");
    return;
  }
  if (targetDate === state.originalEndDate) return;

  saveDuration(state.calendarEvent, targetDate)
    .then(() => showToast("일정 기간이 변경되었습니다."))
    .catch((error) => {
      console.warn("일정 기간 변경 실패", error);
      restoreOriginalDuration(state);
      showToast(error?.message || "일정 기간을 변경하지 못했습니다.");
    });
}

function beginCustomResize(event, info, handle) {
  if (event.button !== undefined && event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();

  finishCustomResize();

  const props = info.event.extendedProps || {};
  const eventRect = info.el.getBoundingClientRect();
  const row = info.el.closest("tr");
  const rowRect = row?.getBoundingClientRect();
  const computed = getComputedStyle(info.el);
  const originalEndDate = props.end
    || (info.event.allDay && info.event.end ? addDaysKey(toDateKey(info.event.end), -1) : info.event.end ? toDateKey(info.event.end) : props.start || toDateKey(info.event.start));

  activeResize = {
    pointerId: event.pointerId,
    calendarEvent: info.event,
    eventElement: info.el,
    handle,
    originalEnd: info.event.end ? new Date(info.event.end) : null,
    originalEndDate,
    originalProps: {
      end: props.end || originalEndDate,
      allDay: info.event.allDay,
      startTime: props.startTime || "",
      endTime: props.endTime || ""
    },
    startDate: props.start || toDateKey(info.event.start),
    targetCell: null,
    eventRect,
    laneOffset: rowRect ? eventRect.top - rowRect.top : 34,
    segmentRects: eventSegmentElements(info.event.id).map((element) => ({ element, rect: element.getBoundingClientRect() })),
    previewHost: createPreviewHost(),
    visual: {
      backgroundColor: computed.backgroundColor,
      color: computed.color,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow
    },
    lastPointerX: event.clientX
  };

  handle.classList.add("is-active");
  info.el.classList.add("is-custom-resizing");
  markSourceSegments(info.event.id, true);
  document.body.classList.add("is-calendar-duration-resizing");
  handle.setPointerCapture?.(event.pointerId);
  updateResizeTarget(event.clientX, event.clientY);
}

function addCustomResizeHandle(info) {
  if (!info.el.classList.contains("fc-daygrid-event")) return;

  info.el.dataset.nwEventId = info.event.id;
  if (info.isEnd === false || info.el.querySelector(".nw-duration-resize-handle")) return;

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
