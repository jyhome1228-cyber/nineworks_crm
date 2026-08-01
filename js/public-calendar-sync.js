const api = window.NineworksFirebase;

let unsubscribeEvents = null;
let lastPayload = "";
let syncTimer = null;

function cleanSummary(value = "") {
  const marker = "[원본·참고 내용]";
  const firstLine = String(value || "")
    .split(marker)[0]
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean) || "";
  return firstLine.length > 80 ? `${firstLine.slice(0, 80)}…` : firstLine;
}

function publicEvent(document) {
  const data = document.data();
  return {
    id: document.id,
    title: data.title || "일정",
    client: data.client || "나인웍스",
    member: data.member || "",
    category: data.category || "",
    start: data.start || "",
    end: data.end || data.start || "",
    status: data.status || "planned",
    summary: cleanSummary(data.memo)
  };
}

function scheduleSync(events, user) {
  window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(async () => {
    const serializable = events
      .filter((event) => event.start && event.end)
      .sort((a, b) => `${a.start}-${a.id}`.localeCompare(`${b.start}-${b.id}`));
    const payload = JSON.stringify(serializable);
    if (payload === lastPayload) return;

    try {
      await api.setDoc(
        api.doc(api.db, "publicCalendar", "current"),
        {
          events: serializable,
          updatedAt: api.serverTimestamp(),
          updatedBy: user.uid
        },
        { merge: false }
      );
      lastPayload = payload;
    } catch (error) {
      console.warn("공유 캘린더 동기화 실패", error);
    }
  }, 350);
}

function subscribe(user) {
  unsubscribeEvents?.();
  unsubscribeEvents = null;
  lastPayload = "";

  if (!user || !api) return;
  unsubscribeEvents = api.onSnapshot(
    api.collection(api.db, "events"),
    (snapshot) => scheduleSync(snapshot.docs.map(publicEvent), user),
    (error) => console.warn("공유 캘린더 원본 구독 실패", error)
  );
}

if (api) api.onAuthStateChanged(api.auth, subscribe);
