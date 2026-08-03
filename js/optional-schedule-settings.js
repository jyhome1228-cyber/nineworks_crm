const optionalStyle = document.createElement("link");
optionalStyle.rel = "stylesheet";
optionalStyle.href = new URL("../css/optional-schedule-settings.css?v=20260803-1", import.meta.url).href;
document.head.appendChild(optionalStyle);

function dispatchChange(element) {
  element?.dispatchEvent(new Event("change", { bubbles: true }));
}

function setNativeTimeValidationEnabled(enabled) {
  ["#eventStartTime", "#eventEndTime"].forEach((selector) => {
    const input = document.querySelector(selector);
    if (!input) return;
    input.required = false;
    input.step = "60";
    input.disabled = !enabled;
    if (!enabled) input.setCustomValidity("");
  });

  ["#eventStartTimePreset", "#eventEndTimePreset"].forEach((selector) => {
    const select = document.querySelector(selector);
    if (select) select.disabled = !enabled;
  });
}

function syncTimeOptionalState(enabled, { initializeValues = false } = {}) {
  const section = document.querySelector("#eventTimeSection");
  const allDay = document.querySelector("#eventAllDay");
  const start = document.querySelector("#eventStartTime");
  const end = document.querySelector("#eventEndTime");
  const toggle = document.querySelector("#eventTimeEnabled");
  if (!section || !allDay) return;

  if (toggle && toggle.checked !== enabled) toggle.checked = enabled;
  section.classList.toggle("is-optional-disabled", !enabled);
  allDay.checked = !enabled;

  if (enabled && initializeValues) {
    if (start && !start.value) start.value = "09:00";
    if (end && !end.value) end.value = "10:00";
  }

  setNativeTimeValidationEnabled(enabled);
  dispatchChange(allDay);
  if (enabled) {
    dispatchChange(start);
    dispatchChange(end);
  }

  const feedback = document.querySelector("#eventTimeFeedback");
  if (feedback) {
    feedback.textContent = enabled
      ? "시간을 선택하면 시간 일정으로 저장됩니다."
      : "시간 설정을 사용하지 않으면 종일 일정으로 저장됩니다.";
    feedback.classList.remove("is-error", "is-success");
  }
}

function ensureTimeOptionalToggle() {
  const section = document.querySelector("#eventTimeSection");
  const head = section?.querySelector(".nw-time-section__head");
  const allDay = document.querySelector("#eventAllDay");
  if (!section || !head || !allDay) return false;

  if (!document.querySelector("#eventTimeEnabled")) {
    const label = document.createElement("label");
    label.className = "nw-optional-setting-toggle";
    label.innerHTML = '<input id="eventTimeEnabled" type="checkbox" /><span>시간 설정 사용</span>';
    head.appendChild(label);

    const help = document.createElement("p");
    help.className = "nw-time-section__optional-help";
    help.textContent = "필요한 일정만 켜주세요. 기본값은 시간 미설정(종일 일정)입니다.";
    head.insertAdjacentElement("afterend", help);

    label.querySelector("input")?.addEventListener("change", (event) => {
      syncTimeOptionalState(event.currentTarget.checked, { initializeValues: true });
    });
  }

  const hasTime = allDay.checked === false && Boolean(
    document.querySelector("#eventStartTime")?.value || document.querySelector("#eventEndTime")?.value
  );
  syncTimeOptionalState(hasTime, { initializeValues: false });
  return true;
}

function syncReminderOptionalState(enabled) {
  const section = document.querySelector("#eventReminderSection");
  const master = document.querySelector("#eventReminderEnabled");
  if (!section || !master) return;

  master.checked = enabled;
  section.classList.toggle("is-optional-disabled", !enabled);
  document.querySelectorAll('input[name="eventReminderOffset"]').forEach((input) => {
    input.disabled = !enabled;
    input.required = false;
    if (!enabled) input.checked = false;
  });
}

function ensureReminderOptionalDefaults() {
  const section = document.querySelector("#eventReminderSection");
  const master = document.querySelector("#eventReminderEnabled");
  if (!section || !master) return false;

  const masterText = master.closest("label")?.querySelector("span");
  if (masterText) masterText.textContent = "내 일정 알림 사용";

  if (!section.querySelector(".nw-event-reminder-optional-help")) {
    const help = document.createElement("p");
    help.className = "nw-event-reminder-optional-help";
    help.textContent = "알림이 필요한 일정만 켜주세요. 기본값은 알림 없음입니다.";
    section.querySelector(".nw-event-reminder-section__head")?.insertAdjacentElement("afterend", help);
  }

  if (master.dataset.optionalBound !== "true") {
    master.dataset.optionalBound = "true";
    master.addEventListener("change", () => {
      const enabled = master.checked;
      section.classList.toggle("is-optional-disabled", !enabled);
      document.querySelectorAll('input[name="eventReminderOffset"]').forEach((input) => {
        input.disabled = !enabled;
        input.required = false;
      });
    });
  }

  return true;
}

function normalizeOptionalSettingsBeforeSubmit(event) {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || form.id !== "eventForm") return;

  const timeEnabled = document.querySelector("#eventTimeEnabled")?.checked === true;
  const allDay = document.querySelector("#eventAllDay");
  const start = document.querySelector("#eventStartTime");
  const end = document.querySelector("#eventEndTime");

  if (!timeEnabled) {
    if (allDay) allDay.checked = true;
    if (start) {
      start.disabled = true;
      start.required = false;
      start.setCustomValidity("");
    }
    if (end) {
      end.disabled = true;
      end.required = false;
      end.setCustomValidity("");
    }
  } else {
    if (allDay) allDay.checked = false;
    if (start) {
      start.disabled = false;
      start.required = false;
      start.step = "60";
    }
    if (end) {
      end.disabled = false;
      end.required = false;
      end.step = "60";
    }
  }

  const reminderEnabled = document.querySelector("#eventReminderEnabled")?.checked === true;
  if (!reminderEnabled) {
    document.querySelectorAll('input[name="eventReminderOffset"]').forEach((input) => {
      input.checked = false;
      input.disabled = true;
      input.required = false;
    });
  }
}

function applyNewEventDefaults() {
  const eventId = document.querySelector("#eventId")?.value || "";
  if (eventId) return;
  syncTimeOptionalState(false);
  syncReminderOptionalState(false);
}

function syncExistingEventSettings() {
  const eventId = document.querySelector("#eventId")?.value || "";
  const allDay = document.querySelector("#eventAllDay");
  const hasTime = eventId && allDay?.checked === false && Boolean(
    document.querySelector("#eventStartTime")?.value || document.querySelector("#eventEndTime")?.value
  );
  syncTimeOptionalState(Boolean(hasTime));

  const reminderMaster = document.querySelector("#eventReminderEnabled");
  const hasReminder = eventId && reminderMaster?.checked === true && [...document.querySelectorAll('input[name="eventReminderOffset"]')]
    .some((input) => input.checked);
  syncReminderOptionalState(Boolean(hasReminder));
}

function initializeOptionalScheduleSettings() {
  const ready = ensureTimeOptionalToggle() && ensureReminderOptionalDefaults();
  if (!ready) {
    window.setTimeout(initializeOptionalScheduleSettings, 180);
    return;
  }

  document.addEventListener("submit", normalizeOptionalSettingsBeforeSubmit, true);

  const drawer = document.querySelector("#eventDrawer");
  if (drawer && drawer.dataset.optionalSettingsObserver !== "true") {
    drawer.dataset.optionalSettingsObserver = "true";
    new MutationObserver(() => {
      if (!drawer.classList.contains("is-open")) return;
      window.setTimeout(() => {
        if (document.querySelector("#eventId")?.value) syncExistingEventSettings();
        else applyNewEventDefaults();
      }, 320);
    }).observe(drawer, { attributes: true, attributeFilter: ["class"] });
  }

  document.addEventListener("click", (event) => {
    if (event.target.closest("#openEventDrawer, [data-request-schedule]")) {
      window.setTimeout(applyNewEventDefaults, 380);
    }
  }, true);

  applyNewEventDefaults();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeOptionalScheduleSettings, { once: true });
} else {
  initializeOptionalScheduleSettings();
}
