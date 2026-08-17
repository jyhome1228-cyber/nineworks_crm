const SAVE_GUARD_VERSION = "20260817-4";
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
  window.setTimeout(() => toast.classList.remove("is-visible"), 3600);
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
  if (!api) throw new Error("Firebase API가 아직 연결되지 않았습니다.");
  const user = api.auth?.currentUser;
  if (!user) throw new Error("로그인 정보를 확인하지 못했습니다.");
  if (!isComplete(snapshot)) throw new Error("일정 필수값이 완성되지 않았습니다.");

  const ref = api.doc(api.db, "events", snapshot.id);
  const payload = {
    ...snapshot,
    updatedAt: api.serverTimestamp(),
    updatedBy: user.uid,
    saveGuardVersion: SAVE_GUARD_VERSION
  };

  await api.setDoc(ref, payload, { merge: true });
  const verified = await api.getDoc(ref);
  const actual = verified.exists() ? verified.data() : null;

  if (!actual || !sameCoreFields(snapshot, actual)) {
    console.error("[NINEWORKS save mismatch]", { expected: snapshot, actual });
    throw new Error("저장 후 Firestore 값이 입력값과 일치하지 않습니다.");
  }

  console.info("[NINEWORKS calendar save verified]", snapshot.id, SAVE_GUARD_VERSION, actual);
  showToast("Firestore 저장 확인 완료");
}

function handleSubmit(event) {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || form.id !== "eventForm") return;

  const snapshot = readSnapshot();
  if (!isComplete(snapshot)) {
    showToast("필수 일정 정보를 확인해주세요.");
    return;
  }

  window.setTimeout(() => {
    persistAndVerify(snapshot).catch((error) => {
      console.error("일정 확정 저장 실패", error);
      const code = String(error?.code || "").replace("firestore/", "");
      const detail = code || error?.message || "unknown";
      showToast(`일정 저장 실패 · ${detail}`);
    });
  }, 220);
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
  console.info("[NINEWORKS calendar save guard ready]", SAVE_GUARD_VERSION);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bind, { once: true });
} else {
  bind();
}
