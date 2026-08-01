const stylesheet = document.createElement("link");
stylesheet.rel = "stylesheet";
stylesheet.href = new URL("../css/ui-enhancements.css", import.meta.url).href;
document.head.appendChild(stylesheet);

const CLIENT_MIME = "application/x-nineworks-client";
const REFERENCE_MARKER = "[원본·참고 내용]";
let draggedClient = "";

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

function updateCalendarCopy() {
  const heading = $("#calendarPage .page-heading h1");
  const description = $("#calendarPage .page-heading h1 + p");
  const directButton = $("#openEventDrawer");

  if (heading) heading.textContent = "나인웍스의 일정을 한눈에 관리합니다.";
  if (description) description.textContent = "클라이언트를 캘린더로 끌어 배치하고 작업 기간과 내용을 바로 정리할 수 있습니다.";

  if (directButton) {
    directButton.textContent = "＋ 직접 일정 추가";
    directButton.classList.remove("button--primary");
    directButton.classList.add("button--ghost");
  }
}

function createClientDragSection() {
  if ($("#clientDragSection")) return;

  const toolbar = $("#calendarPage .calendar-toolbar");
  if (!toolbar) return;

  const section = document.createElement("section");
  section.id = "clientDragSection";
  section.className = "client-drag-section";
  section.setAttribute("aria-label", "클라이언트 빠른 일정 배치");
  section.innerHTML = `
    <div class="client-drag-section__head">
      <div>
        <p class="eyebrow">QUICK SCHEDULE</p>
        <h2>클라이언트를 캘린더에 끌어 놓으세요.</h2>
        <p>날짜에 놓으면 작업 내용을 입력하는 일정 창이 바로 열립니다.</p>
      </div>
      <span class="client-drag-section__hint">등록 후 일정 끝부분을 드래그하면 작업 기간을 늘리거나 줄일 수 있습니다.</span>
    </div>
    <div id="clientDragList" class="client-drag-list" aria-label="드래그할 클라이언트 목록"></div>
  `;

  toolbar.parentNode.insertBefore(section, toolbar);
  bindClientDragList();
  renderClientChips();
  observeClientChanges();
}

function getClientNames() {
  const names = new Set();

  $$("#eventClient option").forEach((option) => {
    const value = option.value.trim();
    if (value && value !== "선택") names.add(value);
  });

  $$("#clientTableBody .client-name").forEach((element) => {
    const value = element.textContent.trim();
    if (value) names.add(value);
  });

  return [...names];
}

function renderClientChips() {
  const list = $("#clientDragList");
  if (!list) return;

  const clients = getClientNames();
  list.innerHTML = clients.length
    ? clients.map((client) => `<button class="client-drag-chip" type="button" draggable="true" data-client-name="${escapeAttribute(client)}" title="캘린더 날짜로 끌어 배치">${escapeHtml(client)}</button>`).join("")
    : '<span class="client-drag-section__hint">클라이언트를 먼저 등록해주세요.</span>';
}

function observeClientChanges() {
  const table = $("#clientTableBody");
  const select = $("#eventClient");
  const observer = new MutationObserver(() => renderClientChips());
  if (table) observer.observe(table, { childList: true, subtree: true });
  if (select) observer.observe(select, { childList: true, subtree: true });
}

function bindClientDragList() {
  const list = $("#clientDragList");
  if (!list) return;

  list.addEventListener("dragstart", (event) => {
    const chip = event.target.closest(".client-drag-chip");
    if (!chip) return;
    draggedClient = chip.dataset.clientName || "";
    chip.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData(CLIENT_MIME, draggedClient);
    event.dataTransfer.setData("text/plain", draggedClient);
  });

  list.addEventListener("dragend", (event) => {
    event.target.closest(".client-drag-chip")?.classList.remove("is-dragging");
    draggedClient = "";
    clearDropTargets();
  });

  list.addEventListener("click", (event) => {
    const chip = event.target.closest(".client-drag-chip");
    if (!chip) return;
    openScheduleDrawer(chip.dataset.clientName || "", dateKey(new Date()));
  });
}

function bindCalendarDrop() {
  const calendar = $("#calendar");
  if (!calendar) return;

  calendar.addEventListener("dragover", (event) => {
    if (!draggedClient && !event.dataTransfer.types.includes(CLIENT_MIME)) return;
    const cell = event.target.closest("[data-date]");
    if (!cell) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    clearDropTargets();
    cell.classList.add("is-client-drop-target");
  });

  calendar.addEventListener("drop", (event) => {
    const cell = event.target.closest("[data-date]");
    if (!cell) return;
    event.preventDefault();
    const client = event.dataTransfer.getData(CLIENT_MIME) || event.dataTransfer.getData("text/plain") || draggedClient;
    const targetDate = cell.getAttribute("data-date");
    clearDropTargets();
    if (client && targetDate) openScheduleDrawer(client, targetDate);
  });

  calendar.addEventListener("dragleave", (event) => {
    const cell = event.target.closest("[data-date]");
    if (!cell || cell.contains(event.relatedTarget)) return;
    cell.classList.remove("is-client-drop-target");
  });

  document.addEventListener("dragend", clearDropTargets);
}

function clearDropTargets() {
  $$("#calendar .is-client-drop-target").forEach((element) => element.classList.remove("is-client-drop-target"));
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

    if (clientSelect) clientSelect.value = client;
    if (start) start.value = targetDate;
    if (end) end.value = targetDate;
    if (status) status.value = "planned";
    if (title && !title.value) title.placeholder = `${client} 작업 내용을 입력하세요`;
    title?.focus();
  }, 80);
}

function enhanceEventDrawer() {
  const memo = $("#eventMemo");
  const link = $("#eventLink");
  const form = $("#eventForm");
  const drawer = $("#eventDrawer");
  if (!memo || !link || !form || !drawer) return;

  const memoField = memo.closest(".field");
  const memoLabel = memoField?.querySelector(":scope > span");
  const linkLabel = link.closest(".field")?.querySelector(":scope > span");

  if (memoLabel) memoLabel.textContent = "작업 내용";
  memo.placeholder = "해야 할 작업, 수정 요청, 전달사항을 간단히 정리하세요.";
  if (linkLabel) linkLabel.textContent = "원본·참고 링크";
  link.type = "text";
  link.placeholder = "Figma, Drive, 카카오톡 전달 자료, 참고 사이트 링크";

  if (!$("#eventReferenceText")) {
    const referenceField = document.createElement("label");
    referenceField.className = "field";
    referenceField.innerHTML = `
      <span>원본 내용 · 참고 텍스트</span>
      <textarea id="eventReferenceText" rows="5" placeholder="클라이언트가 보내온 원문, 카카오톡 요청 내용, 참고 문구 등을 그대로 붙여넣으세요."></textarea>
      <small class="event-reference-help">저장 시 작업 내용과 함께 보관되어 다른 담당자도 원본 요청을 확인할 수 있습니다.</small>
    `;
    memoField.insertAdjacentElement("afterend", referenceField);
  }

  const dateGrid = $("#eventStart")?.closest(".form-grid");
  if (dateGrid && !$(".event-period-guide", form)) {
    const guide = document.createElement("div");
    guide.className = "event-period-guide";
    guide.innerHTML = "<strong>기간 조정</strong><span>날짜를 직접 입력하거나 저장 후 캘린더 일정의 오른쪽 끝을 드래그해 기간을 조정할 수 있습니다.</span>";
    dateGrid.insertAdjacentElement("afterend", guide);
  }

  form.addEventListener("submit", () => {
    const reference = $("#eventReferenceText")?.value.trim() || "";
    const cleanMemo = stripReference(memo.value).trim();
    memo.value = reference ? `${cleanMemo}${cleanMemo ? "\n\n" : ""}${REFERENCE_MARKER}\n${reference}` : cleanMemo;
  }, true);

  const drawerObserver = new MutationObserver(() => {
    if (!drawer.classList.contains("is-open")) return;
    window.setTimeout(() => splitReferenceFields(), 30);
  });
  drawerObserver.observe(drawer, { attributes: true, attributeFilter: ["class"] });
}

function splitReferenceFields() {
  const memo = $("#eventMemo");
  const reference = $("#eventReferenceText");
  if (!memo || !reference) return;

  const markerIndex = memo.value.indexOf(REFERENCE_MARKER);
  if (markerIndex < 0) {
    reference.value = "";
    return;
  }

  reference.value = memo.value.slice(markerIndex + REFERENCE_MARKER.length).trim();
  memo.value = memo.value.slice(0, markerIndex).trim();
}

function stripReference(value) {
  const markerIndex = String(value).indexOf(REFERENCE_MARKER);
  return markerIndex < 0 ? String(value) : String(value).slice(0, markerIndex);
}

function dateKey(date) {
  const value = new Date(date);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function initializeEnhancements() {
  updateCalendarCopy();
  createClientDragSection();
  bindCalendarDrop();
  enhanceEventDrawer();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeEnhancements, { once: true });
} else {
  initializeEnhancements();
}
