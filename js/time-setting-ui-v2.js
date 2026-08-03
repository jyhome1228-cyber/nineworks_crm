const timeUiStyle = document.createElement("link");
timeUiStyle.rel = "stylesheet";
timeUiStyle.href = new URL("../css/time-setting-ui-v2.css?v=20260803-1", import.meta.url).href;
document.head.appendChild(timeUiStyle);

const STEP_MINUTES = 30;
let syncingTimeUi = false;

function pad(value) {
  return String(value).padStart(2, "0");
}

function timeToMinutes(value = "") {
  const match = String(value).match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

function minutesToTime(minutes) {
  const safe = Math.max(0, Math.min(1439, Number(minutes) || 0));
  return `${pad(Math.floor(safe / 60))}:${pad(safe % 60)}`;
}

function formatKoreanTime(value) {
  const total = timeToMinutes(value);
  if (total === null) return value;
  const hour = Math.floor(total / 60);
  const minute = total % 60;
  const period = hour < 12 ? "오전" : "오후";
  return `${period} ${hour % 12 || 12}:${pad(minute)}`;
}

function isThirtyMinuteValue(value) {
  const minutes = timeToMinutes(value);
  return minutes !== null && minutes % STEP_MINUTES === 0;
}

function roundedThirtyMinuteValue(value, fallback) {
  const minutes = timeToMinutes(value);
  if (minutes === null) return fallback;
  return minutesToTime(Math.round(minutes / STEP_MINUTES) * STEP_MINUTES);
}

function makeOptions({ start = 0, end = 1430 } = {}) {
  const options = [];
  for (let minutes = start; minutes <= end; minutes += STEP_MINUTES) {
    const value = minutesToTime(minutes);
    options.push(`<option value="${value}">${formatKoreanTime(value)}</option>`);
  }
  return options.join("");
}

function dispatchTimeChange(input) {
  input?.dispatchEvent(new Event("change", { bubbles: true }));
}

function currentElements(section) {
  return {
    allDay: document.querySelector("#eventAllDay"),
    startInput: document.querySelector("#eventStartTime"),
    endInput: document.querySelector("#eventEndTime"),
    startSelect: section.querySelector("#eventStartTimePreset"),
    endSelect: section.querySelector("#eventEndTimePreset"),
    presetPanel: section.querySelector("#eventTimePresetPanel"),
    customPanel: section.querySelector("#eventTimeCustomPanel"),
    presetButton: section.querySelector('[data-time-mode="preset"]'),
    customButton: section.querySelector('[data-time-mode="custom"]')
  };
}

function updateDisabledState(section) {
  const elements = currentElements(section);
  const disabled = elements.allDay?.checked ?? true;
  if (elements.startSelect) elements.startSelect.disabled = disabled;
  if (elements.endSelect) elements.endSelect.disabled = disabled;
  section.classList.toggle("is-all-day", disabled);
}

function setMode(section, mode, { roundValues = false } = {}) {
  const elements = currentElements(section);
  const custom = mode === "custom";

  section.dataset.timeMode = custom ? "custom" : "preset";
  if (elements.presetPanel) elements.presetPanel.hidden = custom;
  if (elements.customPanel) elements.customPanel.hidden = !custom;
  elements.presetButton?.classList.toggle("is-active", !custom);
  elements.customButton?.classList.toggle("is-active", custom);
  elements.presetButton?.setAttribute("aria-pressed", String(!custom));
  elements.customButton?.setAttribute("aria-pressed", String(custom));

  if (!custom && roundValues) {
    const start = roundedThirtyMinuteValue(elements.startInput?.value, "09:00");
    let end = roundedThirtyMinuteValue(elements.endInput?.value, "10:00");
    const startMinutes = timeToMinutes(start) ?? 540;
    let endMinutes = timeToMinutes(end) ?? 600;
    if (endMinutes <= startMinutes) endMinutes = Math.min(1430, startMinutes + STEP_MINUTES);
    end = minutesToTime(endMinutes);

    if (elements.startSelect) elements.startSelect.value = start;
    if (elements.endSelect) elements.endSelect.value = end;
    applyPresetValues(section);
  }
}

function applyPresetValues(section) {
  const elements = currentElements(section);
  if (!elements.startSelect || !elements.endSelect || !elements.startInput || !elements.endInput) return;

  let startMinutes = timeToMinutes(elements.startSelect.value) ?? 540;
  let endMinutes = timeToMinutes(elements.endSelect.value) ?? 600;
  if (endMinutes <= startMinutes) {
    endMinutes = Math.min(1430, startMinutes + STEP_MINUTES);
    elements.endSelect.value = minutesToTime(endMinutes);
  }

  syncingTimeUi = true;
  if (elements.allDay) {
    elements.allDay.checked = false;
    elements.allDay.dispatchEvent(new Event("change", { bubbles: true }));
  }
  elements.startInput.disabled = false;
  elements.endInput.disabled = false;
  elements.startInput.value = minutesToTime(startMinutes);
  elements.endInput.value = minutesToTime(endMinutes);
  dispatchTimeChange(elements.startInput);
  dispatchTimeChange(elements.endInput);
  syncingTimeUi = false;
  updateDisabledState(section);
}

function syncPresetFromNative(section, { chooseMode = false } = {}) {
  const elements = currentElements(section);
  if (!elements.startSelect || !elements.endSelect) return;

  const start = elements.startInput?.value || "09:00";
  const end = elements.endInput?.value || "10:00";
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  const fitsPreset = isThirtyMinuteValue(start)
    && isThirtyMinuteValue(end)
    && startMinutes !== null
    && endMinutes !== null
    && startMinutes <= 1380
    && endMinutes > startMinutes;

  if (fitsPreset) {
    elements.startSelect.value = start;
    elements.endSelect.value = end;
  }

  if (chooseMode) setMode(section, fitsPreset ? "preset" : "custom");
  updateDisabledState(section);
}

function enhanceTimeSection(section) {
  if (!section || section.dataset.timeUiV2 === "true") return;
  const nativeGrid = section.querySelector(".nw-time-grid");
  const quickArea = section.querySelector(".nw-time-quick");
  if (!nativeGrid || !quickArea) return;

  section.dataset.timeUiV2 = "true";
  section.classList.add("is-time-ui-v2");

  nativeGrid.querySelectorAll('input[type="time"]').forEach((input) => {
    input.step = "60";
  });
  const nativeLabels = nativeGrid.querySelectorAll("label > span");
  if (nativeLabels[0]) nativeLabels[0].textContent = "시작 시간 · 분 단위";
  if (nativeLabels[1]) nativeLabels[1].textContent = "종료 시간 · 분 단위";

  const modeSwitch = document.createElement("div");
  modeSwitch.className = "nw-time-mode-switch";
  modeSwitch.setAttribute("role", "group");
  modeSwitch.setAttribute("aria-label", "시간 입력 방식");
  modeSwitch.innerHTML = `
    <button class="nw-time-mode-button is-active" type="button" data-time-mode="preset" aria-pressed="true">30분 단위 선택</button>
    <button class="nw-time-mode-button" type="button" data-time-mode="custom" aria-pressed="false">분 단위 직접 입력</button>
  `;

  const presetPanel = document.createElement("div");
  presetPanel.id = "eventTimePresetPanel";
  presetPanel.className = "nw-time-preset-panel";
  presetPanel.innerHTML = `
    <div class="nw-time-preset-grid">
      <label class="nw-time-preset-field">
        <span>시작 시간</span>
        <select id="eventStartTimePreset" class="nw-time-preset-select">${makeOptions({ start: 0, end: 1380 })}</select>
      </label>
      <label class="nw-time-preset-field">
        <span>종료 시간</span>
        <select id="eventEndTimePreset" class="nw-time-preset-select">${makeOptions({ start: 30, end: 1410 })}</select>
      </label>
    </div>
    <p class="nw-time-preset-help">기본 시간은 30분 간격으로 선택합니다. 더 정확한 시간이 필요하면 ‘분 단위 직접 입력’을 선택하세요.</p>
  `;

  const customPanel = document.createElement("div");
  customPanel.id = "eventTimeCustomPanel";
  customPanel.className = "nw-time-custom-panel";
  customPanel.hidden = true;
  const customHead = document.createElement("div");
  customHead.className = "nw-time-custom-head";
  customHead.innerHTML = "<strong>정확한 시간 직접 입력</strong>";
  const customHelp = document.createElement("p");
  customHelp.className = "nw-time-custom-help";
  customHelp.textContent = "예: 오전 10:14처럼 필요한 분까지 직접 입력할 수 있습니다.";

  section.insertBefore(modeSwitch, quickArea);
  section.insertBefore(presetPanel, quickArea);
  section.insertBefore(customPanel, quickArea);
  customPanel.append(customHead, nativeGrid, customHelp);

  modeSwitch.querySelector('[data-time-mode="preset"]')?.addEventListener("click", () => {
    setMode(section, "preset", { roundValues: true });
  });
  modeSwitch.querySelector('[data-time-mode="custom"]')?.addEventListener("click", () => {
    setMode(section, "custom");
    const elements = currentElements(section);
    if (elements.allDay?.checked) {
      elements.allDay.checked = false;
      elements.allDay.dispatchEvent(new Event("change", { bubbles: true }));
    }
    elements.startInput?.focus();
  });

  presetPanel.querySelector("#eventStartTimePreset")?.addEventListener("change", () => applyPresetValues(section));
  presetPanel.querySelector("#eventEndTimePreset")?.addEventListener("change", () => applyPresetValues(section));

  document.querySelector("#eventAllDay")?.addEventListener("change", () => updateDisabledState(section));
  [document.querySelector("#eventStartTime"), document.querySelector("#eventEndTime")].forEach((input) => {
    input?.addEventListener("change", () => {
      if (syncingTimeUi) return;
      if (section.dataset.timeMode === "preset") syncPresetFromNative(section);
    });
  });

  const drawer = document.querySelector("#eventDrawer");
  if (drawer && drawer.dataset.timeUiV2Observer !== "true") {
    drawer.dataset.timeUiV2Observer = "true";
    new MutationObserver(() => {
      if (!drawer.classList.contains("is-open")) return;
      window.setTimeout(() => syncPresetFromNative(section, { chooseMode: true }), 140);
    }).observe(drawer, { attributes: true, attributeFilter: ["class"] });
  }

  syncPresetFromNative(section, { chooseMode: true });
}

function initializeTimeUiV2() {
  const section = document.querySelector("#eventTimeSection");
  if (!section) {
    window.setTimeout(initializeTimeUiV2, 160);
    return;
  }
  enhanceTimeSection(section);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeTimeUiV2, { once: true });
} else {
  initializeTimeUiV2();
}
