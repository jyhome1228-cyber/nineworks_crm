const reminderStyle = document.createElement("link");
reminderStyle.rel = "stylesheet";
reminderStyle.href = new URL("../css/browser-reminders.css?v=20260803-1", import.meta.url).href;
document.head.appendChild(reminderStyle);

const api = window.NineworksFirebase;
const ENABLED_KEY = "nineworks_browser_reminders_enabled_v1";
const SENT_KEY = "nineworks_browser_reminders_sent_v1";
const CHECK_INTERVAL = 15000;
const MAX_LATE_MS = 5 * 60 * 1000;

let events = [];
let unsubscribeEvents = null;
let reminderTimer = null;
let lastCheckAt = Date.now() - CHECK_INTERVAL;
let serviceWorkerRegistration = null;
let audioContext = null;
let currentUser = null;

function isGloballyEnabled() {
  return localStorage.getItem(ENABLED_KEY) === "true";
}

function setGloballyEnabled(enabled) {
  localStorage.setItem(ENABLED_KEY, enabled ? "true" : "false");
  updateReminderPanel();
  syncEventSubscription();
}

function getSentMap() {
  try {
    return JSON.parse(localStorage.getItem(SENT_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

function saveSentMap(map) {
  const cutoff = Date.now() - 14 * 86400000;
  Object.keys(map).forEach((key) => {
    if (Number(map[key]) < cutoff) delete map[key];
  });
  localStorage.setItem(SENT_KEY, JSON.stringify(map));
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatTime(date) {
  const hour = date.getHours();
  const minute = pad(date.getMinutes());
  const period = hour < 12 ? "오전" : "오후";
  const displayHour = hour % 12 || 12;
  return `${period} ${displayHour}:${minute}`;
}

function eventStartDate(event) {
  if (!event?.start) return null;
  const allDay = event.allDay !== false && !event.startTime;
  const time = allDay ? "09:00" : (event.startTime || "09:00");
  const value = new Date(`${event.start}T${time}:00`);
  return Number.isNaN(value.getTime()) ? null : value;
}

function reminderOffsets(event) {
  if (event.reminderEnabled === false) return [];
  if (Array.isArray(event.reminderOffsets)) {
    return [...new Set(event.reminderOffsets.map(Number).filter((value) => Number.isFinite(value) && value >= 0))];
  }
  const allDay = event.allDay !== false && !event.startTime;
  return allDay ? [0] : [10, 0];
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
    serviceWorkerRegistration = await navigator.serviceWorker.register("./notification-sw.js?v=20260803-1");
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
    try {
      await audioContext.resume();
    } catch {
      return false;
    }
  }
  return audioContext.state === "running";
}

async function playChime() {
  if (!isGloballyEnabled()) return;
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
    : offset > 0
      ? `${offset}분 뒤 시작 · ${formatTime(start)}`
      : `일정 시작 · ${formatTime(start)}`;
  const title = isTest ? "NINEWORKS CRM 테스트 알림" : `${meetingPrefix}${event.title || "업무 일정"}`;
  const bodyParts = [timing, [event.client, event.member].filter(Boolean).join(" · ")].filter(Boolean);
  const options = {
    body: bodyParts.join("\n"),
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
    if (registration) {
      await registration.showNotification(title, options);
    } else if ("Notification" in window && Notification.permission === "granted") {
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

function checkDueReminders() {
  if (!isGloballyEnabled() || Notification.permission !== "granted") {
    lastCheckAt = Date.now();
    return;
  }

  const now = Date.now();
  const windowStart = Math.max(lastCheckAt - 1000, now - MAX_LATE_MS);
  const sent = getSentMap();

  events.forEach((event) => {
    if (!event?.id || event.status === "done") return;
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
  document.addEventListener("visibilitychange", checkDueReminders);
  window.addEventListener("focus", checkDueReminders);
}

function stopReminderTimer() {
  if (reminderTimer) window.clearInterval(reminderTimer);
  reminderTimer = null;
}

function syncEventSubscription() {
  if (!api || !currentUser || !isGloballyEnabled()) {
    unsubscribeEvents?.();
    unsubscribeEvents = null;
    events = [];
    stopReminderTimer();
    return;
  }

  if (!unsubscribeEvents) {
    unsubscribeEvents = api.onSnapshot(
      api.collection(api.db, "events"),
      (snapshot) => {
        events = snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
      },
      (error) => console.warn("알림 일정 불러오기 실패", error)
    );
  }
  startReminderTimer();
}

function createReminderPanel() {
  if (document.querySelector("#browserReminderPanel")) return;
  const panel = document.createElement("section");
  panel.id = "browserReminderPanel";
  panel.className = "nw-reminder-panel";
  panel.hidden = true;
  panel.innerHTML = `
    <div class="nw-reminder-panel__head">
      <div>
        <p class="eyebrow">BROWSER REMINDER</p>
        <h3>업무 알림과 소리</h3>
      </div>
      <span id="browserReminderStatus" class="nw-reminder-status">꺼짐</span>
    </div>
    <p class="nw-reminder-panel__description">CRM 탭이 열려 있는 동안 일정 시작 전과 시작 시간에 크롬 알림과 소리를 재생합니다.</p>
    <p id="browserReminderNotice" class="nw-reminder-panel__notice">알림을 켜려면 아래 버튼을 누르고 크롬 권한을 허용해주세요.</p>
    <div class="nw-reminder-panel__actions">
      <button id="toggleBrowserReminder" class="button button--primary" type="button">알림과 소리 켜기</button>
      <button id="testBrowserReminder" class="button button--ghost" type="button">테스트 알림</button>
    </div>
  `;
  document.body.appendChild(panel);

  document.querySelector("#toggleBrowserReminder")?.addEventListener("click", toggleBrowserReminders);
  document.querySelector("#testBrowserReminder")?.addEventListener("click", sendTestReminder);
  updateReminderPanel();
}

function positionReminderPanel() {
  const button = document.querySelector("#notificationButton");
  const panel = document.querySelector("#browserReminderPanel");
  if (!button || !panel) return;
  const rect = button.getBoundingClientRect();
  const width = Math.min(360, window.innerWidth - 24);
  const left = Math.max(12, Math.min(window.innerWidth - width - 12, rect.right - width));
  panel.style.top = `${rect.bottom + 10}px`;
  panel.style.left = `${left}px`;
}

function setPanelNotice(message, isError = false) {
  const notice = document.querySelector("#browserReminderNotice");
  if (!notice) return;
  notice.textContent = message;
  notice.classList.toggle("is-error", isError);
}

function updateReminderPanel() {
  const enabled = isGloballyEnabled() && Notification.permission === "granted";
  const status = document.querySelector("#browserReminderStatus");
  const toggle = document.querySelector("#toggleBrowserReminder");
  const test = document.querySelector("#testBrowserReminder");
  const bell = document.querySelector("#notificationButton");

  status?.classList.toggle("is-on", enabled);
  if (status) status.textContent = enabled ? "켜짐" : "꺼짐";
  if (toggle) toggle.textContent = enabled ? "알림 끄기" : "알림과 소리 켜기";
  if (test) test.disabled = !enabled;
  bell?.classList.toggle("is-reminder-enabled", enabled);

  if (Notification.permission === "denied") {
    setPanelNotice("크롬에서 알림이 차단되어 있습니다. 주소창 왼쪽 사이트 설정에서 알림을 허용해주세요.", true);
  } else if (enabled) {
    setPanelNotice("일반 시간 일정은 10분 전과 시작 시간, 종일 일정은 오전 9시에 알려드립니다.");
  } else {
    setPanelNotice("알림을 켜려면 아래 버튼을 누르고 크롬 권한을 허용해주세요.");
  }
}

async function toggleBrowserReminders() {
  if (!("Notification" in window)) {
    setPanelNotice("이 브라우저에서는 시스템 알림을 지원하지 않습니다.", true);
    return;
  }

  if (isGloballyEnabled() && Notification.permission === "granted") {
    setGloballyEnabled(false);
    showWorkspaceToast("업무 알림을 껐습니다.");
    return;
  }

  const permission = Notification.permission === "granted"
    ? "granted"
    : await Notification.requestPermission();

  if (permission !== "granted") {
    setGloballyEnabled(false);
    updateReminderPanel();
    return;
  }

  await ensureServiceWorker();
  await unlockAudio();
  setGloballyEnabled(true);
  showWorkspaceToast("업무 알림과 소리를 켰습니다.");
}

async function sendTestReminder() {
  if (!isGloballyEnabled() || Notification.permission !== "granted") return;
  await unlockAudio();
  await displayNotification({
    id: "",
    title: "알림 테스트",
    client: "NINEWORKS CRM",
    member: "정상 작동 중",
    start: new Date().toISOString().slice(0, 10),
    startTime: `${pad(new Date().getHours())}:${pad(new Date().getMinutes())}`,
    allDay: false
  }, 0, true);
}

function bindNotificationButton() {
  const button = document.querySelector("#notificationButton");
  if (!button || button.dataset.reminderReady === "true") return;
  button.dataset.reminderReady = "true";

  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const panel = document.querySelector("#browserReminderPanel");
    if (!panel) return;
    panel.hidden = !panel.hidden;
    if (!panel.hidden) {
      positionReminderPanel();
      updateReminderPanel();
    }
  }, true);

  document.addEventListener("click", (event) => {
    const panel = document.querySelector("#browserReminderPanel");
    if (!panel || panel.hidden) return;
    if (panel.contains(event.target) || button.contains(event.target)) return;
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
      <span>업무 알림</span>
      <label class="nw-reminder-master">
        <input id="eventReminderEnabled" type="checkbox" checked />
        <span>알림 사용</span>
      </label>
    </div>
    <div id="eventReminderOptions" class="nw-event-reminder-options">
      <label class="nw-event-reminder-option"><input type="checkbox" name="eventReminderOffset" value="10" checked /><span>시작 10분 전</span></label>
      <label class="nw-event-reminder-option"><input type="checkbox" name="eventReminderOffset" value="0" checked /><span>시작 시간</span></label>
    </div>
    <p class="nw-event-reminder-help">종일 일정의 시작 시간은 오전 9시로 계산합니다. CRM 탭이 열려 있어야 무료 알림이 작동합니다.</p>
  `;

  const timeSection = document.querySelector("#eventTimeSection");
  const statusField = document.querySelector("#eventStatus")?.closest(".field");
  if (timeSection) timeSection.insertAdjacentElement("afterend", section);
  else if (statusField) statusField.insertAdjacentElement("beforebegin", section);
  else form.appendChild(section);

  document.querySelector("#eventReminderEnabled")?.addEventListener("change", syncEventReminderOptions);
  form.addEventListener("submit", persistEventReminderSettings, true);
  syncEventReminderOptions();
}

function syncEventReminderOptions() {
  const enabled = document.querySelector("#eventReminderEnabled")?.checked ?? true;
  document.querySelector("#eventReminderOptions")?.classList.toggle("is-disabled", !enabled);
}

function setEventReminderControls(data = null) {
  ensureEventReminderControls();
  const enabledInput = document.querySelector("#eventReminderEnabled");
  const offsets = Array.isArray(data?.reminderOffsets)
    ? data.reminderOffsets.map(Number)
    : [10, 0];
  if (enabledInput) enabledInput.checked = data?.reminderEnabled !== false;
  document.querySelectorAll('input[name="eventReminderOffset"]').forEach((input) => {
    input.checked = offsets.includes(Number(input.value));
  });
  syncEventReminderOptions();
}

async function populateEventReminderControls(id) {
  if (!id || !api?.auth?.currentUser) {
    setEventReminderControls(null);
    return;
  }
  try {
    const snapshot = await api.getDoc(api.doc(api.db, "events", id));
    setEventReminderControls(snapshot.exists() ? snapshot.data() : null);
  } catch (error) {
    console.warn("일정 알림 설정 불러오기 실패", error);
    setEventReminderControls(null);
  }
}

function persistEventReminderSettings(event) {
  const form = event.currentTarget;
  if (!api?.auth?.currentUser || !form) return;
  const idInput = document.querySelector("#eventId");
  if (!idInput) return;
  if (!idInput.value) idInput.value = `event_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const reminderEnabled = document.querySelector("#eventReminderEnabled")?.checked ?? true;
  const reminderOffsets = [...document.querySelectorAll('input[name="eventReminderOffset"]:checked')]
    .map((input) => Number(input.value));

  api.setDoc(api.doc(api.db, "events", idInput.value), {
    reminderEnabled,
    reminderOffsets,
    updatedAt: api.serverTimestamp()
  }, { merge: true }).catch((error) => console.warn("일정 알림 설정 저장 실패", error));
}

async function openEventDrawerById(id) {
  if (!id || !api?.auth?.currentUser) return;
  try {
    const snapshot = await api.getDoc(api.doc(api.db, "events", id));
    if (!snapshot.exists()) return;
    const data = snapshot.data();
    const values = {
      eventId: id,
      eventTitle: data.title || "",
      eventClient: data.client || "",
      eventCategory: data.category || "",
      eventMember: data.member || "",
      eventStart: data.start || "",
      eventEnd: data.end || data.start || "",
      eventStatus: data.status || "planned",
      eventMemo: data.memo || "",
      eventLink: data.link || ""
    };
    Object.entries(values).forEach(([key, value]) => {
      const input = document.getElementById(key);
      if (input) input.value = value;
    });

    const allDay = data.allDay !== false && !data.startTime;
    const allDayInput = document.querySelector("#eventAllDay");
    const startTimeInput = document.querySelector("#eventStartTime");
    const endTimeInput = document.querySelector("#eventEndTime");
    if (allDayInput) allDayInput.checked = allDay;
    if (startTimeInput) {
      startTimeInput.value = data.startTime || "";
      startTimeInput.disabled = allDay;
    }
    if (endTimeInput) {
      endTimeInput.value = data.endTime || "";
      endTimeInput.disabled = allDay;
    }

    document.querySelector("#deleteEventButton")?.removeAttribute("hidden");
    const title = document.querySelector("#drawerTitle");
    if (title) title.textContent = "일정 수정";
    const backdrop = document.querySelector("#drawerBackdrop");
    const drawer = document.querySelector("#eventDrawer");
    if (backdrop) backdrop.hidden = false;
    drawer?.classList.add("is-open");
    drawer?.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setEventReminderControls(data);
  } catch (error) {
    console.warn("알림 일정 열기 실패", error);
  }
}

function bindDrawerReminderState() {
  ensureEventReminderControls();
  const drawer = document.querySelector("#eventDrawer");
  if (!drawer) return;

  const observer = new MutationObserver(() => {
    if (!drawer.classList.contains("is-open")) return;
    window.setTimeout(() => {
      const id = document.querySelector("#eventId")?.value || "";
      populateEventReminderControls(id);
    }, 80);
  });
  observer.observe(drawer, { attributes: true, attributeFilter: ["class"] });

  document.addEventListener("click", (event) => {
    if (event.target.closest("#openEventDrawer, [data-request-schedule]")) {
      window.setTimeout(() => setEventReminderControls(null), 30);
    }
  }, true);
}

function initializeBrowserReminders() {
  if (!api) return;
  createReminderPanel();
  bindNotificationButton();
  ensureEventReminderControls();
  bindDrawerReminderState();
  ensureServiceWorker();

  if (isGloballyEnabled()) {
    document.addEventListener("pointerdown", unlockAudio, { once: true, passive: true });
  }

  navigator.serviceWorker?.addEventListener("message", (event) => {
    if (event.data?.type === "OPEN_NINEWORKS_EVENT" && event.data.eventId) {
      openEventDrawerById(event.data.eventId);
    }
  });

  api.onAuthStateChanged(api.auth, (user) => {
    currentUser = user;
    syncEventSubscription();
    if (user) {
      const eventId = new URLSearchParams(window.location.search).get("event");
      if (eventId) window.setTimeout(() => openEventDrawerById(eventId), 800);
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeBrowserReminders, { once: true });
} else {
  initializeBrowserReminders();
}
