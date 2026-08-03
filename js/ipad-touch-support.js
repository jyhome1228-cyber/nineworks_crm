const ipadStyle = document.createElement("link");
ipadStyle.rel = "stylesheet";
ipadStyle.href = new URL("../css/ipad-mini-responsive.css?v=20260803-1", import.meta.url).href;
document.head.appendChild(ipadStyle);

const LONG_PRESS_MS = 320;
const MOVE_CANCEL_PX = 11;
let touchState = null;
let suppressChipClickUntil = 0;

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

function isTouchDevice() {
  return navigator.maxTouchPoints > 0 || window.matchMedia("(pointer: coarse)").matches;
}

function dateKey(date) {
  const value = new Date(date);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function showToast(message) {
  const toast = $("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

function updateTouchCopy() {
  if (!isTouchDevice()) return;
  const heading = $("#clientDragSection .client-drag-section__head h2");
  const description = $("#clientDragSection .client-drag-section__head p:not(.eyebrow)");
  const hint = $("#clientDragSection .client-drag-section__hint");

  if (heading) heading.textContent = "클라이언트를 길게 눌러 캘린더에 놓으세요.";
  if (description) description.textContent = "짧게 누르면 오늘 일정이 열리고, 길게 누른 뒤 원하는 날짜에서 손을 떼면 해당 날짜로 등록됩니다.";
  if (hint) hint.textContent = "길게 누르면 칩이 떠오르고 손가락 아래 날짜가 파란색으로 표시됩니다.";

  $$(".client-drag-chip").forEach((chip) => {
    chip.title = "짧게 누르면 오늘 일정 · 길게 눌러 날짜로 이동";
    chip.setAttribute("aria-label", `${chip.dataset.clientName || chip.textContent} 일정 추가. 길게 눌러 날짜로 이동`);
  });
}

function clearDropTargets() {
  $$("#calendar .is-client-drop-target").forEach((element) => element.classList.remove("is-client-drop-target"));
}

function createGhost(chip, x, y) {
  const ghost = document.createElement("div");
  ghost.className = "nw-touch-drag-ghost";
  ghost.textContent = chip.dataset.clientName || chip.textContent.trim();
  document.body.appendChild(ghost);
  moveGhost(ghost, x, y);
  return ghost;
}

function moveGhost(ghost, x, y) {
  if (!ghost) return;
  ghost.style.left = `${x}px`;
  ghost.style.top = `${y}px`;
}

function findCalendarDateCell(x, y) {
  const element = document.elementFromPoint(x, y);
  const cell = element?.closest?.("#calendar [data-date]");
  if (!cell || !$("#calendar")?.contains(cell)) return null;
  return cell;
}

function updateTarget(x, y) {
  clearDropTargets();
  const cell = findCalendarDateCell(x, y);
  cell?.classList.add("is-client-drop-target");
  if (touchState) touchState.targetCell = cell;
}

function autoScroll(y) {
  const edge = 92;
  if (y < edge) window.scrollBy(0, -14);
  else if (y > window.innerHeight - edge) window.scrollBy(0, 14);
}

function beginTouchDrag() {
  if (!touchState || touchState.active) return;
  touchState.active = true;
  touchState.chip.classList.add("is-touch-dragging");
  document.body.classList.add("is-touch-client-dragging");
  touchState.ghost = createGhost(touchState.chip, touchState.lastX, touchState.lastY);
  updateTarget(touchState.lastX, touchState.lastY);
  navigator.vibrate?.(22);
}

function cancelLongPress() {
  if (touchState?.timer) window.clearTimeout(touchState.timer);
  if (touchState) touchState.timer = null;
}

function finishTouchDrag({ open = false } = {}) {
  if (!touchState) return;
  cancelLongPress();
  const { chip, ghost, targetCell, active } = touchState;
  const client = chip.dataset.clientName || chip.textContent.trim();
  const targetDate = targetCell?.getAttribute("data-date") || "";

  chip.classList.remove("is-touch-dragging");
  ghost?.remove();
  document.body.classList.remove("is-touch-client-dragging");
  clearDropTargets();
  touchState = null;

  if (!active) return;
  suppressChipClickUntil = Date.now() + 650;

  if (open && client && targetDate) {
    openScheduleDrawer(client, targetDate);
  } else if (open) {
    showToast("클라이언트를 캘린더 날짜 칸에 놓아주세요.");
  }
}

function openScheduleDrawer(client, targetDate) {
  const openButton = $("#openEventDrawer");
  if (!openButton) return;
  openButton.click();

  window.setTimeout(() => {
    const clientSelect = $("#eventClient");
    const title = $("#eventTitle");
    const start = $("#eventStart");
    const end = $("#eventEnd");
    const status = $("#eventStatus");

    if (clientSelect) {
      clientSelect.value = client;
      clientSelect.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (start) {
      start.value = targetDate || dateKey(new Date());
      start.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (end) {
      end.value = targetDate || dateKey(new Date());
      end.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (status) status.value = "planned";
    if (title && !title.value) title.placeholder = `${client} 작업 내용을 입력하세요`;
    title?.focus();
  }, 120);
}

function touchByIdentifier(touches, identifier) {
  return [...touches].find((touch) => touch.identifier === identifier) || null;
}

function bindTouchClientDrag() {
  if (!isTouchDevice() || document.documentElement.dataset.ipadTouchDragReady === "true") return;
  document.documentElement.dataset.ipadTouchDragReady = "true";

  document.addEventListener("touchstart", (event) => {
    const chip = event.target.closest?.(".client-drag-chip");
    if (!chip || event.touches.length !== 1) return;
    const touch = event.touches[0];

    finishTouchDrag();
    touchState = {
      chip,
      identifier: touch.identifier,
      startX: touch.clientX,
      startY: touch.clientY,
      lastX: touch.clientX,
      lastY: touch.clientY,
      active: false,
      targetCell: null,
      ghost: null,
      timer: window.setTimeout(beginTouchDrag, LONG_PRESS_MS)
    };
  }, { passive: true });

  document.addEventListener("touchmove", (event) => {
    if (!touchState) return;
    const touch = touchByIdentifier(event.touches, touchState.identifier);
    if (!touch) return;

    touchState.lastX = touch.clientX;
    touchState.lastY = touch.clientY;

    if (!touchState.active) {
      const distance = Math.hypot(touch.clientX - touchState.startX, touch.clientY - touchState.startY);
      if (distance > MOVE_CANCEL_PX) {
        cancelLongPress();
        touchState = null;
      }
      return;
    }

    event.preventDefault();
    moveGhost(touchState.ghost, touch.clientX, touch.clientY);
    autoScroll(touch.clientY);
    updateTarget(touch.clientX, touch.clientY);
  }, { passive: false });

  document.addEventListener("touchend", (event) => {
    if (!touchState) return;
    const ended = touchByIdentifier(event.changedTouches, touchState.identifier);
    if (!ended) return;
    if (touchState.active) event.preventDefault();
    finishTouchDrag({ open: true });
  }, { passive: false });

  document.addEventListener("touchcancel", () => finishTouchDrag(), { passive: true });

  document.addEventListener("click", (event) => {
    if (Date.now() > suppressChipClickUntil) return;
    if (!event.target.closest?.(".client-drag-chip")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
}

function observeClientChips() {
  const list = $("#clientDragList");
  if (!list) {
    window.setTimeout(observeClientChips, 180);
    return;
  }

  updateTouchCopy();
  if (list.dataset.touchCopyObserver === "true") return;
  list.dataset.touchCopyObserver = "true";
  new MutationObserver(updateTouchCopy).observe(list, { childList: true });
}

function initializeIpadSupport() {
  bindTouchClientDrag();
  observeClientChips();
  window.addEventListener("orientationchange", () => {
    window.setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
      updateTouchCopy();
    }, 280);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeIpadSupport, { once: true });
} else {
  initializeIpadSupport();
}
