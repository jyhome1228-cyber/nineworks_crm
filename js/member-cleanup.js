const api = window.NineworksFirebase;

const ALLOWED_MEMBERS = ["박재영", "박상혁"];
const KNOWN_STAFF_EMAIL = "daytuio0329@naver.com";

const $ = (selector, scope = document) => scope.querySelector(selector);

function normalize(value = "") {
  return String(value).replace(/\s+/g, "").trim();
}

function sameOptions(select, values) {
  if (!select) return true;
  const current = [...select.options].map((option) => option.value);
  return current.length === values.length && current.every((value, index) => value === values[index]);
}

function replaceOptions(select, values, fallbackValue = "") {
  if (!select || sameOptions(select, values)) return;
  const previous = select.value;
  select.innerHTML = values
    .map(({ value, label }) => `<option value="${value}">${label}</option>`)
    .join("");

  if (values.some((item) => item.value === previous)) {
    select.value = previous;
  } else if (previous === "신민용" && values.some((item) => item.value === "박상혁")) {
    select.value = "박상혁";
  } else {
    select.value = fallbackValue || values[0]?.value || "";
  }
}

function enforceMemberOptions() {
  replaceOptions(
    $("#eventMember"),
    ALLOWED_MEMBERS.map((name) => ({ value: name, label: name })),
    "박재영"
  );

  replaceOptions(
    $("#requestAssignee"),
    [...ALLOWED_MEMBERS.map((name) => ({ value: name, label: name })), { value: "미지정", label: "미지정" }],
    "박재영"
  );

  replaceOptions(
    $("#memberFilter"),
    [
      { value: "all", label: "전체 담당자" },
      ...ALLOWED_MEMBERS.map((name) => ({ value: name, label: name }))
    ],
    "all"
  );
}

async function ensureKnownProfile(user) {
  if (!user || String(user.email || "").toLowerCase() !== KNOWN_STAFF_EMAIL) return;

  await api.setDoc(
    api.doc(api.db, "users", user.uid),
    {
      uid: user.uid,
      name: "박상혁",
      email: user.email || KNOWN_STAFF_EMAIL,
      role: "staff",
      active: true,
      updatedAt: api.serverTimestamp()
    },
    { merge: true }
  );
}

async function migrateLegacyAssignees() {
  const [eventsSnapshot, requestsSnapshot, clientsSnapshot] = await Promise.all([
    api.getDocs(api.collection(api.db, "events")),
    api.getDocs(api.collection(api.db, "requests")),
    api.getDocs(api.collection(api.db, "clients"))
  ]);

  const batch = api.writeBatch(api.db);
  let changeCount = 0;

  eventsSnapshot.docs.forEach((document) => {
    const data = document.data();
    if (normalize(data.member) !== normalize("신민용")) return;
    batch.set(document.ref, { member: "박상혁", updatedAt: api.serverTimestamp() }, { merge: true });
    changeCount += 1;
  });

  requestsSnapshot.docs.forEach((document) => {
    const data = document.data();
    if (normalize(data.assignee) !== normalize("신민용")) return;
    batch.set(document.ref, { assignee: "박상혁", updatedAt: api.serverTimestamp() }, { merge: true });
    changeCount += 1;
  });

  clientsSnapshot.docs.forEach((document) => {
    const data = document.data();
    if (normalize(data.member) !== normalize("신민용")) return;
    batch.set(document.ref, { member: "박상혁", updatedAt: api.serverTimestamp() }, { merge: true });
    changeCount += 1;
  });

  if (changeCount > 0) await batch.commit();
}

function observeMemberSelects() {
  enforceMemberOptions();

  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      enforceMemberOptions();
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

export async function initializeMemberCleanup() {
  if (!api) return;

  if (document.readyState === "loading") {
    await new Promise((resolve) => document.addEventListener("DOMContentLoaded", resolve, { once: true }));
  }

  observeMemberSelects();

  api.onAuthStateChanged(api.auth, async (user) => {
    if (!user) return;
    try {
      await ensureKnownProfile(user);
      await migrateLegacyAssignees();
      enforceMemberOptions();
    } catch (error) {
      console.warn("담당자 정리 실패", error);
    }
  });
}
