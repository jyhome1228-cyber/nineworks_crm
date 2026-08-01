const styleLink = document.createElement("link");
styleLink.rel = "stylesheet";
styleLink.href = new URL("../css/team-enhancements.css", import.meta.url).href;
document.head.appendChild(styleLink);

const api = window.NineworksFirebase;
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const uid = (prefix = "item") => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

let currentUser = null;
let currentProfile = null;
let users = [];
let notifications = [];
let requests = [];
let unsubscribeUsers = null;
let unsubscribeNotifications = null;
let unsubscribeRequests = null;
let eventOriginalAssignee = "";

const BASE_MEMBER_NAMES = ["박재영", "박상혁", "신민용"];
const STATUS_LABEL = {
  new: "새 요청",
  confirmed: "확인 완료",
  working: "작업 중",
  done: "완료"
};

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeName(value = "") {
  return String(value).replace(/\s+/g, "").trim();
}

function nameFromEmail(email = "") {
  const local = email.split("@")[0].toLowerCase();
  if (["admin", "owner", "jaeyoung", "parkjaeyoung", "jy", "jyhome"].some((key) => local.includes(key))) return "박재영";
  if (["sanghyuk", "parksanghyuk", "psh"].some((key) => local.includes(key))) return "박상혁";
  if (["minyong", "shinminyong", "smy"].some((key) => local.includes(key))) return "신민용";
  return "";
}

async function ensureUserProfile(user) {
  const ref = api.doc(api.db, "users", user.uid);
  const snapshot = await api.getDoc(ref);
  if (snapshot.exists()) return { uid: user.uid, ...snapshot.data() };

  const suggested = nameFromEmail(user.email || "");
  const entered = suggested || window.prompt("이 계정에서 사용할 이름을 입력해주세요.", user.email?.split("@")[0] || "직원");
  const name = String(entered || user.email?.split("@")[0] || "직원").trim();
  const profile = {
    uid: user.uid,
    name,
    email: user.email || "",
    role: name === "박재영" ? "owner" : "staff",
    active: true,
    createdAt: api.serverTimestamp(),
    updatedAt: api.serverTimestamp()
  };
  await api.setDoc(ref, profile, { merge: true });
  return profile;
}

function updateSignedInUser(profile) {
  if (!profile) return;
  const name = profile.name || "직원";
  const role = profile.role === "owner" ? "OWNER" : "STAFF";

  const headerName = $(".profile-button__text strong");
  const headerRole = $(".profile-button__text small");
  const avatar = $(".profile-button__avatar");
  if (headerName) headerName.textContent = name;
  if (headerRole) headerRole.textContent = role;
  if (avatar) avatar.textContent = name.slice(0, 1);

  const workspaceHeading = $("#mypagePage .page-heading h1");
  if (workspaceHeading) workspaceHeading.textContent = `${name} 님, 오늘의 업무 흐름입니다.`;

  const profileName = $(".profile-info h2");
  const profileRole = $(".profile-info > p:not(.eyebrow)");
  const profileAvatar = $(".profile-large-avatar");
  const profileEmail = $(".profile-info dl div:first-child dd");
  if (profileName) profileName.textContent = name;
  if (profileRole) profileRole.textContent = `${role} · NINEWORKS`;
  if (profileAvatar) profileAvatar.textContent = name.slice(0, 1);
  if (profileEmail) profileEmail.textContent = profile.email || "-";
}

function memberNames() {
  const names = new Set(BASE_MEMBER_NAMES);
  users.filter((user) => user.active !== false).forEach((user) => user.name && names.add(user.name));
  return [...names];
}

function replaceSelectOptions(select, values, firstOption = null) {
  if (!select) return;
  const selected = select.value;
  const options = [];
  if (firstOption) options.push(`<option value="${escapeHtml(firstOption.value)}">${escapeHtml(firstOption.label)}</option>`);
  values.forEach((value) => options.push(`<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`));
  select.innerHTML = options.join("");
  if ([...select.options].some((option) => option.value === selected)) select.value = selected;
}

function renderMemberOptions() {
  const names = memberNames();
  replaceSelectOptions($("#eventMember"), names);
  replaceSelectOptions($("#requestAssignee"), [...names, "미지정"]);
  replaceSelectOptions($("#memberFilter"), names, { value: "all", label: "전체 담당자" });
}

function findUserByName(name) {
  const normalized = normalizeName(name);
  return users.find((user) => normalizeName(user.name) === normalized) || null;
}

async function createAssignmentNotification({ recipientName, title, message, relatedType, relatedId = "" }) {
  if (!currentUser || !currentProfile || !recipientName) return;
  if (normalizeName(recipientName) === normalizeName(currentProfile.name)) return;

  const recipient = findUserByName(recipientName);
  const notification = {
    id: uid("notification"),
    recipientUid: recipient?.uid || "",
    recipientName,
    actorUid: currentUser.uid,
    actorName: currentProfile.name || currentUser.email || "나인웍스",
    title,
    message,
    relatedType,
    relatedId,
    read: false,
    createdAt: api.serverTimestamp()
  };

  await api.setDoc(api.doc(api.db, "notifications", notification.id), notification);
}

function bindAssignmentNotifications() {
  const drawer = $("#eventDrawer");
  const eventForm = $("#eventForm");
  const requestForm = $("#requestForm");
  if (!drawer || !eventForm || !requestForm) return;

  new MutationObserver(() => {
    if (!drawer.classList.contains("is-open")) return;
    window.setTimeout(() => {
      eventOriginalAssignee = $("#eventId")?.value ? ($("#eventMember")?.value || "") : "";
    }, 80);
  }).observe(drawer, { attributes: true, attributeFilter: ["class"] });

  eventForm.addEventListener("submit", () => {
    const recipientName = $("#eventMember")?.value || "";
    const title = $("#eventTitle")?.value.trim() || "새 일정";
    const client = $("#eventClient")?.value || "나인웍스";
    const eventId = $("#eventId")?.value || "";
    if (!recipientName || normalizeName(recipientName) === normalizeName(eventOriginalAssignee)) return;

    window.setTimeout(() => {
      createAssignmentNotification({
        recipientName,
        title: "새 일정이 배정되었습니다.",
        message: `${client} · ${title}`,
        relatedType: "event",
        relatedId: eventId
      }).catch((error) => console.warn("일정 알림 저장 실패", error));
    }, 450);
  }, true);

  requestForm.addEventListener("submit", () => {
    const recipientName = $("#requestAssignee")?.value || "";
    const title = $("#requestTitle")?.value.trim() || "새 요청";
    const client = $("#requestClient")?.value || "나인웍스";
    if (!recipientName || recipientName === "미지정") return;

    window.setTimeout(() => {
      createAssignmentNotification({
        recipientName,
        title: "새 요청사항이 배정되었습니다.",
        message: `${client} · ${title}`,
        relatedType: "request"
      }).catch((error) => console.warn("요청 알림 저장 실패", error));
    }, 450);
  }, true);
}

function createNotificationPanel() {
  if ($("#notificationPanel")) return;
  const panel = document.createElement("section");
  panel.id = "notificationPanel";
  panel.className = "notification-panel";
  panel.hidden = true;
  panel.innerHTML = `
    <div class="notification-panel__head">
      <div><p class="eyebrow">NOTIFICATIONS</p><h2>알림</h2></div>
      <button id="markAllNotifications" class="text-button" type="button">모두 읽음</button>
    </div>
    <div id="notificationList" class="notification-list"></div>
  `;
  document.body.appendChild(panel);

  const button = $("#notificationButton");
  if (button && !$("#notificationCount", button)) {
    const count = document.createElement("span");
    count.id = "notificationCount";
    count.className = "notification-count";
    count.hidden = true;
    button.appendChild(count);
  }

  button?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    panel.hidden = !panel.hidden;
  }, true);

  document.addEventListener("click", (event) => {
    if (panel.hidden || panel.contains(event.target) || button?.contains(event.target)) return;
    panel.hidden = true;
  });

  $("#markAllNotifications")?.addEventListener("click", async () => {
    const mine = getMyNotifications().filter((item) => !item.read);
    await Promise.all(mine.map((item) => api.setDoc(api.doc(api.db, "notifications", item.id), { read: true }, { merge: true })));
  });
}

function getMyNotifications() {
  if (!currentUser || !currentProfile) return [];
  return notifications
    .filter((item) => item.recipientUid === currentUser.uid || (!item.recipientUid && normalizeName(item.recipientName) === normalizeName(currentProfile.name)))
    .sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });
}

function renderNotifications() {
  const list = $("#notificationList");
  const count = $("#notificationCount");
  if (!list || !count) return;
  const mine = getMyNotifications();
  const unread = mine.filter((item) => !item.read).length;

  count.textContent = unread > 99 ? "99+" : String(unread);
  count.hidden = unread === 0;
  const statusDot = $("#notificationButton .status-dot");
  if (statusDot) statusDot.hidden = unread === 0;

  list.innerHTML = mine.length
    ? mine.slice(0, 30).map((item) => `
      <button class="notification-item ${item.read ? "is-read" : ""}" type="button" data-notification-id="${escapeHtml(item.id)}">
        <span class="notification-item__dot"></span>
        <span class="notification-item__body">
          <strong>${escapeHtml(item.title || "새 알림")}</strong>
          <small>${escapeHtml(item.message || "")}</small>
          <em>${escapeHtml(item.actorName || "나인웍스")}</em>
        </span>
      </button>
    `).join("")
    : '<p class="notification-empty">새로운 알림이 없습니다.</p>';
}

function bindNotificationItems() {
  document.addEventListener("click", async (event) => {
    const item = event.target.closest("[data-notification-id]");
    if (!item) return;
    const id = item.dataset.notificationId;
    await api.setDoc(api.doc(api.db, "notifications", id), { read: true }, { merge: true });
  });
}

function createSimpleRequestBoard() {
  const original = $("#requestsPage .request-board");
  if (!original || $("#simpleRequestBoard")) return;
  original.hidden = true;

  const section = document.createElement("section");
  section.id = "simpleRequestBoard";
  section.className = "simple-request-board";
  section.innerHTML = `
    <div class="simple-request-section">
      <div class="simple-request-heading">
        <div><p class="eyebrow">IN PROGRESS</p><h2>진행 중 요청</h2></div>
        <span id="activeRequestCount" class="count-badge">0</span>
      </div>
      <div id="activeRequestList" class="simple-request-list"></div>
    </div>
    <div class="simple-request-section simple-request-section--completed">
      <div class="simple-request-heading">
        <div><p class="eyebrow">COMPLETED</p><h2>완료된 요청</h2></div>
        <span id="completedRequestCount" class="count-badge">0</span>
      </div>
      <div id="simpleCompletedRequestList" class="simple-request-list"></div>
    </div>
  `;
  original.insertAdjacentElement("afterend", section);
}

function requestRow(item, completed = false) {
  return `
    <article class="simple-request-item ${completed ? "is-completed" : ""}">
      <div class="simple-request-item__status"><span>${escapeHtml(STATUS_LABEL[item.status] || "진행 중")}</span></div>
      <div class="simple-request-item__body">
        <small>${escapeHtml(item.client || "나인웍스")}</small>
        <h3>${escapeHtml(item.title || "요청사항")}</h3>
        <p>${escapeHtml(item.content || "")}</p>
      </div>
      <div class="simple-request-item__meta">
        <span>담당 ${escapeHtml(item.assignee || "미지정")}</span>
        <span>${escapeHtml(item.due || "")}</span>
      </div>
      <div class="simple-request-item__actions">
        ${!completed ? `<button class="button button--ghost" type="button" data-request-schedule="${escapeHtml(item.id)}">일정에 추가</button>` : ""}
        ${!completed ? `<button class="button button--primary" type="button" data-simple-complete="${escapeHtml(item.id)}">완료</button>` : `<button class="text-button" type="button" data-simple-reopen="${escapeHtml(item.id)}">다시 열기</button>`}
      </div>
    </article>
  `;
}

function renderSimpleRequests() {
  createSimpleRequestBoard();
  const active = requests.filter((item) => item.status !== "done");
  const completed = requests.filter((item) => item.status === "done");
  const activeList = $("#activeRequestList");
  const completedList = $("#simpleCompletedRequestList");
  if (!activeList || !completedList) return;

  $("#activeRequestCount").textContent = active.length;
  $("#completedRequestCount").textContent = completed.length;
  activeList.innerHTML = active.length ? active.map((item) => requestRow(item)).join("") : '<p class="simple-empty">진행 중인 요청이 없습니다.</p>';
  completedList.innerHTML = completed.length ? completed.map((item) => requestRow(item, true)).join("") : '<p class="simple-empty">완료된 요청이 없습니다.</p>';
}

function bindSimpleRequestActions() {
  document.addEventListener("click", async (event) => {
    const complete = event.target.closest("[data-simple-complete]");
    const reopen = event.target.closest("[data-simple-reopen]");
    const id = complete?.dataset.simpleComplete || reopen?.dataset.simpleReopen;
    if (!id) return;
    const item = requests.find((request) => request.id === id);
    if (!item) return;
    const status = complete ? "done" : "working";
    await api.setDoc(api.doc(api.db, "requests", id), { status, updatedAt: api.serverTimestamp() }, { merge: true });
  });
}

function subscribeTeamData() {
  unsubscribeUsers?.();
  unsubscribeNotifications?.();
  unsubscribeRequests?.();

  unsubscribeUsers = api.onSnapshot(api.collection(api.db, "users"), (snapshot) => {
    users = snapshot.docs.map((item) => ({ uid: item.id, ...item.data() }));
    currentProfile = users.find((item) => item.uid === currentUser?.uid) || currentProfile;
    renderMemberOptions();
    updateSignedInUser(currentProfile);
    renderNotifications();
  });

  unsubscribeNotifications = api.onSnapshot(api.collection(api.db, "notifications"), (snapshot) => {
    notifications = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    renderNotifications();
  });

  unsubscribeRequests = api.onSnapshot(api.collection(api.db, "requests"), (snapshot) => {
    requests = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    renderSimpleRequests();
  });
}

async function handleAuth(user) {
  currentUser = user;
  if (!user) {
    currentProfile = null;
    users = [];
    notifications = [];
    unsubscribeUsers?.();
    unsubscribeNotifications?.();
    unsubscribeRequests?.();
    renderNotifications();
    return;
  }

  try {
    currentProfile = await ensureUserProfile(user);
    updateSignedInUser(currentProfile);
    subscribeTeamData();
  } catch (error) {
    console.warn("사용자 프로필 초기화 실패", error);
  }
}

function initializeTeamEnhancements() {
  if (!api) {
    console.warn("Nineworks Firebase API를 찾을 수 없습니다.");
    return;
  }
  createNotificationPanel();
  createSimpleRequestBoard();
  bindNotificationItems();
  bindAssignmentNotifications();
  bindSimpleRequestActions();
  renderMemberOptions();
  api.onAuthStateChanged(api.auth, handleAuth);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeTeamEnhancements, { once: true });
} else {
  initializeTeamEnhancements();
}
