(() => {
  "use strict";

  const STATUS_LABEL = {
    planned: "예정",
    progress: "진행 중",
    review: "검수 중",
    done: "완료"
  };

  const REQUEST_STATUS_LABEL = {
    new: "새 요청",
    confirmed: "확인 완료",
    working: "작업 중",
    done: "완료"
  };

  const COLLECTIONS = ["events", "todos", "requests", "clients"];

  let firebase = null;
  let calendar = null;
  let currentRequestToSchedule = null;
  let toastTimer = null;
  let unsubscribeList = [];
  let currentUser = null;

  const state = {
    events: [],
    todos: [],
    requests: [],
    clients: []
  };

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const uid = (prefix = "id") => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const escapeHtml = (value = "") => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const toDateKey = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fromDateKey = (key) => {
    const [year, month, day] = String(key).split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const addDays = (dateOrKey, amount) => {
    const date = typeof dateOrKey === "string" ? fromDateKey(dateOrKey) : new Date(dateOrKey);
    date.setDate(date.getDate() + amount);
    return toDateKey(date);
  };

  const differenceInDays = (from, to) => {
    const start = fromDateKey(toDateKey(from));
    const end = fromDateKey(toDateKey(to));
    return Math.round((end - start) / 86400000);
  };

  const formatDate = (key, withYear = false) => {
    if (!key) return "-";
    return new Intl.DateTimeFormat("ko-KR", {
      year: withYear ? "numeric" : undefined,
      month: "long",
      day: "numeric",
      weekday: "short"
    }).format(fromDateKey(key));
  };

  const formatShortDate = (key) => {
    if (!key) return "-";
    const date = fromDateKey(key);
    return `${date.getMonth() + 1}.${String(date.getDate()).padStart(2, "0")}`;
  };

  const today = () => toDateKey(new Date());

  const defaultEvents = () => {
    const base = today();
    return [
      { id: uid("event"), title: "메인 페이지 디자인", client: "건강미", category: "디자인", member: "박재영", start: addDays(base, -1), end: addDays(base, 2), status: "progress", memo: "메인 비주얼과 프로그램 소개 영역 우선 작업", link: "" },
      { id: uid("event"), title: "모바일 갤러리 수정", client: "리림", category: "홈페이지", member: "신민용", start: base, end: addDays(base, 1), status: "planned", memo: "신규 이미지 교체 및 모바일 여백 확인", link: "" },
      { id: uid("event"), title: "로고 최종안 정리", client: "오드벨", category: "브랜딩", member: "박재영", start: addDays(base, 2), end: addDays(base, 4), status: "review", memo: "심볼 비율과 워드마크 조합 최종 검수", link: "" },
      { id: uid("event"), title: "X배너 문구 배치", client: "JNCOS TECH", category: "디자인", member: "신민용", start: addDays(base, 4), end: addDays(base, 5), status: "planned", memo: "OEM·ODM 핵심 문구 중심으로 2종 구성", link: "" }
    ];
  };

  const defaultTodos = () => [
    { id: uid("todo"), title: "리림 이미지 교체 자료 확인", client: "리림", due: today(), done: false },
    { id: uid("todo"), title: "건강미 모바일 시안 정리", client: "건강미", due: addDays(today(), 1), done: false },
    { id: uid("todo"), title: "오드벨 피드백 반영", client: "오드벨", due: addDays(today(), 3), done: false }
  ];

  const defaultRequests = () => [
    { id: uid("request"), client: "리림", title: "모바일 갤러리 이미지 교체", content: "기존 3번 이미지를 새로 전달한 완성 사진으로 교체 요청", assignee: "신민용", due: addDays(today(), 2), status: "new", createdAt: today() },
    { id: uid("request"), client: "건강미", title: "프로그램 가격 문구 수정", content: "10회권과 25회권 가격 및 총 제공 횟수를 최종 내용으로 수정", assignee: "박재영", due: addDays(today(), 1), status: "new", createdAt: today() },
    { id: uid("request"), client: "오드벨", title: "로고 심볼 비율 재검토", content: "O와 D가 만나는 부분을 조금 더 정돈한 버전 요청", assignee: "박재영", due: addDays(today(), 4), status: "working", createdAt: addDays(today(), -1) }
  ];

  const defaultClients = () => [
    { id: uid("client"), name: "건강미", type: "헬스케어", work: "홈페이지·브로셔", status: "진행 중", member: "박재영" },
    { id: uid("client"), name: "리림", type: "공간 브랜드", work: "웹사이트 유지보수", status: "진행 중", member: "신민용" },
    { id: uid("client"), name: "오드벨", type: "코스메틱", work: "브랜드 개발", status: "진행 중", member: "박재영" },
    { id: uid("client"), name: "JNCOS TECH", type: "코스메틱 OEM", work: "홍보 디자인", status: "진행 중", member: "신민용" }
  ];

  const showToast = (message) => {
    const toast = $("#toast");
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
  };

  const setLoginMessage = (message, isError = false) => {
    const notice = $(".login-form__notice");
    if (!notice) return;
    notice.textContent = message;
    notice.style.color = isError ? "#ff8585" : "#606068";
  };

  const setLoginLoading = (loading) => {
    const button = $("#loginForm button[type='submit']");
    if (!button) return;
    button.disabled = loading;
    button.textContent = loading ? "로그인 중..." : "관리자 로그인";
  };

  const showApp = () => {
    $("#loginView").hidden = true;
    $("#appView").hidden = false;
    requestAnimationFrame(() => {
      if (!calendar) initializeCalendar();
      calendar?.updateSize();
      refreshAll();
    });
  };

  const showLogin = () => {
    $("#appView").hidden = true;
    $("#loginView").hidden = false;
    $("#loginPassword").value = "";
  };

  const routeTo = (route) => {
    $$("[data-page]").forEach((page) => page.classList.toggle("is-active", page.dataset.page === route));
    $$(".nav-link").forEach((link) => link.classList.toggle("is-active", link.dataset.route === route));
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (route === "calendar") window.setTimeout(() => calendar?.updateSize(), 50);
    refreshAll();
  };

  const saveDocument = async (collectionName, item) => {
    if (!currentUser) throw new Error("로그인이 필요합니다.");
    const payload = { ...item, updatedAt: firebase.serverTimestamp(), updatedBy: currentUser.uid };
    await firebase.setDoc(firebase.doc(firebase.db, collectionName, item.id), payload, { merge: true });
  };

  const removeDocument = async (collectionName, id) => {
    if (!currentUser) throw new Error("로그인이 필요합니다.");
    await firebase.deleteDoc(firebase.doc(firebase.db, collectionName, id));
  };

  const ensureInitialData = async () => {
    const metaRef = firebase.doc(firebase.db, "meta", "system");
    const metaSnapshot = await firebase.getDoc(metaRef);
    if (metaSnapshot.exists()) return;

    const snapshots = await Promise.all(COLLECTIONS.map((name) => firebase.getDocs(firebase.collection(firebase.db, name))));
    const hasExistingData = snapshots.some((snapshot) => !snapshot.empty);
    const batch = firebase.writeBatch(firebase.db);

    if (!hasExistingData) {
      const seedMap = {
        events: defaultEvents(),
        todos: defaultTodos(),
        requests: defaultRequests(),
        clients: defaultClients()
      };

      Object.entries(seedMap).forEach(([collectionName, items]) => {
        items.forEach((item) => {
          batch.set(firebase.doc(firebase.db, collectionName, item.id), {
            ...item,
            createdAtServer: firebase.serverTimestamp(),
            updatedAt: firebase.serverTimestamp(),
            updatedBy: currentUser.uid
          });
        });
      });
    }

    batch.set(metaRef, {
      initialized: true,
      initializedAt: firebase.serverTimestamp(),
      initializedBy: currentUser.uid
    });
    await batch.commit();
  };

  const cleanupRealtimeData = () => {
    unsubscribeList.forEach((unsubscribe) => unsubscribe());
    unsubscribeList = [];
    COLLECTIONS.forEach((name) => { state[name] = []; });
  };

  const startRealtimeData = async () => {
    cleanupRealtimeData();
    await ensureInitialData();

    COLLECTIONS.forEach((collectionName) => {
      const unsubscribe = firebase.onSnapshot(
        firebase.collection(firebase.db, collectionName),
        (snapshot) => {
          state[collectionName] = snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
          refreshAll();
          if (collectionName === "clients") syncClientOptions();
        },
        (error) => {
          console.error(`${collectionName} 실시간 동기화 실패`, error);
          showToast("데이터를 불러오지 못했습니다. Firestore 설정을 확인해주세요.");
        }
      );
      unsubscribeList.push(unsubscribe);
    });
  };

  const syncClientOptions = () => {
    const clientNames = state.clients.map((client) => client.name).filter(Boolean).sort((a, b) => a.localeCompare(b, "ko"));
    const targets = ["#clientFilter", "#eventClient", "#requestClient"];

    targets.forEach((selector) => {
      const select = $(selector);
      if (!select) return;
      const previous = select.value;
      const firstOption = selector === "#clientFilter"
        ? '<option value="all">전체 클라이언트</option>'
        : '<option value="">선택</option>';
      const extra = selector === "#eventClient" ? ["나인웍스"] : [];
      const options = [...new Set([...clientNames, ...extra])]
        .map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`)
        .join("");
      select.innerHTML = firstOption + options;
      if ([...select.options].some((option) => option.value === previous)) select.value = previous;
    });
  };

  const getFilteredEvents = () => {
    const client = $("#clientFilter")?.value || "all";
    const member = $("#memberFilter")?.value || "all";
    const category = $("#categoryFilter")?.value || "all";
    const search = ($("#globalSearch")?.value || "").trim().toLowerCase();

    return state.events.filter((event) => {
      const haystack = `${event.title} ${event.client} ${event.category} ${event.member} ${event.memo || ""}`.toLowerCase();
      return (client === "all" || event.client === client)
        && (member === "all" || event.member === member)
        && (category === "all" || event.category === category)
        && (!search || haystack.includes(search));
    });
  };

  const toCalendarEvent = (event) => ({
    id: event.id,
    title: `${event.client} · ${event.title}`,
    start: event.start,
    end: addDays(event.end || event.start, 1),
    allDay: true,
    extendedProps: { ...event }
  });

  const initializeCalendar = () => {
    const calendarElement = $("#calendar");
    if (!calendarElement || typeof FullCalendar === "undefined") return;

    calendar = new FullCalendar.Calendar(calendarElement, {
      initialView: "dayGridMonth",
      initialDate: new Date(),
      firstDay: 1,
      height: "auto",
      editable: true,
      selectable: true,
      dayMaxEvents: 3,
      eventDisplay: "block",
      nowIndicator: true,
      headerToolbar: { left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,listWeek" },
      buttonText: { today: "오늘", month: "월간", week: "주간", list: "목록" },
      titleFormat: { year: "numeric", month: "long" },
      dayHeaderContent: (info) => ["일", "월", "화", "수", "목", "금", "토"][info.date.getDay()],
      events: (_fetchInfo, successCallback) => successCallback(getFilteredEvents().map(toCalendarEvent)),
      eventClassNames: (info) => [`event-status-${info.event.extendedProps.status || "planned"}`],
      eventDidMount: (info) => {
        const data = info.event.extendedProps;
        info.el.title = `${data.client} · ${data.title}\n${data.member} · ${STATUS_LABEL[data.status] || "예정"}`;
      },
      dateClick: (info) => openEventDrawer({ start: info.dateStr, end: info.dateStr }),
      eventClick: (info) => {
        const item = state.events.find((event) => event.id === info.event.id);
        if (item) openEventDrawer(item);
      },
      eventDrop: (info) => updateEventDatesFromCalendar(info.event),
      eventResize: (info) => updateEventDatesFromCalendar(info.event)
    });

    calendar.render();
  };

  const updateEventDatesFromCalendar = async (calendarEvent) => {
    const item = state.events.find((event) => event.id === calendarEvent.id);
    if (!item) return;
    const start = toDateKey(calendarEvent.start);
    const exclusiveEnd = calendarEvent.end ? toDateKey(calendarEvent.end) : addDays(start, 1);
    try {
      await saveDocument("events", { ...item, start, end: addDays(exclusiveEnd, -1) });
      showToast("일정 기간이 변경되었습니다.");
    } catch (error) {
      console.error(error);
      calendarEvent.revert();
      showToast("일정 변경을 저장하지 못했습니다.");
    }
  };

  const openEventDrawer = (event = {}) => {
    currentRequestToSchedule = event.sourceRequestId || null;
    const isEdit = Boolean(event.id);
    const start = event.start || today();
    $("#drawerTitle").textContent = isEdit ? "일정 수정" : "일정 추가";
    $("#eventId").value = event.id || "";
    $("#eventTitle").value = event.title || "";
    $("#eventClient").value = event.client || "";
    $("#eventCategory").value = event.category || "";
    $("#eventMember").value = event.member || "박재영";
    $("#eventStart").value = start;
    $("#eventEnd").value = event.end || start;
    $("#eventStatus").value = event.status || "planned";
    $("#eventMemo").value = event.memo || "";
    $("#eventLink").value = event.link || "";
    $("#deleteEventButton").hidden = !isEdit;
    $("#drawerBackdrop").hidden = false;
    $("#eventDrawer").classList.add("is-open");
    $("#eventDrawer").setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    window.setTimeout(() => $("#eventTitle").focus(), 180);
  };

  const closeEventDrawer = () => {
    $("#eventDrawer").classList.remove("is-open");
    $("#eventDrawer").setAttribute("aria-hidden", "true");
    window.setTimeout(() => {
      $("#drawerBackdrop").hidden = true;
      document.body.style.overflow = "";
      currentRequestToSchedule = null;
    }, 220);
  };

  const saveEvent = async (formEvent) => {
    formEvent.preventDefault();
    const id = $("#eventId").value || uid("event");
    const start = $("#eventStart").value;
    const end = $("#eventEnd").value;
    if (fromDateKey(end) < fromDateKey(start)) {
      showToast("목표 완료일은 시작일보다 빠를 수 없습니다.");
      return;
    }

    const item = {
      id,
      title: $("#eventTitle").value.trim(),
      client: $("#eventClient").value,
      category: $("#eventCategory").value,
      member: $("#eventMember").value,
      start,
      end,
      status: $("#eventStatus").value,
      memo: $("#eventMemo").value.trim(),
      link: $("#eventLink").value.trim(),
      sourceRequestId: currentRequestToSchedule || null
    };

    try {
      await saveDocument("events", item);
      if (currentRequestToSchedule) {
        const request = state.requests.find((entry) => entry.id === currentRequestToSchedule);
        if (request && request.status !== "done") {
          await saveDocument("requests", { ...request, status: "working", linkedEventId: id });
        }
      }
      closeEventDrawer();
      showToast($("#eventId").value ? "일정이 수정되었습니다." : "새 일정이 등록되었습니다.");
    } catch (error) {
      console.error(error);
      showToast("일정을 저장하지 못했습니다.");
    }
  };

  const deleteCurrentEvent = async () => {
    const id = $("#eventId").value;
    if (!id || !window.confirm("이 일정을 삭제할까요?")) return;
    try {
      await removeDocument("events", id);
      closeEventDrawer();
      showToast("일정이 삭제되었습니다.");
    } catch (error) {
      console.error(error);
      showToast("일정을 삭제하지 못했습니다.");
    }
  };

  const getDdayLabel = (dateKey) => {
    const diff = differenceInDays(new Date(), fromDateKey(dateKey));
    if (diff === 0) return "D-DAY";
    if (diff > 0) return `D-${diff}`;
    return `${Math.abs(diff)}일 지연`;
  };

  const renderTodaySchedule = () => {
    const events = state.events
      .filter((event) => event.start <= today() && event.end >= today() && event.status !== "done")
      .sort((a, b) => a.end.localeCompare(b.end));
    $("#todayCount").textContent = events.length;
    $("#todaySchedule").innerHTML = events.length
      ? events.slice(0, 5).map((event) => `<button class="compact-item" type="button" data-open-event="${escapeHtml(event.id)}"><strong>${escapeHtml(event.title)}</strong><small>${escapeHtml(event.client)} · ${escapeHtml(event.member)} · ${escapeHtml(STATUS_LABEL[event.status])}</small></button>`).join("")
      : '<p class="empty-state">오늘 예정된 일정이 없습니다.</p>';
  };

  const renderRequestPreview = () => {
    const requests = state.requests.filter((request) => request.status !== "done").sort((a, b) => a.due.localeCompare(b.due)).slice(0, 4);
    $("#requestPreview").innerHTML = requests.length
      ? requests.map((request) => `<button class="compact-item" type="button" data-request-schedule="${escapeHtml(request.id)}"><strong>${escapeHtml(request.title)}</strong><small>${escapeHtml(request.client)} · ${escapeHtml(request.assignee)} · ${formatShortDate(request.due)}</small></button>`).join("")
      : '<p class="empty-state">새로운 요청이 없습니다.</p>';
  };

  const renderGoals = () => {
    const events = state.events.filter((event) => event.status !== "done").sort((a, b) => a.end.localeCompare(b.end));
    const markup = (event, short = false) => `<button class="line-item" type="button" data-open-event="${escapeHtml(event.id)}"><span class="line-item__date">${escapeHtml(getDdayLabel(event.end))}</span><span class="line-item__body"><strong>${escapeHtml(event.title)}</strong><small>${escapeHtml(event.client)} · ${escapeHtml(event.category)}</small></span><span class="line-item__meta">${escapeHtml(short ? formatShortDate(event.end) : formatDate(event.end))}${short ? "" : `<br />${escapeHtml(event.member)}`}</span></button>`;
    $("#goalList").innerHTML = events.length ? events.map((event) => markup(event)).join("") : '<p class="empty-state">등록된 목표 일정이 없습니다.</p>';
    $("#overviewGoals").innerHTML = events.length ? events.slice(0, 4).map((event) => markup(event, true)).join("") : '<p class="empty-state">등록된 목표 일정이 없습니다.</p>';
  };

  const todoItemMarkup = (todo) => `<label class="todo-item ${todo.done ? "is-done" : ""}"><input type="checkbox" data-toggle-todo="${escapeHtml(todo.id)}" ${todo.done ? "checked" : ""} /><span class="todo-item__body"><strong>${escapeHtml(todo.title)}</strong><small>${escapeHtml(todo.client)} · ${escapeHtml(formatDate(todo.due))}</small></span></label>`;

  const renderTodos = () => {
    const todos = [...state.todos].sort((a, b) => Number(a.done) - Number(b.done) || a.due.localeCompare(b.due));
    $("#todoList").innerHTML = todos.length ? todos.map(todoItemMarkup).join("") : '<p class="empty-state">해야 할 일이 없습니다.</p>';
    const active = todos.filter((todo) => !todo.done).slice(0, 5);
    $("#overviewTodo").innerHTML = active.length ? active.map(todoItemMarkup).join("") : '<p class="empty-state">해야 할 일이 없습니다.</p>';
  };

  const toggleTodo = async (id, checked) => {
    const todo = state.todos.find((item) => item.id === id);
    if (!todo) return;
    try {
      await saveDocument("todos", { ...todo, done: checked });
      showToast(checked ? "할 일을 완료했습니다." : "할 일을 다시 진행 상태로 변경했습니다.");
    } catch (error) {
      console.error(error);
      showToast("할 일 상태를 저장하지 못했습니다.");
    }
  };

  const addTodo = async () => {
    const title = window.prompt("추가할 할 일을 입력하세요.");
    if (!title?.trim()) return;
    try {
      await saveDocument("todos", { id: uid("todo"), title: title.trim(), client: "나인웍스", due: today(), done: false });
      showToast("할 일이 추가되었습니다.");
    } catch (error) {
      console.error(error);
      showToast("할 일을 추가하지 못했습니다.");
    }
  };

  const renderCompleted = () => {
    const events = state.events.filter((event) => event.status === "done").sort((a, b) => b.end.localeCompare(a.end));
    $("#completedList").innerHTML = events.length
      ? events.map((event) => `<button class="line-item" type="button" data-open-event="${escapeHtml(event.id)}"><span class="line-item__date">DONE</span><span class="line-item__body"><strong>${escapeHtml(event.title)}</strong><small>${escapeHtml(event.client)} · ${escapeHtml(event.category)}</small></span><span class="line-item__meta">${escapeHtml(formatDate(event.end))}</span></button>`).join("")
      : '<p class="empty-state">완료한 업무가 없습니다.</p>';
  };

  const requestCardMarkup = (request) => `<article class="request-card" data-request-id="${escapeHtml(request.id)}"><span class="request-card__client">${escapeHtml(request.client)}</span><strong>${escapeHtml(request.title)}</strong><p>${escapeHtml(request.content)}</p><div class="request-card__meta"><span>${escapeHtml(request.assignee)}</span><span>${escapeHtml(formatShortDate(request.due))}</span></div><div class="request-card__actions">${request.status !== "done" ? `<button class="text-button" type="button" data-request-schedule="${escapeHtml(request.id)}">일정에 추가</button><button class="text-button" type="button" data-request-next="${escapeHtml(request.id)}">다음 단계</button>` : ""}</div></article>`;

  const renderRequests = () => {
    const groups = {
      new: state.requests.filter((request) => request.status === "new"),
      confirmed: state.requests.filter((request) => request.status === "confirmed"),
      working: state.requests.filter((request) => request.status === "working"),
      done: state.requests.filter((request) => request.status === "done")
    };
    const map = {
      new: ["#newRequestList", "#newRequestCount"],
      confirmed: ["#confirmedRequestList", "#confirmedRequestCount"],
      working: ["#workingRequestList", "#workingRequestCount"],
      done: ["#doneRequestList", "#doneRequestCount"]
    };
    Object.entries(map).forEach(([status, [listSelector, countSelector]]) => {
      $(countSelector).textContent = groups[status].length;
      $(listSelector).innerHTML = groups[status].length ? groups[status].map(requestCardMarkup).join("") : '<p class="empty-state">등록된 요청이 없습니다.</p>';
    });
    const assigned = state.requests.filter((request) => request.assignee === "박재영" && request.status !== "done");
    $("#assignedRequestList").innerHTML = assigned.length
      ? assigned.map((request) => `<div class="request-row"><span class="request-status">${escapeHtml(REQUEST_STATUS_LABEL[request.status])}</span><div><strong>${escapeHtml(request.title)}</strong><p>${escapeHtml(request.client)} · ${escapeHtml(request.content)}</p></div><span>${escapeHtml(formatShortDate(request.due))}</span><button class="text-button" type="button" data-request-schedule="${escapeHtml(request.id)}">일정에 추가</button></div>`).join("")
      : '<p class="empty-state">배정된 요청이 없습니다.</p>';
    $("#requestBadge").textContent = groups.new.length;
    $("#requestBadge").hidden = groups.new.length === 0;
  };

  const scheduleRequest = (requestId) => {
    const request = state.requests.find((item) => item.id === requestId);
    if (!request) return;
    openEventDrawer({ title: request.title, client: request.client, category: "수정사항", member: request.assignee === "미지정" ? "박재영" : request.assignee, start: today(), end: request.due, status: "planned", memo: request.content, sourceRequestId: request.id });
  };

  const moveRequestNext = async (requestId) => {
    const request = state.requests.find((item) => item.id === requestId);
    if (!request) return;
    const order = ["new", "confirmed", "working", "done"];
    const nextStatus = order[Math.min(order.indexOf(request.status) + 1, order.length - 1)];
    try {
      await saveDocument("requests", { ...request, status: nextStatus });
      showToast(`요청 상태가 ‘${REQUEST_STATUS_LABEL[nextStatus]}’로 변경되었습니다.`);
    } catch (error) {
      console.error(error);
      showToast("요청 상태를 저장하지 못했습니다.");
    }
  };

  const openRequestModal = () => {
    $("#requestForm").reset();
    $("#requestDue").value = addDays(today(), 3);
    $("#modalBackdrop").hidden = false;
    $("#requestModal").hidden = false;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => $("#requestClient").focus(), 50);
  };

  const closeRequestModal = () => {
    $("#modalBackdrop").hidden = true;
    $("#requestModal").hidden = true;
    document.body.style.overflow = "";
  };

  const saveRequest = async (event) => {
    event.preventDefault();
    const item = { id: uid("request"), client: $("#requestClient").value, title: $("#requestTitle").value.trim(), content: $("#requestContent").value.trim(), assignee: $("#requestAssignee").value, due: $("#requestDue").value, status: "new", createdAt: today() };
    try {
      await saveDocument("requests", item);
      closeRequestModal();
      showToast("새 요청사항이 등록되었습니다.");
    } catch (error) {
      console.error(error);
      showToast("요청사항을 저장하지 못했습니다.");
    }
  };

  const renderClients = () => {
    const search = ($("#clientSearch")?.value || "").trim().toLowerCase();
    const clients = state.clients.filter((client) => `${client.name} ${client.type} ${client.work} ${client.member}`.toLowerCase().includes(search));
    $("#clientCount").textContent = `${clients.length} CLIENTS`;
    $("#clientTableBody").innerHTML = clients.length
      ? clients.map((client) => {
          const activeEvents = state.events.filter((event) => event.client === client.name && event.status !== "done").length;
          const activeRequests = state.requests.filter((request) => request.client === client.name && request.status !== "done").length;
          return `<tr><td><span class="client-name">${escapeHtml(client.name)}</span></td><td><span class="client-chip">${escapeHtml(client.type)}</span></td><td>${escapeHtml(client.work)} · ${activeEvents}건</td><td>${activeRequests}건</td><td>${escapeHtml(client.status)}</td><td>${escapeHtml(client.member)}</td></tr>`;
        }).join("")
      : '<tr><td colspan="6" class="empty-state">검색 결과가 없습니다.</td></tr>';
  };

  const addClient = async () => {
    const name = window.prompt("클라이언트명을 입력하세요.");
    if (!name?.trim()) return;
    try {
      await saveDocument("clients", { id: uid("client"), name: name.trim(), type: "기타", work: "신규 상담", status: "상담 중", member: "박재영" });
      showToast("클라이언트가 추가되었습니다.");
    } catch (error) {
      console.error(error);
      showToast("클라이언트를 추가하지 못했습니다.");
    }
  };

  const refreshSummaries = () => {
    const todayEvents = state.events.filter((event) => event.start <= today() && event.end >= today() && event.status !== "done");
    const progress = state.events.filter((event) => event.status === "progress");
    const goals = state.events.filter((event) => event.status !== "done" && differenceInDays(new Date(), fromDateKey(event.end)) <= 7);
    const newRequests = state.requests.filter((request) => request.status === "new");
    $("#summaryToday").textContent = todayEvents.length;
    $("#summaryProgress").textContent = progress.length;
    $("#summaryGoals").textContent = goals.length;
    $("#summaryRequests").textContent = newRequests.length;
  };

  const refreshAll = () => {
    calendar?.refetchEvents();
    renderTodaySchedule();
    renderRequestPreview();
    renderGoals();
    renderTodos();
    renderCompleted();
    renderRequests();
    renderClients();
    refreshSummaries();
  };

  const activateWorkspaceTab = (tabName) => {
    $$(".workspace-tab").forEach((tab) => tab.classList.toggle("is-active", tab.dataset.workspaceTab === tabName));
    $$(".workspace-panel").forEach((panel) => panel.classList.toggle("is-active", panel.dataset.workspacePanel === tabName));
  };

  const getAuthErrorMessage = (error) => {
    const code = error?.code || "";
    if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) return "이메일 또는 비밀번호가 올바르지 않습니다.";
    if (code.includes("too-many-requests")) return "로그인 시도가 많습니다. 잠시 후 다시 시도해주세요.";
    if (code.includes("network-request-failed")) return "네트워크 연결을 확인해주세요.";
    if (code.includes("operation-not-allowed")) return "Firebase에서 이메일/비밀번호 로그인을 활성화해주세요.";
    return "로그인하지 못했습니다. Firebase 설정을 확인해주세요.";
  };

  const bindEvents = () => {
    $("#loginForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      setLoginLoading(true);
      setLoginMessage("관리자 계정을 확인하고 있습니다.");
      try {
        await firebase.signInWithEmailAndPassword(firebase.auth, $("#loginEmail").value.trim(), $("#loginPassword").value);
      } catch (error) {
        console.error(error);
        setLoginMessage(getAuthErrorMessage(error), true);
      } finally {
        setLoginLoading(false);
      }
    });

    $("#logoutButton").addEventListener("click", async () => {
      try {
        await firebase.signOut(firebase.auth);
      } catch (error) {
        console.error(error);
        showToast("로그아웃하지 못했습니다.");
      }
    });

    $$('[data-route]').forEach((button) => button.addEventListener("click", () => routeTo(button.dataset.route)));
    $$(".workspace-tab").forEach((button) => button.addEventListener("click", () => activateWorkspaceTab(button.dataset.workspaceTab)));
    $("#openEventDrawer").addEventListener("click", () => openEventDrawer());
    $("#closeEventDrawer").addEventListener("click", closeEventDrawer);
    $("#drawerBackdrop").addEventListener("click", closeEventDrawer);
    $("#eventForm").addEventListener("submit", saveEvent);
    $("#deleteEventButton").addEventListener("click", deleteCurrentEvent);
    ["#clientFilter", "#memberFilter", "#categoryFilter"].forEach((selector) => $(selector).addEventListener("change", () => calendar?.refetchEvents()));
    $("#globalSearch").addEventListener("input", () => calendar?.refetchEvents());
    $("#clientSearch").addEventListener("input", renderClients);
    $("#addTodoButton").addEventListener("click", addTodo);
    $("#addClientButton").addEventListener("click", addClient);
    $("#addRequestButton").addEventListener("click", openRequestModal);
    $("#closeRequestModal").addEventListener("click", closeRequestModal);
    $("#cancelRequestModal").addEventListener("click", closeRequestModal);
    $("#modalBackdrop").addEventListener("click", closeRequestModal);
    $("#requestForm").addEventListener("submit", saveRequest);
    $("#notificationButton").addEventListener("click", () => {
      const newRequests = state.requests.filter((request) => request.status === "new").length;
      showToast(newRequests ? `확인하지 않은 새 요청이 ${newRequests}건 있습니다.` : "새로운 알림이 없습니다.");
    });

    document.addEventListener("click", (event) => {
      const eventButton = event.target.closest("[data-open-event]");
      if (eventButton) {
        const item = state.events.find((storedEvent) => storedEvent.id === eventButton.dataset.openEvent);
        if (item) openEventDrawer(item);
        return;
      }
      const scheduleButton = event.target.closest("[data-request-schedule]");
      if (scheduleButton) {
        event.preventDefault();
        event.stopPropagation();
        scheduleRequest(scheduleButton.dataset.requestSchedule);
        return;
      }
      const nextButton = event.target.closest("[data-request-next]");
      if (nextButton) {
        event.preventDefault();
        event.stopPropagation();
        moveRequestNext(nextButton.dataset.requestNext);
      }
    });

    document.addEventListener("change", (event) => {
      const checkbox = event.target.closest("[data-toggle-todo]");
      if (checkbox) toggleTodo(checkbox.dataset.toggleTodo, checkbox.checked);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if ($("#eventDrawer").classList.contains("is-open")) closeEventDrawer();
      if (!$("#requestModal").hidden) closeRequestModal();
    });
  };

  const init = async () => {
    try {
      firebase = await import("./firebase.js");
      bindEvents();
      setLoginMessage("등록된 관리자 계정으로 로그인해주세요.");

      firebase.onAuthStateChanged(firebase.auth, async (user) => {
        currentUser = user;
        if (!user) {
          cleanupRealtimeData();
          showLogin();
          return;
        }

        setLoginMessage("로그인되었습니다.");
        showApp();
        const profileEmail = $(".profile-info dd");
        if (profileEmail) profileEmail.textContent = user.email || "-";

        try {
          await startRealtimeData();
        } catch (error) {
          console.error("Firestore 초기화 실패", error);
          showToast("Firestore를 연결하지 못했습니다. 데이터베이스와 보안 규칙을 확인해주세요.");
        }
      });
    } catch (error) {
      console.error("Firebase SDK 로드 실패", error);
      setLoginMessage("Firebase SDK를 불러오지 못했습니다. 인터넷 연결을 확인해주세요.", true);
    }
  };

  document.addEventListener("DOMContentLoaded", init);
})();
