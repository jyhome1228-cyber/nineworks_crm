const api = window.NineworksFirebase;

const CORE_MEMBER_ORDER = ["박재영", "박상혁", "박지완"];
const CORE_MEMBER_KEYS = new Set(CORE_MEMBER_ORDER.map((name) => name.replace(/\s+/g, "").toLowerCase()));

let currentUser = null;
let currentUserName = "";
let members = [];
let unsubscribeMembers = null;
let renderQueued = false;

const SELECT_CONFIGS = [
  { selector: "#eventMember", includeAll: false, includeUnassigned: false },
  { selector: "#requestAssignee", includeAll: false, includeUnassigned: true },
  { selector: "#memberFilter", includeAll: true, includeUnassigned: false },
  { selector: "#goalAssignee", includeAll: false, includeUnassigned: false }
];

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizedName(value = "") {
  return String(value).replace(/\s+/g, "").trim().toLowerCase();
}

function activeMemberNames() {
  const unique = new Map();

  members
    .filter((member) => member.active !== false && member.name && CORE_MEMBER_KEYS.has(normalizedName(member.name)))
    .forEach((member) => {
      const name = String(member.name).trim();
      const key = normalizedName(name);
      if (key && !unique.has(key)) unique.set(key, name);
    });

  if (currentUserName && CORE_MEMBER_KEYS.has(normalizedName(currentUserName))) {
    const key = normalizedName(currentUserName);
    if (key && !unique.has(key)) unique.set(key, currentUserName);
  }

  return CORE_MEMBER_ORDER
    .map((preferred) => unique.get(normalizedName(preferred)))
    .filter(Boolean);
}

function optionMarkup(value, label = value, disabled = false) {
  return `<option value="${escapeHtml(value)}"${disabled ? " disabled" : ""}>${escapeHtml(label)}</option>`;
}

function expectedOptions(config, names) {
  const options = [];
  if (config.includeAll) options.push({ value: "all", label: "전체 담당자" });
  names.forEach((name) => options.push({ value: name, label: name }));
  if (config.includeUnassigned) options.push({ value: "미지정", label: "미지정" });
  if (!options.length) options.push({ value: "", label: "연결된 담당자가 없습니다", disabled: true });
  return options;
}

function optionsMatch(select, options) {
  const current = [...select.options];
  return current.length === options.length && current.every((option, index) => (
    option.value === options[index].value
    && option.textContent === options[index].label
    && option.disabled === Boolean(options[index].disabled)
  ));
}

function updateSelect(config, names) {
  const select = document.querySelector(config.selector);
  if (!select) return;

  const previous = select.value;
  const options = expectedOptions(config, names);
  if (!optionsMatch(select, options)) {
    select.innerHTML = options
      .map((option) => optionMarkup(option.value, option.label, option.disabled))
      .join("");
  }

  const available = options.map((option) => option.value);
  if (available.includes(previous)) {
    select.value = previous;
    return;
  }

  if (config.includeAll) {
    select.value = "all";
    return;
  }

  if (config.includeUnassigned && previous === "미지정") {
    select.value = "미지정";
    return;
  }

  select.value = available.includes(currentUserName)
    ? currentUserName
    : (names[0] || (config.includeUnassigned ? "미지정" : ""));
}

function renderMemberRoster() {
  renderQueued = false;
  const names = activeMemberNames();
  SELECT_CONFIGS.forEach((config) => updateSelect(config, names));
  window.dispatchEvent(new CustomEvent("nineworks:members-updated", {
    detail: { names, members: members.filter((member) => names.includes(member.name)).map((member) => ({ ...member })) }
  }));
}

function queueRosterRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(renderMemberRoster);
}

async function loadCurrentUserName(user) {
  currentUserName = "";
  if (!user) return;
  try {
    const snapshot = await api.getDoc(api.doc(api.db, "users", user.uid));
    if (snapshot.exists()) currentUserName = String(snapshot.data()?.name || "").trim();
  } catch (error) {
    console.warn("현재 팀원 이름 불러오기 실패", error);
  }
}

function subscribeMemberRoster(user) {
  unsubscribeMembers?.();
  unsubscribeMembers = null;
  members = [];

  if (!user) {
    queueRosterRender();
    return;
  }

  unsubscribeMembers = api.onSnapshot(
    api.collection(api.db, "users"),
    (snapshot) => {
      members = snapshot.docs.map((document) => ({ uid: document.id, ...document.data() }));
      queueRosterRender();
    },
    (error) => console.warn("가입 팀원 목록 불러오기 실패", error)
  );
}

function installDomGuard() {
  const observer = new MutationObserver((mutations) => {
    const shouldRender = mutations.some((mutation) => {
      const target = mutation.target instanceof Element ? mutation.target : mutation.target.parentElement;
      if (!target) return false;
      return SELECT_CONFIGS.some(({ selector }) => target.matches?.(selector) || target.closest?.(selector));
    });
    if (shouldRender) queueRosterRender();
  });

  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener("nineworks:member-roster-refresh", queueRosterRender);
  window.setInterval(queueRosterRender, 1800);
}

function initializeDynamicMemberRoster() {
  if (!api?.auth || !api?.db) return;
  installDomGuard();

  api.onAuthStateChanged(api.auth, async (user) => {
    currentUser = user;
    await loadCurrentUserName(user);
    subscribeMemberRoster(user);
    queueRosterRender();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeDynamicMemberRoster, { once: true });
} else {
  initializeDynamicMemberRoster();
}
