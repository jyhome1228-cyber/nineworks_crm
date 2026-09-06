(() => {
  "use strict";

  const ROOT_ID = "quickScheduleComposer";
  const WEEKDAYS = { 일: 0, 월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6 };
  const STATUS_LABELS = { planned: "예정", progress: "진행 중", review: "검수 중", done: "완료" };
  const CLIENT_ALIASES = {
    "건강미": ["건강", "건미", "건강미스파", "건강미 spa"],
    "JNCOS TECH": ["jnc", "jncos", "jncos tech", "jncos-tech", "제이엔코스", "제이앤코스"],
    "리림": ["relim", "re lim", "리림"],
    "오드벨": ["odebell", "ode bell", "오드벨"],
    "나인웍스": ["nineworks", "9works", "나인", "나인웍스"]
  };

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

  function normalize(value = "") {
    return String(value)
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[^0-9a-z가-힣]/g, "");
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

  function aliasesFor(name) {
    const aliases = new Set([name, ...(CLIENT_ALIASES[name] || [])]);
    const words = name.split(/\s+/).filter(Boolean);
    if (words[0]?.length >= 2) aliases.add(words[0]);
    if (words.length > 1) aliases.add(words.join(""));
    return Array.from(aliases).filter(Boolean);
  }

  function editDistance(a, b) {
    const left = normalize(a);
    const right = normalize(b);
    if (!left) return right.length;
    if (!right) return left.length;
    const rows = Array.from({ length: left.length + 1 }, () => Array(right.length + 1).fill(0));
    for (let i = 0; i <= left.length; i += 1) rows[i][0] = i;
    for (let j = 0; j <= right.length; j += 1) rows[0][j] = j;
    for (let i = 1; i <= left.length; i += 1) {
      for (let j = 1; j <= right.length; j += 1) {
        rows[i][j] = Math.min(
          rows[i - 1][j] + 1,
          rows[i][j - 1] + 1,
          rows[i - 1][j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1)
        );
      }
    }
    return rows[left.length][right.length];
  }

  function similarity(a, b) {
    const left = normalize(a);
    const right = normalize(b);
    const size = Math.max(left.length, right.length);
    if (!size) return 0;
    return 1 - (editDistance(left, right) / size);
  }

  function candidateQueries(text, dateMatched = "") {
    let working = String(text || "").trim();
    if (dateMatched) {
      const index = working.toLowerCase().indexOf(dateMatched.toLowerCase());
      if (index > 0) working = working.slice(0, index).trim();
    }

    working = working
      .replace(/^[\s\-–—:·|]+|[\s\-–—:·|]+$/g, " ")
      .replace(/(오늘|내일|모레|이번\s*주|다음\s*주|다다음\s*주)/g, " ")
      .trim();

    const tokens = String(text || "")
      .split(/[\s\-–—:·|,/]+/)
      .map((token) => token.trim())
      .filter((token) => normalize(token).length >= 2 && !/^\d/.test(token));

    const queries = new Set();
    if (normalize(working).length >= 2 && working.split(/\s+/).length <= 3) queries.add(working);
    tokens.slice(0, 5).forEach((token) => queries.add(token));

    const firstTwo = tokens.slice(0, 2).join(" ");
    if (normalize(firstTwo).length >= 3) queries.add(firstTwo);
    return Array.from(queries);
  }

  function scoreAlias(query, alias) {
    const q = normalize(query);
    const a = normalize(alias);
    if (!q || !a) return 0;
    if (q === a) return 1;
    if (a.startsWith(q) && q.length >= 2) return q.length >= 4 ? 0.95 : 0.91;
    if (q.startsWith(a) && a.length >= 2) return 0.89;
    if (a.includes(q) && q.length >= 2) return 0.86;
    if (q.includes(a) && a.length >= 2) return 0.84;
    if (q.length >= 3 && a.length >= 3) {
      const sim = similarity(q, a);
      if (sim >= 0.8) return 0.82;
      if (sim >= 0.68) return 0.72;
    }
    return 0;
  }

  function clientCandidates(text, dateMatched = "") {
    const queries = candidateQueries(text, dateMatched);
    const rawNorm = normalize(text);
    return knownClients()
      .map((name) => {
        let score = 0;
        let query = "";
        let alias = name;

        aliasesFor(name).forEach((candidateAlias) => {
          const aliasNorm = normalize(candidateAlias);
          if (aliasNorm && rawNorm.includes(aliasNorm) && aliasNorm.length >= 2) {
            const exactScore = candidateAlias === name ? 1 : 0.98;
            if (exactScore > score) {
              score = exactScore;
              query = candidateAlias;
              alias = candidateAlias;
            }
          }

          queries.forEach((candidateQuery) => {
            const nextScore = scoreAlias(candidateQuery, candidateAlias);
            if (nextScore > score) {
              score = nextScore;
              query = candidateQuery;
              alias = candidateAlias;
            }
          });
        });

        return { name, score, query, alias };
      })
      .filter((item) => item.score >= 0.58)
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "ko"));
  }

  function detectClient(text, dateMatched = "") {
    const candidates = clientCandidates(text, dateMatched);
    const best = candidates[0] || null;
    if (!best || best.score < 0.68) return { name: "", query: "", score: 0, inferred: false, candidates };
    return {
      name: best.name,
      query: best.query,
      score: best.score,
      inferred: best.score < 0.98 || normalize(best.query) !== normalize(best.name),
      candidates
    };
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
    if (/(완료|끝냄|마감완료)/i.test(text)) return "done";
    if (/(검수|확인중|리뷰)/i.test(text)) return "review";
    if (/(진행\s*중|작업\s*중|진행중|작업중)/i.test(text)) return "progress";
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

  function escapeRegExp(value = "") {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function cleanTitle(text, clientQuery, dateMatched) {
    let title = text;
    if (clientQuery) title = title.replace(new RegExp(escapeRegExp(clientQuery), "i"), " ");
    if (dateMatched) title = title.replace(dateMatched, " ");

    title = title
      .replace(/(오늘|내일|모레)/g, " ")
      .replace(/(다다음\s*주|다음\s*주|이번\s*주)\s*[일월화수목금토](?:요일)?/g, " ")
      .replace(/\d{4}\s*년\s*\d{1,2}\s*월\s*\d{1,2}\s*일/g, " ")
      .replace(/\d{1,2}\s*월\s*\d{1,2}\s*일/g, " ")
      .replace(/\d{1,2}\s*일\s*[일월화수목금토]?(?:요일)?/g, " ")
      .replace(/[일월화수목금토]요일/g, " ")
      .replace(/(진행\s*중|작업\s*중|진행중|작업중|검수\s*중|검수중|완료|예정)\s*$/gi, " ")
      .replace(/^[\s\-–—:·|]+|[\s\-–—:·|]+$/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();

    if (!title) {
      const segments = text.split(/\s*[-–—]\s*/).filter(Boolean);
      title = (segments[segments.length - 1] || "").replace(/(예정|완료|진행중|진행 중|검수중|검수 중)\s*$/gi, "").trim();
    }

    return title;
  }

  function parse(text) {
    const raw = text.trim();
    const parsedDate = parseDate(raw);
    const clientMatch = detectClient(raw, parsedDate.matched);
    const title = cleanTitle(raw, clientMatch.query, parsedDate.matched);
    const status = parseStatus(raw);
    const category = classify(title);

    return {
      raw,
      client: clientMatch.name,
      clientQuery: clientMatch.query,
      clientConfidence: clientMatch.score,
      clientInferred: clientMatch.inferred,
      clientCandidates: clientMatch.candidates,
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
    if (result.client) parts.push(`<span><b>클라이언트</b>${escapeHtml(result.client)}${result.clientInferred ? '<em>자동</em>' : ''}</span>`);
    if (result.date) parts.push(`<span><b>날짜</b>${escapeHtml(result.date)}</span>`);
    if (result.title) parts.push(`<span><b>업무</b>${escapeHtml(result.title)}</span>`);
    if (result.category) parts.push(`<span><b>분류</b>${escapeHtml(result.category)}</span>`);
    parts.push(`<span><b>상태</b>${escapeHtml(STATUS_LABELS[result.status])}</span>`);
    return parts.join("");
  }

  function suggestionMarkup(result) {
    const suggestions = result.clientCandidates.slice(0, 4);
    if (!suggestions.length) return "";
    return suggestions.map((item, index) => {
      const selected = item.name === result.client;
      const label = selected && result.clientInferred ? "자동 인식" : index === 0 ? "추천" : "";
      return `<button type="button" class="nw-quick-schedule__suggestion ${selected ? "is-selected" : ""}" data-client-suggestion="${escapeHtml(item.name)}" data-client-query="${escapeHtml(item.query)}"><strong>${escapeHtml(item.name)}</strong>${label ? `<small>${label}</small>` : ""}</button>`;
    }).join("");
  }

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  }

  function validationMessage(result) {
    if (!result.raw) return "예: 건강미 7일 월요일 - 사업계획서 작성 예정";
    if (!result.client) return result.clientCandidates.length
      ? "클라이언트를 추정했어요. 아래 추천을 선택하거나 이름을 조금 더 입력해주세요."
      : "등록된 클라이언트 이름 일부를 입력해주세요. 예: ‘건강’, ‘jnc’.";
    if (!result.date) return "날짜를 인식하지 못했어요. ‘내일’, ‘7일’, ‘9월 10일’, ‘다음주 월요일’처럼 입력해주세요.";
    if (!result.title) return "날짜 뒤에 할 일을 입력해주세요.";
    return "";
  }

  function replaceClientQuery(text, query, clientName) {
    const source = String(text || "");
    if (query) {
      const regex = new RegExp(escapeRegExp(query), "i");
      if (regex.test(source)) return source.replace(regex, clientName);
    }
    return `${clientName} ${source}`.trim();
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
        <small>클라이언트 이름 일부만 입력해도 자동으로 찾아줍니다.</small>
      </div>
      <form class="nw-quick-schedule__form">
        <div class="nw-quick-schedule__input-stack">
          <label class="nw-quick-schedule__input-wrap">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" /></svg>
            <input id="quickScheduleInput" type="text" autocomplete="off" placeholder="예: jnc 7일 - 로고 수정 예정 / 건강 내일 사업계획서 작성" aria-describedby="quickScheduleFeedback" />
          </label>
          <div id="quickScheduleSuggestions" class="nw-quick-schedule__suggestions" hidden></div>
        </div>
        <button class="button button--primary" type="submit">일정 추가</button>
      </form>
      <div id="quickSchedulePreview" class="nw-quick-schedule__preview" hidden></div>
      <p id="quickScheduleFeedback" class="nw-quick-schedule__feedback">예: 건강 내일 사업계획서 작성 / jnc 7일 로고 수정 예정</p>
    `;

    toolbar.insertAdjacentElement("beforebegin", section);

    const form = section.querySelector(".nw-quick-schedule__form");
    const input = section.querySelector("#quickScheduleInput");
    const preview = section.querySelector("#quickSchedulePreview");
    const suggestions = section.querySelector("#quickScheduleSuggestions");
    const feedback = section.querySelector("#quickScheduleFeedback");
    const submitButton = form.querySelector("button[type='submit']");

    function refresh() {
      const result = parse(input.value);
      const error = validationMessage(result);
      feedback.textContent = error || (result.clientInferred ? `${result.client}로 자동 인식했습니다. 그대로 등록해도 됩니다.` : "이대로 캘린더와 일정 목록에 등록됩니다.");
      feedback.classList.toggle("is-error", Boolean(input.value.trim() && error && !result.client));
      submitButton.disabled = Boolean(error);
      if (!input.value.trim()) submitButton.disabled = true;

      if (input.value.trim()) {
        preview.hidden = false;
        preview.innerHTML = previewMarkup(result);
      } else {
        preview.hidden = true;
        preview.innerHTML = "";
      }

      const suggestionHtml = input.value.trim() ? suggestionMarkup(result) : "";
      suggestions.innerHTML = suggestionHtml;
      suggestions.hidden = !suggestionHtml;
    }

    input.addEventListener("input", refresh);

    suggestions.addEventListener("click", (event) => {
      const button = event.target.closest("[data-client-suggestion]");
      if (!button) return;
      const name = button.dataset.clientSuggestion || "";
      const query = button.dataset.clientQuery || parse(input.value).clientQuery;
      if (!name) return;
      input.value = replaceClientQuery(input.value, query, name);
      input.focus();
      refresh();
    });

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
      suggestions.hidden = true;
      suggestions.innerHTML = "";
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
