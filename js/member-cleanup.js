const api = window.NineworksFirebase;

const MEMBERS = ["박재영", "박상혁"];
const PROFILE_BY_EMAIL_LOCAL = {
  planus253: { name: "박재영", role: "owner" },
  daytuio0329: { name: "박상혁", role: "staff" }
};

const $ = (selector, scope = document) => scope.querySelector(selector);
let signedInUser = null;
let signedInProfile = null;
let rosterTimer = null;

function normalize(value = "") {
  return String(value).replace(/\s+/g, "").trim().toLowerCase();
}

function profileFromUser(user) {
  const local = String(user?.email || "").split("@")[0].toLowerCase();
  return PROFILE_BY_EMAIL_LOCAL[local] || null;
}

function optionValues(select) {
  return select ? [...select.options].map((option) => option.value) : [];
}

function replaceOptions(select, values, fallback = "") {
  if (!select) return;

  const expected = values.map((item) => item.value);
  const current = optionValues(select);
  const same = expected.length === current.length && expected.every((value, index) => value === current[index]);
  const previous = select.value;

  if (!same) {
    select.innerHTML = values
      .map((item) => `<option value="${item.value}">${item.label}</option>`)
      .join("");
  }

  if (expected.includes(previous)) {
    select.value = previous;
    return;
  }

  const normalizedPrevious = normalize(previous);
  if (["신민용", "daytuio0329", "daytuio0329@naver.com"].map(normalize).includes(normalizedPrevious)) {
    select.value = expected.includes("박상혁") ? "박상혁" : fallback;
    return;
  }

  if (["planus253"].map(normalize).includes(normalizedPrevious)) {
    select.value = expected.includes("박재영") ? "박재영" : fallback;
    return;
  }

  select.value = fallback || expected[0] || "";
}

function enforceMemberOptions() {
  replaceOptions(
    $("#eventMember"),
    MEMBERS.map((name) => ({ value: name, label: name })),
    signedInProfile?.name || "박재영"
  );

  replaceOptions(
    $("#requestAssignee"),
    [...MEMBERS.map((name) => ({ value: name, label: name })), { value: "미지정", label: "미지정" }],
    signedInProfile?.name || "박재영"
  );

  replaceOptions(
    $("#memberFilter"),
    [
      { value: "all", label: "전체 담당자" },
      ...MEMBERS.map((name) => ({ value: name, label: name }))
    ],
    "all"
  );

  replaceOptions(
    $("#goalAssignee"),
    MEMBERS.map((name) => ({ value: name, label: name })),
    signedInProfile?.name || "박재영"
  );
}

function enforceVisibleIdentity(profile) {
  if (!profile) return;
  const roleLabel = profile.role === "owner" ? "OWNER" : "STAFF";

  const headerName = $(".profile-button__text strong");
  const headerRole = $(".profile-button__text small");
  const avatar = $(".profile-button__avatar");
  const workspaceHeading = $("#mypagePage .page-heading h1");
  const profileName = $(".profile-info h2");
  const profileRole = $(".profile-info > p:not(.eyebrow)");
  const profileAvatar = $(".profile-large-avatar");
  const profileEmail = $(".profile-info dl div:first-child dd");

  if (headerName) headerName.textContent = profile.name;
  if (headerRole) headerRole.textContent = roleLabel;
  if (avatar) avatar.textContent = profile.name.slice(0, 1);
  if (workspaceHeading) workspaceHeading.textContent = `${profile.name} 님, 오늘의 업무 흐름입니다.`;
  if (profileName) profileName.textContent = profile.name;
  if (profileRole) profileRole.textContent = `${roleLabel} · NINEWORKS`;
  if (profileAvatar) profileAvatar.textContent = profile.name.slice(0, 1);
  if (profileEmail) profileEmail.textContent = signedInUser?.email || "-";
}

async function ensureCorrectProfile(user) {
  const mapped = profileFromUser(user);
  if (!mapped) return null;

  const profile = {
    uid: user.uid,
    name: mapped.name,
    email: user.email || "",
    role: mapped.role,
    active: true,
    updatedAt: api.serverTimestamp()
  };

  await api.setDoc(api.doc(api.db, "users", user.uid), profile, { merge: true });
  return profile;
}

function migratedName(value) {
  const normalized = normalize(value);
  if (["신민용", "daytuio0329", "daytuio0329@naver.com"].map(normalize).includes(normalized)) return "박상혁";
  if (["planus253"].map(normalize).includes(normalized)) return "박재영";
  return null;
}

async function migrateCollection(collectionName, fieldName) {
  const snapshot = await api.getDocs(api.collection(api.db, collectionName));
  const batch = api.writeBatch(api.db);
  let changes = 0;

  snapshot.docs.forEach((document) => {
    const replacement = migratedName(document.data()?.[fieldName]);
    if (!replacement) return;
    batch.set(document.ref, {
      [fieldName]: replacement,
      updatedAt: api.serverTimestamp()
    }, { merge: true });
    changes += 1;
  });

  if (changes) await batch.commit();
}

async function migrateLegacyNames() {
  await Promise.all([
    migrateCollection("events", "member"),
    migrateCollection("requests", "assignee"),
    migrateCollection("clients", "member"),
    migrateCollection("goals", "assignee"),
    migrateCollection("notifications", "recipientName")
  ]);
}

function startDomGuard() {
  enforceMemberOptions();

  let queued = false;
  const observer = new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      enforceMemberOptions();
      enforceVisibleIdentity(signedInProfile);
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });

  clearInterval(rosterTimer);
  rosterTimer = window.setInterval(() => {
    enforceMemberOptions();
    enforceVisibleIdentity(signedInProfile);
  }, 1200);
}

export async function initializeMemberCleanup() {
  if (!api) return;

  if (document.readyState === "loading") {
    await new Promise((resolve) => document.addEventListener("DOMContentLoaded", resolve, { once: true }));
  }

  startDomGuard();

  let initialResolved = false;
  let resolveInitial;
  const initialReady = new Promise((resolve) => {
    resolveInitial = resolve;
  });

  api.onAuthStateChanged(api.auth, async (user) => {
    signedInUser = user;
    signedInProfile = null;

    try {
      if (user) {
        signedInProfile = await ensureCorrectProfile(user);
        enforceVisibleIdentity(signedInProfile);
        await migrateLegacyNames();
      }
      enforceMemberOptions();
    } catch (error) {
      console.warn("담당자 정리 실패", error);
    } finally {
      if (!initialResolved) {
        initialResolved = true;
        resolveInitial();
      }
    }
  });

  await initialReady;
}
