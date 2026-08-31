(() => {
  "use strict";

  let api = null;
  let currentUser = null;
  let currentProfileName = "";
  let unsubscribeEvents = null;
  let initializedSnapshot = false;
  const previousAssignees = new Map();

  function normalizeName(value = "") {
    return String(value).replace(/\s+/g, "").trim().toLowerCase();
  }

  function showToast(message) {
    const toast = document.querySelector("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
  }

  async function browserNotify(event) {
    if (!("Notification" in window) || Notification.permission !== "granted") return false;

    const title = "새 업무가 배정되었습니다.";
    const body = [event.client, event.title].filter(Boolean).join(" · ") || "NINEWORKS CRM 업무";
    const options = {
      body,
      icon: "https://9workscrm.cloud/assets/favicon.svg?v=20260803",
      badge: "https://9workscrm.cloud/assets/favicon.svg?v=20260803",
      tag: `nineworks-assignment-${event.id}-${normalizeName(event.member)}`,
      renotify: true,
      data: { eventId: event.id || "" }
    };

    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.register("./notification-sw.js?v=20260831-1");
        await registration.showNotification(title, options);
        return true;
      }
      const notification = new Notification(title, options);
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      return true;
    } catch (error) {
      console.warn("담당 업무 브라우저 알림 실패", error);
      return false;
    }
  }

  function notifyAssignment(event) {
    const message = `${event.client ? `${event.client} · ` : ""}${event.title || "새 업무"} 업무가 배정되었습니다.`;
    showToast(message);
    browserNotify(event).catch(() => {});
    window.dispatchEvent(new CustomEvent("nineworks:assignment-alert", { detail: { ...event } }));
  }

  async function loadProfile(user) {
    currentProfileName = "";
    if (!user || !api) return;
    try {
      const snapshot = await api.getDoc(api.doc(api.db, "users", user.uid));
      if (snapshot.exists()) currentProfileName = String(snapshot.data()?.name || "").trim();
    } catch (error) {
      console.warn("담당자 알림용 사용자 프로필 불러오기 실패", error);
    }
  }

  function stopSubscription() {
    unsubscribeEvents?.();
    unsubscribeEvents = null;
    initializedSnapshot = false;
    previousAssignees.clear();
  }

  function subscribeAssignments() {
    stopSubscription();
    if (!api || !currentUser || !currentProfileName) return;

    unsubscribeEvents = api.onSnapshot(
      api.collection(api.db, "events"),
      (snapshot) => {
        if (!initializedSnapshot) {
          snapshot.docs.forEach((document) => {
            previousAssignees.set(document.id, normalizeName(document.data()?.member));
          });
          initializedSnapshot = true;
          return;
        }

        snapshot.docChanges().forEach((change) => {
          const id = change.doc.id;
          if (change.type === "removed") {
            previousAssignees.delete(id);
            return;
          }

          const event = { id, ...change.doc.data() };
          const nextAssignee = normalizeName(event.member);
          const previousAssignee = previousAssignees.get(id) || "";
          previousAssignees.set(id, nextAssignee);

          const isMine = nextAssignee && nextAssignee === normalizeName(currentProfileName);
          const newlyAssignedToMe = isMine && previousAssignee !== nextAssignee;
          if (newlyAssignedToMe && event.status !== "done") notifyAssignment(event);
        });
      },
      (error) => console.warn("담당 업무 알림 구독 실패", error)
    );
  }

  function connectFirebase() {
    api = window.NineworksFirebase;
    if (!api?.auth || !api?.db || !api?.onAuthStateChanged) {
      window.setTimeout(connectFirebase, 80);
      return;
    }

    api.onAuthStateChanged(api.auth, async (user) => {
      currentUser = user;
      stopSubscription();
      if (!user) {
        currentProfileName = "";
        return;
      }
      await loadProfile(user);
      subscribeAssignments();
    });
  }

  connectFirebase();
})();
