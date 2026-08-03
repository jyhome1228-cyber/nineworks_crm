const reminderStyle = document.createElement("link");
reminderStyle.rel = "stylesheet";
reminderStyle.href = new URL("../css/browser-reminders.css?v=20260803-2", import.meta.url).href;
document.head.appendChild(reminderStyle);

const api = window.NineworksFirebase;
const LEGACY_ENABLED_KEY = "nineworks_browser_reminders_enabled_v1";
const SETTINGS_PREFIX = "nineworks_personal_reminder_settings_v2_";
const SENT_PREFIX = "nineworks_browser_reminders_sent_v2_";
const CHECK_INTERVAL = 15000;
const MAX_LATE_MS = 5 * 60 * 1000;

const DEFAULT_SETTINGS = {
  enabled: false,
  soundEnabled: true,
  onlyAssigned: false,
  defaultOffsets: [10, 0],
  allDayTime: "09:00",
  eventOverrides: {}
};

let settings = { ...DEFAULT_SETTINGS };
let events = [];
let currentUser = null;
let currentProfileName = "";
let unsubscribeEvents = null;
let reminderTimer = null;
let lastCheckAt = Date.now() - CHECK_INTERVAL;
let serviceWorkerRegistration = null;
let audioContext = null;
const listeners = new Set();

function normalizeSettings(value = {}) {
  const offsets = Array.isArray(value.defaultOffsets)
    ? [...new Set(value.defaultOffsets.map(Number).filter((item) => Number.isFinite(item) && item >= 0))]
    : DEFAULT_SETTINGS.defaultOffsets;
  return {
    enabled: value.enabled === true,
    soundEnabled: value.soundEnabled !== false,
    onlyAssigned: value.onlyAssigned === true,
    defaultOffsets: offsets.length ? offsets.sort((a, b) => b - a) : [0],
    allDayTime: /^([01]\d|2[0-3]):[0-5]\d$/.test(value.allDayTime || "") ? value.allDayTime : "09:00",
    eventOverrides: value.eventOverrides && typeof value.eventOverrides === "object" ? value.eventOverrides : {}
  };
}

function settingsKey(uid = currentUser?.uid || "guest") {
  return `${SETTINGS_PREFIX}${uid}`;
}

function sentKey(uid = currentUser?.uid || "guest") {
  return `${SENT_PREFIX}${uid}`;
}

function readLocalSettings(uid) {
  try {
    return normalizeSettings(JSON.parse(localStorage.getItem(settingsKey(uid)) || "{}"));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function writeLocalSettings() {
  localStorage.setItem(settingsKey(), JSON.stringify(settings));
}

function stateSnapshot() {
  return {
    settings: structuredClone(settings),
    events: events.map((event) => ({ ...event })),
    currentUser,
    currentProfileName,
    permission: "Notification" in window ? Notification.permission : "unsupported"
  };
}

function publishState() {
  const detail = stateSnapshot();
  listeners.forEach((listener) => {
    try { listener(detail); } catch (error) { console.warn("알림 상태 구독 오류", error); }
  });
  window.dispatchEvent(new CustomEvent("nineworks:reminder-state", { detail }));
  updateReminderPanel();
}

async function loadPersonalSettings(user) {
  currentProfileName = "";
  const local = readLocalSettings(user.uid);
  let remote = {};
  try {
    const snapshot = await api.getDoc(api.doc(api.db, "users", user.uid));
    if (snapshot.exists()) {
      const profile = snapshot.data();
      currentProfileName = profile.name || "";
      remote = profile.reminderSettings || {};
    }
  } catch (error) {
    console.warn("개인 알림 설정 불러오기 실패", error);
  }

  const legacyEnabled = localStorage.getItem(LEGACY_ENABLED_KEY) === "true";
  settings = normalizeSettings({
    ...DEFAULT_SETTINGS,
    ...local,
    ...remote,
    enabled: remote.enabled ?? local.enabled ?? legacyEnabled
  });
  writeLocalSettings();
  publishState();
}

async function savePersonalSettings(patch = {}, persistRemote = true) {
  settings = normalizeSettings({
    ...settings,
    ...patch,
    eventOverrides: patch.eventOverrides || settings.eventOverrides
  });
  writeLocalSettings();
  localStorage.setItem(LEGACY_ENABLED_KEY, settings.enabled ? "true" : "false");
  publishState();
  syncReminderTimer();

  if (persistRemote && currentUser) {
    try {
      await api.setDoc(api.doc(api.db, "users", currentUser.uid), {
        reminderSettings: settings,
        updatedAt: api.serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.warn("개인 알림 설정 저장 실패", error);
    }
  }
  return stateSnapshot();
}

function getEventOverride(eventId) {
  return settings.eventOverrides?.[eventId] || null;
}

function effectiveEventConfig(event) {
  const override = getEventOverride(event.id);
  if (override) {
    return {
      enabled: override.enabled !== false,
      offsets: Array.isArray(override.offsets) ? override.offsets.map(Number) : settings.defaultOffsets,
      source: "personal"
    };
  }
  if (event.reminderEnabled === false) return { enabled: false, offsets: [], source: "schedule" };
  if (Array.isArray(event.reminderOffsets)) {
    return { enabled: true, offsets: event.reminderOffsets.map(Number), source: "schedule" };
  }
  return { enabled: true, offsets: settings.defaultOffsets, source: "default" };
}

async function setEventOverride(eventId, override) {
  if (!eventId) return;
  const next = { ...settings.eventOverrides };
  next[eventId] = {
    enabled: override.enabled !== false,
    offsets: [...new Set((override.offsets || settings.defaultOffsets).map(Number).filter((item) => Number.isFinite(item) && item >= 0))]
      .sort((a, b) => b - a)
  };
  await savePersonalSettings({ eventOverrides: next });
}

async function resetEventOverride(eventId) {
  const next = { ...settings.eventOverrides };
  delete next[eventId];
  await savePersonalSettings({ eventOverrides: next });
}

function isGloballyEnabled() {
  return settings.enabled === true;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatTime(date) {
  const hour = date.getHours();
  const minute = pad(date.getMinutes());
  const period = hour < 12 ? "오전" : "오후";
  return `${period} ${hour % 12 || 12}:${minute}`;
}

function eventStartDate(event) {
  if (!event?.start) return null;
  const allDay = event.allDay !== false && !event.startTime;
  const time = allDay ? settings.allDayTime : (event.startTime || "09:00");
  const value = new Date(`${event.start}T${time}:00`);
  return Number.isNaN(value.getTime()) ? null : value;
}

function reminderOffsets(event) {
  const config = effectiveEventConfig(event);
  return config.enabled
    ? [...new Set(config.offsets.map(Number).filter((value) => Number.isFinite(value) && value >= 0))]
    : [];
}

function shouldNotifyEvent(event) {
  if (!event?.id || event.status === "done") return false;
  if (!settings.onlyAssigned || !currentProfileName) return true;
  return String(event.member || "").replace(/\s+/g, "") === currentProfileName.replace(/\s+/g, "");
}

function showWorkspaceToast(message) {
  const toast = document.querySelector("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

async function ensureServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  if (serviceWorkerRegistration) return serviceWorkerRegistration;
  try {
    serviceWorkerRegistration = await navigator.serviceWorker.register("./notification-sw.js?v=20260803-2");
    return serviceWorkerRegistration;
  } catch (error) {
    console.warn("알림 서비스 워커 등록 실패", error);
    return null;
  }
}

async function unlockAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return false;
  if (!audioContext) audioContext = new AudioContextClass();
  if (audioContext.state === "suspended") {
    try { await audioContext.resume(); } catch { return false; }
  }
  return audioContext.state === "running";
}

async function playChime() {
  if (!settings.enabled || !settings.soundEnabled) return;
  const ready = await unlockAudio();
  if (!ready || !audioContext) return;
  const now = audioContext.currentTime;
  const gain = audioContext.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.17, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.72);
  gain.connect(audioContext.destination);
  [659.25, 880].forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, now + index * 0.18);
    oscillator.connect(gain);
    oscillator.start(now + index * 0.18);
    oscillator.stop(now + 0.62 + index * 0.08);
  });
}

async function displayNotification(event, offset, isTest = false) {
  const start = eventStartDate(event) || new Date();
  const meetingPrefix = event.category === "미팅" ? "★ " : "";
  const timing = isTest
    ? "알림과 소리가 정상적으로 작동합니다."
    : offset > 0 ? `${offset}분 뒤 시작 · ${formatTime(start)}` : `일정 시작 · ${formatTime(start)}`;
  const title = isTest ? "NINEWORKS CRM 테스트 알림" : `${meetingPrefix}${event.title || "업무 일정"}`;
  const options = {
    body: [timing, [event.client, event.member].filter(Boolean).join(" · ")].filter(Boolean).join("\n"),
    icon: "https://9workscrm.cloud/assets/favicon.svg?v=20260803",
    badge: "https://9workscrm.cloud/assets/favicon.svg?v=20260803",
    tag: isTest ? `nineworks-test-${Date.now()}` : `nineworks-${event.id}-${offset}-${start.getTime()}`,
    renotify: true,
    timestamp: Date.now(),
    data: { eventId: isTest ? "" : event.id || "" }
  };

  await playChime();
  try {
    const registration = await ensureServiceWorker();
    if (registration) await registration.showNotification(title, options);
    else if ("Notification" in window && Notification.permission === "granted") {
      const notification = new Notification(title, options);
      notification.onclick = () => {
        window.focus();
        if (event.id) openEventDrawerById(event.id);
        notification.close();
      };
    }
  } catch (error) {
    console.warn("브라우저 알림 표시 실패", error);
  }
  showWorkspaceToast(isTest ? "테스트 알림을 보냈습니다." : `${event.title || "일정"} 알림을 보냈습니다.`);
}

function getSentMap() {
  try { return JSON.parse(localStorage.getItem(sentKey()) || "{}") || {}; } catch { return {}; }
}

function saveSentMap(map) {
  const cutoff = Date.now() - 14 * 86400000;
  Object.keys(map).forEach((key) => { if (Number(map[key]) < cutoff) delete map[key]; });
  localStorage.setItem(sentKey(), JSON.stringify(map));
}

function checkDueReminders() {
  if (!settings.enabled || !("Notification" in window) || Notification.permission !== "granted") {
    lastCheckAt = Date.now();
    return;
  }
  const now = Date.now();
  const windowStart = Math.max(lastCheckAt - 1000, now - MAX_LATE_MS);
  const sent = getSentMap();
  events.forEach((event) => {
    if (!shouldNotifyEvent(event)) return;
    const start = eventStartDate(event);
    if (!start) return;
    reminderOffsets(event).forEach((offset) => {
      const target = start.getTime() - offset * 60000;
      const key = `${event.id}:${target}:${offset}`;
      if (sent[key]) return;
      if (target > windowStart && target <= now) {
        sent[key] = now;
        displayNotification(event, offset).catch((error) => console.warn("일정 알림 실패", error));
      }
    });
  });
  saveSentMap(sent);
  lastCheckAt = now;
}

function startReminderTimer() {
  if (reminderTimer) return;
  lastCheckAt = Date.now() - CHECK_INTERVAL;
  reminderTimer = window.setInterval(checkDueReminders, CHECK_INTERVAL);
}

function stopReminderTimer() {
  if (reminderTimer) window.clearInterval(reminderTimer);
  reminderTimer = null;
}

function syncReminderTimer() {
  if (currentUser && settings.enabled) startReminderTimer();
  else stopReminderTimer();
}

function subscribeEvents() {
  unsubscribeEvents?.();
  unsubscribeEvents = null;
  events = [];
  if (!currentUser) {
    publishState();
    return;
  }
  unsubscribeEvents = api.onSnapshot(
    api.collection(api.db, "events"),
    (snapshot) => {
      events = snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
      publishState();
      checkDueReminders();
    },
    (error) => console.warn("알림 일정 불러오기 실패", error)
  );
}

function createReminderPanel() {
  if (document.querySelector("#browserReminderPanel")) return;
  const panel = document.createElement("section");
  panel.id = "browserReminderPanel";
  panel.className = "nw-reminder-panel";
  panel.hidden = true;
  panel.innerHTML = `
    <div class="nw-reminder-panel__head">
      <div><p class="eyebrow">PERSONAL REMINDER</p><h3>내 업무 알림</h3></div>
      <span id="browserReminderStatus" class="nw-reminder-status">꺼짐</span>
    </div>
    <p class="nw-reminder-panel__description">이 계정의 알림과 소리, 일정별 알림 시간을 관리합니다.</p>
    <p id="browserReminderNotice" class="nw-reminder-panel__notice"></p>
    <div class="nw-reminder-panel__actions">
      <button id="toggleBrowserReminder" class="button button--primary" type="button">알림 켜기</button>
      <button id="testBrowserReminder" class="button button--ghost" type="button">테스트</button>
      <button id="openReminderSettings" class="button button--ghost" type="button">알림 관리</button>
    </div>`;
  document.body.appendChild(panel);
  document.querySelector("#toggleBrowserReminder")?.addEventListener("click", toggleBrowserReminders);
  document.querySelector("#testBrowserReminder")?.addEventListener("click", sendTestReminder);
  document.querySelector("#openReminderSettings")?.addEventListener("click", () => {
    panel.hidden = true;
    window.dispatchEvent(new CustomEvent("nineworks:open-reminder-settings"));
  });
  updateReminderPanel();
}

function positionReminderPanel() {
  const button = document.querySelector("#notificationButton");
  const panel = document.querySelector("#browserReminderPanel");
  if (!button || !panel) return;
  const rect = button.getBoundingClientRect();
  const width = Math.min(390, window.innerWidth - 24);
  panel.style.top = `${rect.bottom + 10}px`;
  panel.style.left = `${Math.max(12, Math.min(window.innerWidth - width - 12, rect.right - width))}px`;
}

function setPanelNotice(message, isError = false) {
  const notice = document.querySelector("#browserReminderNotice");
  if (!notice) return;
  notice.textContent = message;
  notice.classList.toggle("is-error", isError);
}

function updateReminderPanel() {
  const permission = "Notification" in window ? Notification.permission : "unsupported";
  const enabled = settings.enabled && permission === "granted";
  const status = document.querySelector("#browserReminderStatus");
  const toggle = document.querySelector("#toggleBrowserReminder");
  const test = document.querySelector("#testBrowserReminder");
  const bell = document.querySelector("#notificationButton");
  status?.classList.toggle("is-on", enabled);
  if (status) status.textContent = enabled ? "켜짐" : "꺼짐";
  if (toggle) toggle.textContent = enabled ? "알림 끄기" : "알림 켜기";
  if (test) test.disabled = !enabled;
  bell?.classList.toggle("is-reminder-enabled", enabled);
  if (permission === "denied") setPanelNotice("크롬에서 알림이 차단되어 있습니다. 사이트 설정에서 허용해주세요.", true);
  else if (enabled) setPanelNotice(`${settings.onlyAssigned ? "내 담당 일정만" : "전체 일정"} · ${settings.soundEnabled ? "소리 켜짐" : "소리 꺼짐"}`);
  else setPanelNotice("알림을 켜고 상세 설정에서 일정별 시간을 선택하세요.");
}

async function requestEnableReminders() {
  if (!("Notification" in window)) throw new Error("이 브라우저에서는 시스템 알림을 지원하지 않습니다.");
  const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") {
    await savePersonalSettings({ enabled: false });
    throw new Error("크롬 알림 권한이 허용되지 않았습니다.");
  }
  await ensureServiceWorker();
  await unlockAudio();
  await savePersonalSettings({ enabled: true });
  return true;
}

async function toggleBrowserReminders() {
  try {
    if (settings.enabled && Notification.permission === "granted") {
      await savePersonalSettings({ enabled: false });
      showWorkspaceToast("내 업무 알림을 껐습니다.");
    } else {
      await requestEnableReminders();
      showWorkspaceToast("내 업무 알림을 켰습니다.");
    }
  } catch (error) {
    setPanelNotice(error.message, true);
  }
}

async function sendTestReminder() {
  if (!settings.enabled || Notification.permission !== "granted") return;
  await unlockAudio();
  const now = new Date();
  await displayNotification({
    id: "", title: "알림 테스트", client: "NINEWORKS CRM", member: currentProfileName || "정상 작동 중",
    start: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    startTime: `${pad(now.getHours())}:${pad(now.getMinutes())}`, allDay: false
  }, 0, true);
}

function bindNotificationButton() {
  const button = document.querySelector("#notificationButton");
  if (!button || button.dataset.reminderV2Ready === "true") return;
  button.dataset.reminderV2Ready = "true";
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const panel = document.querySelector("#browserReminderPanel");
    if (!panel) return;
    panel.hidden = !panel.hidden;
    if (!panel.hidden) { positionReminderPanel(); updateReminderPanel(); }
  }, true);
  document.addEventListener("click", (event) => {
    const panel = document.querySelector("#browserReminderPanel");
    if (!panel || panel.hidden || panel.contains(event.target) || button.contains(event.target)) return;
    panel.hidden = true;
  });
  window.addEventListener("resize", positionReminderPanel, { passive: true });
}

function ensureEventReminderControls() {
  const form = document.querySelector("#eventForm");
  if (!form || document.querySelector("#eventReminderSection")) return;
  const section = document.createElement("div");
  section.id = "eventReminderSection";
  section.className = "nw-event-reminder-section";
  section.innerHTML = `
    <div class="nw-event-reminder-section__head">
      <span>내 일정 알림</span>
      <label class="nw-reminder-master"><input id="eventReminderEnabled" type="checkbox" checked /><span>알림 사용</span></label>
    </div>
    <div id="eventReminderOptions" class="nw-event-reminder-options">
      <label class="nw-event-reminder-option"><input type="checkbox" name="eventReminderOffset" value="60" /><span>1시간 전</span></label>
      <label class="nw-event-reminder-option"><input type="checkbox" name="eventReminderOffset" value="30" /><span>30분 전</span></label>
      <label class="nw-event-reminder-option"><input type="checkbox" name="eventReminderOffset" value="10" checked /><span>10분 전</span></label>
      <label class="nw-event-reminder-option"><input type="checkbox" name="eventReminderOffset" value="0" checked /><span>시작 시간</span></label>
    </div>
    <p class="nw-event-reminder-help">이 설정은 현재 로그인한 내 계정에만 적용됩니다.</p>`;
  const timeSection = document.querySelector("#eventTimeSection");
  const statusField = document.querySelector("#eventStatus")?.closest(".field");
  if (timeSection) timeSection.insertAdjacentElement("afterend", section);
  else if (statusField) statusField.insertAdjacentElement("beforebegin", section);
  else form.appendChild(section);
  document.querySelector("#eventReminderEnabled")?.addEventListener("change", syncEventReminderOptions);
  form.addEventListener("submit", persistPersonalEventReminder, true);
  syncEventReminderOptions();
}

function syncEventReminderOptions() {
  const enabled = document.querySelector("#eventReminderEnabled")?.checked ?? true;
  document.querySelector("#eventReminderOptions")?.classList.toggle("is-disabled", !enabled);
}

function setEventReminderControls(eventId, eventData = {}) {
  ensureEventReminderControls();
  const config = eventId ? effectiveEventConfig({ id: eventId, ...eventData }) : { enabled: true, offsets: settings.defaultOffsets };
  const enabledInput = document.querySelector("#eventReminderEnabled");
  if (enabledInput) enabledInput.checked = config.enabled;
  document.querySelectorAll('input[name="eventReminderOffset"]').forEach((input) => {
    input.checked = config.offsets.includes(Number(input.value));
  });
  syncEventReminderOptions();
}

async function populateEventReminderControls(id) {
  if (!id || !currentUser) { setEventReminderControls("", {}); return; }
  const found = events.find((event) => event.id === id);
  if (found) { setEventReminderControls(id, found); return; }
  try {
    const snapshot = await api.getDoc(api.doc(api.db, "events", id));
    setEventReminderControls(id, snapshot.exists() ? snapshot.data() : {});
  } catch { setEventReminderControls(id, {}); }
}

function persistPersonalEventReminder(event) {
  const idInput = document.querySelector("#eventId");
  if (!currentUser || !idInput) return;
  if (!idInput.value) idInput.value = `event_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const enabled = document.querySelector("#eventReminderEnabled")?.checked ?? true;
  const offsets = [...document.querySelectorAll('input[name="eventReminderOffset"]:checked')].map((input) => Number(input.value));
  setEventOverride(idInput.value, { enabled, offsets }).catch((error) => console.warn("개인 일정 알림 저장 실패", error));
}

async function openEventDrawerById(id) {
  if (!id || !currentUser) return;
  try {
    const snapshot = await api.getDoc(api.doc(api.db, "events", id));
    if (!snapshot.exists()) return;
    const data = snapshot.data();
    const values = {
      eventId: id, eventTitle: data.title || "", eventClient: data.client || "", eventCategory: data.category || "",
      eventMember: data.member || "", eventStart: data.start || "", eventEnd: data.end || data.start || "",
      eventStatus: data.status || "planned", eventMemo: data.memo || "", eventLink: data.link || ""
    };
    Object.entries(values).forEach(([key, value]) => { const input = document.getElementById(key); if (input) input.value = value; });
    const allDay = data.allDay !== false && !data.startTime;
    const allDayInput = document.querySelector("#eventAllDay");
    const startTimeInput = document.querySelector("#eventStartTime");
    const endTimeInput = document.querySelector("#eventEndTime");
    if (allDayInput) allDayInput.checked = allDay;
    if (startTimeInput) { startTimeInput.value = data.startTime || ""; startTimeInput.disabled = allDay; }
    if (endTimeInput) { endTimeInput.value = data.endTime || ""; endTimeInput.disabled = allDay; }
    document.querySelector("#deleteEventButton")?.removeAttribute("hidden");
    const drawerTitle = document.querySelector("#drawerTitle");
    if (drawerTitle) drawerTitle.textContent = "일정 수정";
    const backdrop = document.querySelector("#drawerBackdrop");
    const drawer = document.querySelector("#eventDrawer");
    if (backdrop) backdrop.hidden = false;
    drawer?.classList.add("is-open");
    drawer?.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setEventReminderControls(id, data);
  } catch (error) { console.warn("알림 일정 열기 실패", error); }
}

function bindDrawerReminderState() {
  ensureEventReminderControls();
  const drawer = document.querySelector("#eventDrawer");
  if (!drawer) return;
  new MutationObserver(() => {
    if (!drawer.classList.contains("is-open")) return;
    window.setTimeout(() => populateEventReminderControls(document.querySelector("#eventId")?.value || ""), 80);
  }).observe(drawer, { attributes: true, attributeFilter: ["class"] });
  document.addEventListener("click", (event) => {
    if (event.target.closest("#openEventDrawer, [data-request-schedule]")) window.setTimeout(() => setEventReminderControls("", {}), 30);
  }, true);
}

function installPublicApi() {
  window.NineworksReminder = {
    getState: stateSnapshot,
    subscribe(listener) { listeners.add(listener); listener(stateSnapshot()); return () => listeners.delete(listener); },
    setSettings: savePersonalSettings,
    setEventOverride,
    resetEventOverride,
    getEventConfig: effectiveEventConfig,
    requestEnable: requestEnableReminders,
    disable: () => savePersonalSettings({ enabled: false }),
    sendTest: sendTestReminder,
    openEvent: openEventDrawerById
  };
}

function initializeBrowserReminders() {
  if (!api) return;
  installPublicApi();
  createReminderPanel();
  bindNotificationButton();
  ensureEventReminderControls();
  bindDrawerReminderState();
  ensureServiceWorker();
  document.addEventListener("visibilitychange", checkDueReminders);
  window.addEventListener("focus", checkDueReminders);
  navigator.serviceWorker?.addEventListener("message", (event) => {
    if (event.data?.type === "OPEN_NINEWORKS_EVENT" && event.data.eventId) openEventDrawerById(event.data.eventId);
  });
  api.onAuthStateChanged(api.auth, async (user) => {
    currentUser = user;
    unsubscribeEvents?.();
    unsubscribeEvents = null;
    stopReminderTimer();
    events = [];
    if (!user) { settings = { ...DEFAULT_SETTINGS }; currentProfileName = ""; publishState(); return; }
    await loadPersonalSettings(user);
    subscribeEvents();
    syncReminderTimer();
    if (settings.enabled) document.addEventListener("pointerdown", unlockAudio, { once: true, passive: true });
    const eventId = new URLSearchParams(window.location.search).get("event");
    if (eventId) window.setTimeout(() => openEventDrawerById(eventId), 800);
  });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initializeBrowserReminders, { once: true });
else initializeBrowserReminders();
