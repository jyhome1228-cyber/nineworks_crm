(() => {
  "use strict";

  const ROOT_ID = "quickScheduleComposer";
  const WEEKDAYS = { 일: 0, 월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6 };
  const STATUS_LABELS = { planned: "예정", progress: "진행 중", review: "검수 중", done: "완료" };

  const pad = (value) => String(value).padStart(2, "0");
  const toKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const atNoon = (date = new Date()) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
  const addDays = (date, amount) => {
    const next = atNoon(date);
    next.setDate(next.getDate() + amount);
    return next;
  };

  function currentDate() {
    return atNoon(new Date());
  }

  function optionValues(select) {
    if (!select) return [];
    return Array.from(select.options)
      .map((option) => option.value.trim())
      .filter(Boolean);
  }

  function knownClients() {
    const values = new Set(optionValues(document.querySelector("#eventClient")));
    document.querySelectorAll("#clientTableBody .client-name").forEach((node) => {
      const value = node.textContent?.trim();
      if (value) values.add(value);
    });
    return Array.from(values).sort((a, b) => b.length - a.length);
  }

  function detectClient(text) {
    const normalized = text.toLowerCase();
    return knownClients().find((name) => normalized.includes(name.toLowerCase())) || "";
  }

  function dateFromWeekday(base, weekday, weekOffset = null) {
    const target = WEEKDAYS[weekday];
    if (typeof target !== "number") return null;

    if (weekOffset !== null) {
      const mondayOffset = (base.getDay() + 6) % 7;
      const monday = addDays(base, -mondayOffset + (weekOffset * 7));
      const targetOffset = target === 0 ? 6 : target - 1;
      return addDays(monday, targetOffset);
    }

    let diff = (target - base.getDay() + 7) % 7;
    if (diff === 0) diff = 0;
    return addDays(base, diff);
  }

  function parseDate(text) {
    const base = currentDate();
    const compact = text.replace(/\s+/g, " ").trim();
    let match;

    if (/오늘/.test(compact)) return { date: base, matched: "오늘" };
    if (/모레/.test(compact)) return { date: addDays(base, 2), matched: "모레" };
    if (/내일/.test(compact)) return { date: addDays(base, 1), matched: "내일" };

    match = compact.match(/(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
    if (match) {
      const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
      if (date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[3])) return { date, matched: match[0] };
    }

    match = compact.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
    if (match) {
      const month = Number(match[1]);
      const day = Number(match[2]);
      let year = base.getFullYear();
      let date = new Date(year, month - 1, day, 12);
      if (date < base) date = new Date(year + 1, month - 1, day, 12);
      if (date.getMonth() === month - 1 && date.getDate() === day) return { date, matched: match[0] };
    }

    match = compact.match(/(다다음\s*주|다음\s*주|이번\s*주)\s*([일월화수목금토])(?:요일)?/);
    if (match) {
      const phrase = match[1].replace(/\s/g, "");
      const offset = phrase === "다다음주" ? 2 : phrase === "다음주" ? 1 : 0;
      return { date: dateFromWeekday(base, match[2], offset), matched: match[0] };
    }

    match = compact.match(/(?:^|\s|[-–—,])([0-9]{1,2})\s*일(?:\s*([일월화수목금토])(?:요일)?)?/);
    if (!match) match = compact.match(/([0-9]{1,2})\s*일\s*([일월화수목금토])(?:요일)?/);
    if (match) {
      const day = Number(match[1]);
      let year = base.getFullYear();
      let month = base.getMonth();
      let date = new Date(year, month, day, 12);
      if (date < base) {
        month += 1;
        date = new Date(year, month, day, 12);
      }
      if (date.getDate() === day) return { date, matched: match[0].trim() };
    }

    match = compact.match(/([일월화수목금토])(?:요일)/);
    if (match) return { date: dateFromWeekday(base, match[1]), matched: match[0] };

    return { date: null, matched: "" };
  }

  function parseStatus(text) {
    if (/(완료|끝냄|마감완료)/.test(text)) return "done";
    if (/(검수|확인중|리뷰)/.test(text)) return "review";
    if (/(진행\s*중|작업\s*중|진행중|작업중)/.test(text)) return "progress";
    return "planned";
  }

  function classify(title) {
    if (/(미팅|회의|통화|방문|인터뷰)/i.test(title)) return "미팅";
    if (/(홈페이지|웹사이트|웹\s|개발|코딩|퍼블리싱|모바일\s*수정)/i.test(title)) return "홈페이지";
    if (/(브랜딩|브랜드|BI|CI|로고|네이밍)/i.test(title)) return "브랜딩";
    if (/(수정|피드백|보완|교정)/i.test(title)) return "수정사항";
    if (/(사업계획서|계획서|기획|IR|제안서|견적|계약서|문서|자료|리서치|조사|작성|정리)/i.test(title)) return "기획·문서";
    if (/(디자인|패키지|상세페이지|배너|포스터|인스타|SNS|카드뉴스|시안)/i.test(title)) return "디자인";
    return "기획·문서";
  }

  function cleanTitle(text, client, dateMatched) {
    let title = text;
    if (client) title = title.replace(new RegExp(client.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), " ");
    if (dateMatched) title = title.replace(dateMatched, " ");

    title = title
      .replace(/(오늘|내일|모레)/g, " ")
      .replace(/(다다음\s*주|다음\s*주|이번\s*주)\s*[일월화수목금토](?:요일)?/g, " ")
      .replace(/\d{4}\s*년\s*\d{1,2}\s*월\s*\d{1,2}\s*일/g, " ")
      .replace(/\d{1,2}\s*월\s*\d{1,2}\s*일/g, " ")
      .replace(/\d{1,2}\s*일\s*[일월화수목금토]?(?:요일)?/g, " ")
      .replace(/[일월화수목금토]요일/g, " ")
      .replace(/(진행\s*중|작업\s*중|진행중|작업중|검수\s*중|검수중|완료|예정)\s*$/g, " ")
      .replace(/^[\s\-–—:·|]+|[\s\-–—:·|]+$/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();

    if (!title) {
      const segments = text.split(/\s*[-–—]\s*/).filter(Boolean);
      title = (segments[segments.length - 1] || "").replace(/(예정|완료|진행중|진행 중|검수중|검수 중)\s*$/g, "").trim();
    }

    return title;
  }

  function parse(text) {
    const raw = text.trim();
    const client = detectClient(raw);
    const parsedDate = parseDate(raw);
    const title = cleanTitle(raw, client, parsedDate.matched);
    const status = parseStatus(raw);
    const category = classify(title);

    return {
      raw,
      client,
      date: parsedDate.date ? toKey(parsedDate.date) : "",
      title,
      status,
      category,
      member: document.querySelector("#eventMember")?.value || "박재영"
    };
  }

  function ensureCategoryOption(category) {
    const select = document.querySelector("#eventCategory");
    if (!select || !category) return;
    if (!optionValues(select).includes(category)) select.add(new Option(category, category));
  }

  function ensureClientOption(client) {
    const select = document.querySelector("#eventClient");
    if (!select || !client) return;
    if (!optionValues(select).includes(client)) select.add(new Option(client, client));
  }

  function showToast(message) {
    const toast = document.querySelector("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.setTimeout(() => toast.classList.remove("is-visible"), 2400);
  }

  function previewMarkup(result) {
    const parts = [];
    if (result.client) parts.push(`<span><b>클라이언트</b>${escapeHtml(result.client)}</span>`);
    if (result.date) parts.push(`<span><b>날짜</b>${escapeHtml(result.date)}</span>`);
    if (result.title) parts.push(`<span><b>업무</b>${escapeHtml(result.title)}</span>`);
    if (result.category) parts.push(`<span><b>분류</b>${escapeHtml(result.category)}</span>`);
    parts.push(`<span><b>상태</b>${escapeHtml(STATUS_LABELS[result.status])}</span>`);
    return parts.join("");
  }

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  }

  function validationMessage(result) {
    if (!result.raw) return "예: 건강미 7일 월요일 - 사업계획서 작성 예정";
    if (!result.client) return "등록된 클라이언트 이름을 문장에 포함해주세요.";
    if (!result.date) return "날짜를 인식하지 못했어요. ‘내일’, ‘7일’, ‘9월 10일’, ‘다음주 월요일’처럼 입력해주세요.";
    if (!result.title) return "날짜 뒤에 할 일을 입력해주세요.";
    return "";
  }

  function fillAndSubmit(result) {
    const eventForm = document.querySelector("#eventForm");
    if (!eventForm) return false;

    ensureClientOption(result.client);
    ensureCategoryOption(result.category);

    document.querySelector("#eventId").value = "";
    document.querySelector("#eventTitle").value = result.title;
    document.querySelector("#eventClient").value = result.client;
    document.querySelector("#eventCategory").value = result.category;
    document.querySelector("#eventMember").value = result.member;
    document.querySelector("#eventStart").value = result.date;
    document.querySelector("#eventEnd").value = result.date;
    document.querySelector("#eventStatus").value = result.status;
    document.querySelector("#eventMemo").value = "";
    document.querySelector("#eventLink").value = "";

    eventForm.requestSubmit();
    return true;
  }

  function inject() {
    if (document.getElementById(ROOT_ID)) return;
    const calendarPage = document.querySelector("#calendarPage");
    const toolbar = calendarPage?.querySelector(".calendar-toolbar");
    if (!calendarPage || !toolbar) return;

    const section = document.createElement("section");
    section.id = ROOT_ID;
    section.className = "nw-quick-schedule";
    section.setAttribute("aria-label", "빠른 일정 입력");
    section.innerHTML = `
      <div class="nw-quick-schedule__copy">
        <p class="eyebrow">QUICK SCHEDULE</p>
        <strong>문장으로 일정 추가</strong>
        <small>클라이언트와 날짜, 할 일을 한 줄로 입력하세요.</small>
      </div>
      <form class="nw-quick-schedule__form">
        <label class="nw-quick-schedule__input-wrap">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" /></svg>
          <input id="quickScheduleInput" type="text" autocomplete="off" placeholder="예: 건강미 7일 월요일 - 사업계획서 작성 예정" aria-describedby="quickScheduleFeedback" />
        </label>
        <button class="button button--primary" type="submit">일정 추가</button>
      </form>
      <div id="quickSchedulePreview" class="nw-quick-schedule__preview" hidden></div>
      <p id="quickScheduleFeedback" class="nw-quick-schedule__feedback">예: 건강미 7일 월요일 - 사업계획서 작성 예정</p>
    `;

    toolbar.insertAdjacentElement("beforebegin", section);

    const form = section.querySelector(".nw-quick-schedule__form");
    const input = section.querySelector("#quickScheduleInput");
    const preview = section.querySelector("#quickSchedulePreview");
    const feedback = section.querySelector("#quickScheduleFeedback");
    const submitButton = form.querySelector("button[type='submit']");

    function refresh() {
      const result = parse(input.value);
      const error = validationMessage(result);
      feedback.textContent = error || "이대로 캘린더와 일정 목록에 등록됩니다.";
      feedback.classList.toggle("is-error", Boolean(input.value.trim() && error));
      submitButton.disabled = Boolean(error);
      if (!input.value.trim()) submitButton.disabled = true;

      if (input.value.trim()) {
        preview.hidden = false;
        preview.innerHTML = previewMarkup(result);
      } else {
        preview.hidden = true;
        preview.innerHTML = "";
      }
    }

    input.addEventListener("input", refresh);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const result = parse(input.value);
      const error = validationMessage(result);
      if (error) {
        feedback.textContent = error;
        feedback.classList.add("is-error");
        input.focus();
        return;
      }

      submitButton.disabled = true;
      const submitted = fillAndSubmit(result);
      if (!submitted) {
        feedback.textContent = "일정 등록 폼을 찾지 못했습니다. 새로고침 후 다시 시도해주세요.";
        feedback.classList.add("is-error");
        submitButton.disabled = false;
        return;
      }

      showToast(`${result.client} · ${result.date} · ${result.title} 일정 등록 중`);
      input.value = "";
      preview.hidden = true;
      preview.innerHTML = "";
      feedback.classList.remove("is-error");
      feedback.textContent = "일정을 등록했습니다. 같은 방식으로 계속 입력할 수 있습니다.";
      window.setTimeout(() => { submitButton.disabled = false; refresh(); }, 900);
    });

    refresh();
  }

  function init() {
    inject();
    const observer = new MutationObserver(() => {
      if (!document.getElementById(ROOT_ID)) inject();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
