(() => {
  "use strict";

  const STYLE_ID = "nineworks-simple-event-form-style";
  const REFERENCE_MARKER = "[원본·참고 내용]";

  const $ = (selector, scope = document) => scope.querySelector(selector);

  function loadStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const link = document.createElement("link");
    link.id = STYLE_ID;
    link.rel = "stylesheet";
    link.href = new URL("../css/simple-event-form.css?v=20260831-2", import.meta.url).href;
    document.head.appendChild(link);
  }

  function todayKey() {
    const date = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function cleanContent(value = "") {
    return String(value)
      .split(REFERENCE_MARKER)[0]
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean) || "";
  }

  function simpleEventContent(info) {
    const data = info.event.extendedProps || {};
    const wrapper = document.createElement("div");
    wrapper.className = "nw-event-content nw-event-content--simple";

    const title = document.createElement("strong");
    title.className = "nw-event-title";
    const rawTitle = data.title || info.event.title || "일정";
    title.textContent = `${data.client || ""}${data.client ? " · " : ""}${rawTitle}`;
    wrapper.appendChild(title);

    const content = cleanContent(data.memo || data.content || "");
    if (content) {
      const note = document.createElement("small");
      note.className = "nw-event-note";
      note.textContent = content;
      wrapper.appendChild(note);
    }

    return { domNodes: [wrapper] };
  }

  function patchCalendarToDateOnlyWeek() {
    const FullCalendar = window.FullCalendar;
    const CurrentCalendar = FullCalendar?.Calendar;
    if (!CurrentCalendar || FullCalendar.__nineworksDateOnlyCalendar) return;

    class DateOnlyCalendar extends CurrentCalendar {
      constructor(element, options = {}) {
        const toolbar = options.headerToolbar ? { ...options.headerToolbar } : undefined;
        if (toolbar?.right) toolbar.right = String(toolbar.right).replace(/timeGridWeek/g, "dayGridWeek");
        if (toolbar?.left) toolbar.left = String(toolbar.left).replace(/timeGridWeek/g, "dayGridWeek");

        super(element, {
          ...options,
          headerToolbar: toolbar,
          buttonText: { ...(options.buttonText || {}), week: "주간" }
        });

        this.setOption("eventContent", simpleEventContent);
      }
    }

    FullCalendar.Calendar = DateOnlyCalendar;
    FullCalendar.__nineworksDateOnlyCalendar = true;
  }

  function ensureReferenceField() {
    const memo = $("#eventMemo");
    if (!memo) return null;
    let reference = $("#eventReferenceText");
    if (reference) return reference;

    const field = document.createElement("label");
    field.className = "field";
    field.innerHTML = `
      <span>첨부내용</span>
      <textarea id="eventReferenceText" rows="4" placeholder="참고 문구, 전달받은 원문, 작업 참고사항 등을 입력하세요."></textarea>
      <small class="event-reference-help">첨부내용은 일정 상세에서만 보관되며 캘린더 카드에는 표시되지 않습니다.</small>
    `;
    memo.closest(".field")?.insertAdjacentElement("afterend", field);
    reference = $("#eventReferenceText");
    return reference;
  }

  function setFieldLabel(inputSelector, label, placeholder = "") {
    const input = $(inputSelector);
    const field = input?.closest(".field");
    if (!input || !field) return;
    const labelNode = field.querySelector(":scope > span");
    if (labelNode) labelNode.textContent = label;
    if (placeholder) input.placeholder = placeholder;
  }

  function hideField(inputSelector) {
    const input = $(inputSelector);
    input?.closest(".field")?.classList.add("simple-hidden-field");
  }

  function ensureCategoryDefault(isNew) {
    const category = $("#eventCategory");
    if (!category) return;
    category.required = false;
    if (![...category.options].some((option) => option.value === "업무")) {
      category.add(new Option("업무", "업무"));
    }
    if (isNew || !category.value) category.value = "업무";
  }

  function normalizeHiddenValues({ newEventOnly = false } = {}) {
    const eventId = $("#eventId")?.value || "";
    const isNew = !eventId;
    if (newEventOnly && !isNew) return;

    ensureCategoryDefault(isNew);

    const member = $("#eventMember");
    if (member) {
      member.required = true;
      if (!member.value && member.options.length) member.value = member.options[0].value;
    }

    const start = $("#eventStart");
    const end = $("#eventEnd");
    if (start) {
      start.required = false;
      if (!start.value) start.value = todayKey();
    }
    if (end) {
      end.required = false;
      if (!end.value) end.value = start?.value || todayKey();
    }

    const status = $("#eventStatus");
    if (status && isNew) status.value = "planned";

    const allDay = $("#eventAllDay");
    const timeEnabled = $("#eventTimeEnabled");
    const startTime = $("#eventStartTime");
    const endTime = $("#eventEndTime");
    if (allDay) allDay.checked = true;
    if (timeEnabled) timeEnabled.checked = false;
    if (startTime) {
      startTime.value = "";
      startTime.required = false;
    }
    if (endTime) {
      endTime.value = "";
      endTime.required = false;
    }

    const reminder = $("#eventReminderEnabled");
    if (reminder) reminder.checked = false;
    document.querySelectorAll('input[name="eventReminderOffset"]').forEach((input) => {
      input.checked = false;
      input.required = false;
    });
  }

  function simplifyForm() {
    const form = $("#eventForm");
    if (!form) return false;
    form.classList.add("simple-event-form");

    setFieldLabel("#eventTitle", "업무 제목", "업무 제목을 입력하세요");
    setFieldLabel("#eventClient", "클라이언트");
    setFieldLabel("#eventMember", "담당자");
    setFieldLabel("#eventMemo", "내용", "해야 할 업무 내용이나 전달사항을 입력하세요.");

    const reference = ensureReferenceField();
    if (reference) {
      const field = reference.closest(".field");
      const labelNode = field?.querySelector(":scope > span");
      const help = field?.querySelector(".event-reference-help");
      if (labelNode) labelNode.textContent = "첨부내용";
      reference.placeholder = "참고 문구, 전달받은 원문, 작업 참고사항 등을 입력하세요.";
      if (help) help.textContent = "첨부내용은 상세에서만 보관되며 캘린더 카드에는 표시되지 않습니다.";
    }

    const client = $("#eventClient")?.closest(".field");
    const category = $("#eventCategory")?.closest(".field");
    const member = $("#eventMember")?.closest(".field");
    const clientGrid = client?.parentElement;
    if (clientGrid?.classList.contains("form-grid")) {
      clientGrid.classList.add("simple-client-grid");
      if (member && member.parentElement !== clientGrid) clientGrid.appendChild(member);
    }
    category?.classList.add("simple-hidden-field");
    member?.classList.remove("simple-hidden-field");

    hideField("#eventStatus");
    hideField("#eventLink");

    const dateGrid = $("#eventStart")?.closest(".form-grid");
    dateGrid?.classList.add("simple-hidden-field");

    $("#eventTimeSection")?.classList.add("simple-hidden-field");
    $("#eventReminderSection")?.classList.add("simple-hidden-field");
    form.querySelectorAll(".event-period-guide, .nw-time-section, .nw-event-reminder-section").forEach((node) => node.classList.add("simple-hidden-field"));

    const drawerCopy = $("#eventDrawer .drawer__header .eyebrow");
    if (drawerCopy) drawerCopy.textContent = "SCHEDULE";

    normalizeHiddenValues({ newEventOnly: true });
    return true;
  }

  function bindSubmit() {
    const form = $("#eventForm");
    if (!form || form.dataset.simpleEventBound === "true") return;
    form.dataset.simpleEventBound = "true";
    form.addEventListener("submit", () => normalizeHiddenValues(), true);
  }

  function bindDrawer() {
    const drawer = $("#eventDrawer");
    if (!drawer || drawer.dataset.simpleEventObserver === "true") return;
    drawer.dataset.simpleEventObserver = "true";

    new MutationObserver(() => {
      if (!drawer.classList.contains("is-open")) return;
      window.setTimeout(() => {
        simplifyForm();
        normalizeHiddenValues({ newEventOnly: true });
      }, 80);
    }).observe(drawer, { attributes: true, attributeFilter: ["class"] });
  }

  function observeInjectedControls() {
    if (document.documentElement.dataset.simpleEventGlobalObserver === "true") return;
    document.documentElement.dataset.simpleEventGlobalObserver = "true";
    let queued = false;
    new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        simplifyForm();
        bindSubmit();
        bindDrawer();
      });
    }).observe(document.body, { childList: true, subtree: true });
  }

  function init() {
    loadStyle();
    patchCalendarToDateOnlyWeek();
    simplifyForm();
    bindSubmit();
    bindDrawer();
    observeInjectedControls();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
