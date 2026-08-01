const api = window.NineworksFirebase;
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const uid = (prefix = "goal") => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const MEMBERS = ["박재영", "박상혁"];
let currentUser = null;
let currentProfile = null;
let users = [];
let goals = [];
let clients = [];
let unsubscribeGoals = null;
let unsubscribeUsers = null;
let unsubscribeClients = null;
let reminderTimer = null;

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function dateKey(date = new Date()) {
  const value = new Date(date);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function fromDateKey(key) {
  const [year, month, day] = String(key).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function daysUntil(key) {
  const start = fromDateKey(dateKey());
  const end = fromDateKey(key);
  return Math.round((end - start) / 86400000);
}

function ddayLabel(key) {
  const diff = daysUntil(key);
  if (diff === 0) return "D-DAY";
  if (diff > 0) return `D-${diff}`;
  return `${Math.abs(diff)}일 지연`;
}

function formatGoalDate(key) {
  if (!key) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short"
  }).format(fromDateKey(key));
}

function normalizeName(value = "") {
  return String(value).replace(/\s+/g, "").trim();
}

function createGoalPage() {
  if ($("#goalsPage")) return;

  const nav = $(".main-nav");
  const clientNav = $('[data-route="clients"]', nav || document);
  if (nav && !$("[data-route='goals']", nav)) {
    const button = document.createElement("button");
    button.className = "nav-link";
    button.type = "button";
    button.dataset.route = "goals";
    button.textContent = "목표일정";
    if (clientNav) nav.insertBefore(button, clientNav);
    else nav.appendChild(button);
    button.addEventListener("click", () => routeToGoals());
  }

  const appContent = $(".app-content");
  if (!appContent) return;

  const page = document.createElement("main");
  page.id = "goalsPage";
  page.className = "page";
  page.dataset.page = "goals";
  page.innerHTML = `
    <section class="goal-page-heading">
      <div>
        <p class="eyebrow">GOAL SCHEDULE</p>
        <h1>놓치면 안 되는 목표일정을 관리합니다.</h1>
        <p>클라이언트 요청 마감과 내부 목표를 등록하면 D-3, D-1, 당일에 담당자에게 알려드립니다.</p>
      </div>
      <button id="addGoalButton" class="button button--primary" type="button">＋ 목표일정 추가</button>
    </section>

    <section class="goal-summary-grid">
      <article class="goal-summary-card"><span>다가오는 목표</span><strong id="goalUpcomingCount">0</strong><small>건</small></article>
      <article class="goal-summary-card"><span>3일 이내</span><strong id="goalSoonCount">0</strong><small>건</small></article>
      <article class="goal-summary-card"><span>오늘 마감</span><strong id="goalTodayCount">0</strong><small>건</small></article>
      <article class="goal-summary-card"><span>완료</span><strong id="goalDoneCount">0</strong><small>건</small></article>
    </section>

    <section class="goal-toolbar">
      <div class="goal-filter-group">
        <label class="goal-filter"><span>구분</span><select id="goalTypeFilter"><option value="all">전체 구분</option><option value="client">클라이언트 요청</option><option value="internal">내부 목표</option></select></label>
        <label class="goal-filter"><span>담당자</span><select id="goalMemberFilter"><option value="all">전체 담당자</option><option>박재영</option><option>박상혁</option></select></label>
        <label class="goal-filter"><span>클라이언트</span><select id="goalClientFilter"><option value="all">전체 클라이언트</option></select></label>
      </div>
      <p class="goal-reminder-guide"><strong>자동 알림</strong> 목표일 3일 전 · 1일 전 · 당일</p>
    </section>

    <section class="goal-board">
      <div class="goal-section">
        <div class="goal-section__head"><div><p class="eyebrow">UPCOMING</p><h2>다가오는 목표일정</h2></div><span id="goalActiveBadge" class="count-badge">0</span></div>
        <div id="goalActiveList" class="goal-list"></div>
      </div>
      <div class="goal-section goal-section--done">
        <div class="goal-section__head"><div><p class="eyebrow">COMPLETED</p><h2>완료한 목표일정</h2></div><span id="goalCompletedBadge" class="count-badge">0</span></div>
        <div id="goalCompletedList" class="goal-list"></div>
      </div>
    </section>
  `;
  appContent.appendChild(page);

  createGoalModal();
  bindGoalPageEvents();
}

function routeToGoals() {
  $$('[data-page]').forEach((page) => page.classList.toggle("is-active", page.dataset.page === "goals"));
  $$(".nav-link").forEach((link) => link.classList.toggle("is-active", link.dataset.route === "goals"));
  window.scrollTo({ top: 0, behavior: "smooth" });
  renderGoals();
}

function createGoalModal() {
  if ($("#goalModal")) return;
  const app = $("#appView") || document.body;

  const backdrop = document.createElement("div");
  backdrop.id = "goalModalBackdrop";
  backdrop.className = "goal-modal-backdrop";
  backdrop.hidden = true;

  const modal = document.createElement("section");
  modal.id = "goalModal";
  modal.className = "goal-modal";
  modal.hidden = true;
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.innerHTML = `
    <div class="goal-modal__head">
      <div><p class="eyebrow">GOAL SCHEDULE</p><h2 id="goalModalTitle">목표일정 추가</h2></div>
      <button id="closeGoalModal" class="icon-button" type="button" aria-label="닫기">×</button>
    </div>
    <form id="goalForm" class="goal-modal__body">
      <input id="goalId" type="hidden" />
      <label class="field"><span>목표 제목</span><input id="goalTitle" type="text" placeholder="예: 최종 시안 전달, 홈페이지 오픈" required /></label>
      <div class="goal-form-grid">
        <label class="field"><span>구분</span><select id="goalType"><option value="client">클라이언트 요청</option><option value="internal">내부 목표</option></select></label>
        <label class="field"><span>클라이언트</span><select id="goalClient"><option value="나인웍스">나인웍스</option></select></label>
      </div>
      <div class="goal-form-grid">
        <label class="field"><span>담당자</span><select id="goalAssignee"><option>박재영</option><option>박상혁</option></select></label>
        <label class="field"><span>목표일</span><input id="goalDueDate" type="date" required /></label>
      </div>
      <label class="field"><span>요청 내용 · 해야 할 일</span><textarea id="goalNotes" rows="5" placeholder="클라이언트 요청 원문이나 꼭 처리해야 할 내용을 적어주세요."></textarea></label>
      <label class="field"><span>원본·참고 링크</span><input id="goalReferenceLink" type="text" placeholder="Figma, Drive, 카카오톡 자료, 참고 사이트 링크" /></label>
      <div class="field">
        <span>알림 시점</span>
        <div class="goal-reminder-options">
          <label class="goal-reminder-option"><input type="checkbox" name="goalReminder" value="3" checked /> 3일 전</label>
          <label class="goal-reminder-option"><input type="checkbox" name="goalReminder" value="1" checked /> 1일 전</label>
          <label class="goal-reminder-option"><input type="checkbox" name="goalReminder" value="0" checked /> 당일</label>
        </div>
      </div>
      <div class="goal-modal__actions">
        <button id="deleteGoalButton" class="button button--danger" type="button" hidden>삭제</button>
        <button id="cancelGoalModal" class="button button--ghost" type="button">취소</button>
        <button class="button button--primary" type="submit">저장</button>
      </div>
    </form>
  `;

  app.append(backdrop, modal);
}

function openGoalModal(goal = null) {
  const isEdit = Boolean(goal?.id);
  $("#goalModalTitle").textContent = isEdit ? "목표일정 수정" : "목표일정 추가";
  $("#goalId").value = goal?.id || "";
  $("#goalTitle").value = goal?.title || "";
  $("#goalType").value = goal?.type || "client";
  $("#goalClient").value = goal?.client || "나인웍스";
  $("#goalAssignee").value = MEMBERS.includes(goal?.assignee) ? goal.assignee : (currentProfile?.name || "박재영");
  $("#goalDueDate").value = goal?.dueDate || dateKey();
  $("#goalNotes").value = goal?.notes || "";
  $("#goalReferenceLink").value = goal?.referenceLink || "";
  $("#deleteGoalButton").hidden = !isEdit;

  const reminders = Array.isArray(goal?.reminderDays) ? goal.reminderDays.map(Number) : [3, 1, 0];
  $$('input[name="goalReminder"]').forEach((input) => { input.checked = reminders.includes(Number(input.value)); });

  $("#goalModalBackdrop").hidden = false;
  $("#goalModal").hidden = false;
  document.body.style.overflow = "hidden";
  window.setTimeout(() => $("#goalTitle").focus(), 50);
}

function closeGoalModal() {
  $("#goalModalBackdrop").hidden = true;
  $("#goalModal").hidden = true;
  document.body.style.overflow = "";
}

function bindGoalPageEvents() {
  $("#addGoalButton")?.addEventListener("click", () => openGoalModal());
  $("#closeGoalModal")?.addEventListener("click", closeGoalModal);
  $("#cancelGoalModal")?.addEventListener("click", closeGoalModal);
  $("#goalModalBackdrop")?.addEventListener("click", closeGoalModal);
  $("#goalForm")?.addEventListener("submit", saveGoal);
  $("#deleteGoalButton")?.addEventListener("click", deleteGoal);

  ["#goalTypeFilter", "#goalMemberFilter", "#goalClientFilter"].forEach((selector) => {
    $(selector)?.addEventListener("change", renderGoals);
  });

  document.addEventListener("click", (event) => {
    const edit = event.target.closest("[data-goal-edit]");
    const complete = event.target.closest("[data-goal-complete]");
    const reopen = event.target.closest("[data-goal-reopen]");
    const link = event.target.closest("[data-goal-link]");

    if (edit) {
      const goal = goals.find((item) => item.id === edit.dataset.goalEdit);
      if (goal) openGoalModal(goal);
    }
    if (complete) updateGoalStatus(complete.dataset.goalComplete, "done");
    if (reopen) updateGoalStatus(reopen.dataset.goalReopen, "active");
    if (link) {
      const goal = goals.find((item) => item.id === link.dataset.goalLink);
      if (goal?.referenceLink) window.open(goal.referenceLink, "_blank", "noopener,noreferrer");
    }
  });
}

async function saveGoal(event) {
  event.preventDefault();
  if (!currentUser) return;

  const id = $("#goalId").value || uid();
  const existing = goals.find((goal) => goal.id === id);
  const reminderDays = $$('input[name="goalReminder"]:checked').map((input) => Number(input.value));
  const item = {
    id,
    title: $("#goalTitle").value.trim(),
    type: $("#goalType").value,
    client: $("#goalClient").value || "나인웍스",
    assignee: $("#goalAssignee").value,
    dueDate: $("#goalDueDate").value,
    notes: $("#goalNotes").value.trim(),
    referenceLink: $("#goalReferenceLink").value.trim(),
    reminderDays,
    status: existing?.status || "active",
    createdBy: existing?.createdBy || currentUser.uid,
    createdByName: existing?.createdByName || currentProfile?.name || currentUser.email || "나인웍스",
    createdAt: existing?.createdAt || api.serverTimestamp(),
    updatedAt: api.serverTimestamp()
  };

  try {
    await api.setDoc(api.doc(api.db, "goals", id), item, { merge: true });
    if (!existing || normalizeName(existing.assignee) !== normalizeName(item.assignee)) {
      await createGoalAssignmentNotification(item);
    }
    closeGoalModal();
  } catch (error) {
    console.error("목표일정 저장 실패", error);
    window.alert("목표일정을 저장하지 못했습니다. Firestore 규칙을 확인해주세요.");
  }
}

async function deleteGoal() {
  const id = $("#goalId").value;
  if (!id || !window.confirm("이 목표일정을 삭제할까요?")) return;
  try {
    await api.deleteDoc(api.doc(api.db, "goals", id));
    closeGoalModal();
  } catch (error) {
    console.error("목표일정 삭제 실패", error);
  }
}

async function updateGoalStatus(id, status) {
  try {
    await api.setDoc(api.doc(api.db, "goals", id), { status, updatedAt: api.serverTimestamp() }, { merge: true });
  } catch (error) {
    console.error("목표일정 상태 변경 실패", error);
  }
}

function filteredGoals() {
  const type = $("#goalTypeFilter")?.value || "all";
  const member = $("#goalMemberFilter")?.value || "all";
  const client = $("#goalClientFilter")?.value || "all";
  return goals.filter((goal) =>
    (type === "all" || goal.type === type)
    && (member === "all" || goal.assignee === member)
    && (client === "all" || goal.client === client)
  );
}

function goalMarkup(goal, completed = false) {
  const diff = daysUntil(goal.dueDate);
  const urgent = diff <= 1 && !completed;
  return `
    <article class="goal-item ${completed ? "is-done" : ""}">
      <div class="goal-dday ${urgent ? "is-urgent" : ""}">${completed ? "DONE" : escapeHtml(ddayLabel(goal.dueDate))}</div>
      <div class="goal-item__body">
        <small>${escapeHtml(goal.type === "client" ? "클라이언트 요청" : "내부 목표")} · ${escapeHtml(goal.client || "나인웍스")}</small>
        <h3>${escapeHtml(goal.title || "목표일정")}</h3>
        <p>${escapeHtml(goal.notes || "등록된 상세 내용이 없습니다.")}</p>
      </div>
      <div class="goal-item__meta">
        <strong>${escapeHtml(formatGoalDate(goal.dueDate))}</strong>
        <span>담당 ${escapeHtml(goal.assignee || "미지정")}</span>
      </div>
      <div class="goal-item__actions">
        ${goal.referenceLink ? `<button class="button button--ghost" type="button" data-goal-link="${escapeHtml(goal.id)}">참고 열기</button>` : ""}
        <button class="button button--ghost" type="button" data-goal-edit="${escapeHtml(goal.id)}">수정</button>
        ${completed
          ? `<button class="text-button" type="button" data-goal-reopen="${escapeHtml(goal.id)}">다시 열기</button>`
          : `<button class="button button--primary" type="button" data-goal-complete="${escapeHtml(goal.id)}">완료</button>`}
      </div>
    </article>
  `;
}

function renderGoals() {
  const filtered = filteredGoals();
  const active = filtered
    .filter((goal) => goal.status !== "done")
    .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));
  const completed = filtered
    .filter((goal) => goal.status === "done")
    .sort((a, b) => String(b.dueDate).localeCompare(String(a.dueDate)));

  const allActive = goals.filter((goal) => goal.status !== "done");
  $("#goalUpcomingCount").textContent = allActive.length;
  $("#goalSoonCount").textContent = allActive.filter((goal) => { const diff = daysUntil(goal.dueDate); return diff >= 0 && diff <= 3; }).length;
  $("#goalTodayCount").textContent = allActive.filter((goal) => daysUntil(goal.dueDate) === 0).length;
  $("#goalDoneCount").textContent = goals.filter((goal) => goal.status === "done").length;
  $("#goalActiveBadge").textContent = active.length;
  $("#goalCompletedBadge").textContent = completed.length;

  $("#goalActiveList").innerHTML = active.length ? active.map((goal) => goalMarkup(goal)).join("") : '<p class="goal-empty">다가오는 목표일정이 없습니다.</p>';
  $("#goalCompletedList").innerHTML = completed.length ? completed.map((goal) => goalMarkup(goal, true)).join("") : '<p class="goal-empty">완료한 목표일정이 없습니다.</p>';
}

function syncClientOptions() {
  const names = [...new Set(["나인웍스", ...clients.map((client) => client.name).filter(Boolean)])];
  const targets = [$("#goalClient"), $("#goalClientFilter")];

  targets.forEach((select, index) => {
    if (!select) return;
    const previous = select.value;
    const first = index === 1 ? '<option value="all">전체 클라이언트</option>' : "";
    select.innerHTML = first + names.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join("");
    if ([...select.options].some((option) => option.value === previous)) select.value = previous;
  });
}

function findUser(name) {
  return users.find((user) => normalizeName(user.name) === normalizeName(name)) || null;
}

async function createGoalAssignmentNotification(goal) {
  if (!currentUser || normalizeName(goal.assignee) === normalizeName(currentProfile?.name)) return;
  const recipient = findUser(goal.assignee);
  const id = `goal_assign_${goal.id}_${recipient?.uid || normalizeName(goal.assignee)}`;
  const ref = api.doc(api.db, "notifications", id);
  const snapshot = await api.getDoc(ref);
  if (snapshot.exists()) return;

  await api.setDoc(ref, {
    id,
    recipientUid: recipient?.uid || "",
    recipientName: goal.assignee,
    actorUid: currentUser.uid,
    actorName: currentProfile?.name || currentUser.email || "나인웍스",
    title: "새 목표일정이 배정되었습니다.",
    message: `${goal.client} · ${goal.title} · ${formatGoalDate(goal.dueDate)}`,
    relatedType: "goal",
    relatedId: goal.id,
    read: false,
    createdAt: api.serverTimestamp()
  });
}

async function createReminderNotification(goal, days) {
  const recipient = findUser(goal.assignee);
  const recipientKey = recipient?.uid || normalizeName(goal.assignee);
  const id = `goal_reminder_${goal.id}_${days}_${recipientKey}`;
  const ref = api.doc(api.db, "notifications", id);
  const snapshot = await api.getDoc(ref);
  if (snapshot.exists()) return;

  const title = days === 0 ? "오늘이 목표일입니다." : `목표일정이 ${days}일 남았습니다.`;
  await api.setDoc(ref, {
    id,
    recipientUid: recipient?.uid || "",
    recipientName: goal.assignee,
    actorUid: "system",
    actorName: "NINEWORKS SYSTEM",
    title,
    message: `${goal.client} · ${goal.title} · ${formatGoalDate(goal.dueDate)}`,
    relatedType: "goal",
    relatedId: goal.id,
    read: false,
    createdAt: api.serverTimestamp()
  });
}

async function checkGoalReminders() {
  if (!currentUser || !goals.length) return;
  const active = goals.filter((goal) => goal.status !== "done" && goal.dueDate);
  for (const goal of active) {
    const diff = daysUntil(goal.dueDate);
    const reminderDays = Array.isArray(goal.reminderDays) ? goal.reminderDays.map(Number) : [3, 1, 0];
    if (!reminderDays.includes(diff)) continue;
    try {
      await createReminderNotification(goal, diff);
    } catch (error) {
      console.warn("목표일정 알림 생성 실패", error);
    }
  }
}

function subscribeGoalData() {
  unsubscribeGoals?.();
  unsubscribeUsers?.();
  unsubscribeClients?.();

  unsubscribeGoals = api.onSnapshot(api.collection(api.db, "goals"), (snapshot) => {
    goals = snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
    renderGoals();
    checkGoalReminders();
  });

  unsubscribeUsers = api.onSnapshot(api.collection(api.db, "users"), (snapshot) => {
    users = snapshot.docs.map((document) => ({ uid: document.id, ...document.data() }));
    currentProfile = users.find((user) => user.uid === currentUser?.uid) || currentProfile;
    checkGoalReminders();
  });

  unsubscribeClients = api.onSnapshot(api.collection(api.db, "clients"), (snapshot) => {
    clients = snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
    syncClientOptions();
  });
}

async function handleAuth(user) {
  currentUser = user;
  if (!user) {
    currentProfile = null;
    goals = [];
    users = [];
    unsubscribeGoals?.();
    unsubscribeUsers?.();
    unsubscribeClients?.();
    clearInterval(reminderTimer);
    return;
  }

  try {
    const profileSnapshot = await api.getDoc(api.doc(api.db, "users", user.uid));
    currentProfile = profileSnapshot.exists() ? { uid: user.uid, ...profileSnapshot.data() } : { uid: user.uid, name: user.email || "직원" };
    subscribeGoalData();
    clearInterval(reminderTimer);
    reminderTimer = window.setInterval(checkGoalReminders, 60 * 60 * 1000);
  } catch (error) {
    console.warn("목표일정 사용자 초기화 실패", error);
  }
}

function initializeGoals() {
  if (!api) return;
  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = new URL("../css/goals.css", import.meta.url).href;
  document.head.appendChild(stylesheet);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      createGoalPage();
      api.onAuthStateChanged(api.auth, handleAuth);
    }, { once: true });
  } else {
    createGoalPage();
    api.onAuthStateChanged(api.auth, handleAuth);
  }
}

initializeGoals();
