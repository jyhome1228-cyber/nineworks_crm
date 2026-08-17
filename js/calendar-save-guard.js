const SAVE_GUARD_VERSION = "20260817-1";
let bindTimer = null;

function getApi() {
  return window.NineworksFirebase || null;
}

function uid() {
  return `event_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function value(selector) {
  return document.querySelector(selector)?.value ?? "";
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
}

function readSnapshot() {
  const idInput = document.querySelector("#eventId");
  if (!idInput) return null;
  if (!idInput.value) idInput.value = uid();

  const allDay = document.querySelector("#eventAllDay")?.checked ?? true;
  const startTime = document.querySelector("#eventStartTime")?.value || "";
  const endTime = document.querySelector("#eventEndTime")?.value || "";

  return {
    id: idInput.value,
    title: value("#eventTitle").trim(),
    client: value("#eventClient"),
    category: value("#eventCategory"),
    member: value("#eventMember"),
    start: value("#eventStart"),
    end: value("#eventEnd") || value("#eventStart"),
    status: value("#eventStatus") || "planned",
    memo: value("#eventMemo").trim(),
    link: value("#eventLink").trim(),
    allDay,
    startTime: allDay ? "" : startTime,
    endTime: allDay ? "" : endTime
  };
}

function isComplete(snapshot) {
  return Boolean(
    snapshot?.id &&
    snapshot.title &&
    snapshot.client &&
    snapshot.category &&
    snapshot.member &&
    snapshot.start &&
    snapshot.end
  );
}

function sameCoreFields(expected, actual = {}) {
  const keys = [
    "title", "client", "category", "member", "start", "end", "status",
    "memo", "link", "allDay", "startTime", "endTime"
  ];
  return keys.every((key) => (actual[key] ?? "") === (expected[key] ?? ""));
}

async function persistAndVerify(snapshot) {
  const api = getApi();
  const user = api?.auth?.currentUser;
  if (!api || !user || !isComplete(snapshot)) return;

  const ref = api.doc(api.db, "events", snapshot.id);
  const payload = {
    ...snapshot,
    updatedAt: api.serverTimestamp(),
    updatedBy: user.uid,
    saveGuardVersion: SAVE_GUARD_VERSION
  };

  await api.setDoc(ref, payload, { merge: true });
  const verified = await api.getDoc(ref);
  if (!verified.exists() || !sameCoreFields(snapshot, verified.data())) {
    throw new Error("저장 후 Firestore 값이 입력값과 일치하지 않습니다.");
  }

  console.info("[NINEWORKS calendar save verified]", snapshot.id, SAVE_GUARD_VERSION);
}

function handleSubmit(event) {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || form.id !== "eventForm") return;

  const snapshot = readSnapshot();
  if (!isComplete(snapshot)) return;

  window.setTimeout(() => {
    persistAndVerify(snapshot).catch((error) => {
      console.error("일정 확정 저장 실패", error);
      const code = String(error?.code || "").replace("firestore/", "");
      showToast(`일정 저장 실패${code ? ` · ${code}` : ""}. 다시 시도해주세요.`);
    });
  }, 180);
}

function bind() {
  const form = document.querySelector("#eventForm");
  if (!form) {
    window.clearTimeout(bindTimer);
    bindTimer = window.setTimeout(bind, 180);
    return;
  }
  if (form.dataset.calendarSaveGuard === SAVE_GUARD_VERSION) return;
  form.dataset.calendarSaveGuard = SAVE_GUARD_VERSION;
  form.addEventListener("submit", handleSubmit);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bind, { once: true });
} else {
  bind();
}
