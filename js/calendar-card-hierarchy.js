const hierarchyStyle = document.createElement("link");
hierarchyStyle.rel = "stylesheet";
hierarchyStyle.href = new URL("../css/calendar-card-hierarchy.css?v=20260901-1", import.meta.url).href;
document.head.appendChild(hierarchyStyle);

function enhanceCalendarTitle(titleElement) {
  if (!(titleElement instanceof HTMLElement) || titleElement.dataset.nwHierarchyReady === "true") return;

  const star = titleElement.querySelector(".nw-meeting-star");
  const clone = titleElement.cloneNode(true);
  clone.querySelector(".nw-meeting-star")?.remove();
  const rawText = String(clone.textContent || "").replace(/\s+/g, " ").trim();
  const separatorIndex = rawText.indexOf(" · ");

  if (separatorIndex < 0) {
    const task = document.createElement("span");
    task.className = "nw-task-title";
    task.textContent = rawText || "일정";
    titleElement.replaceChildren(task);
    titleElement.dataset.nwHierarchyReady = "true";
    return;
  }

  const clientName = rawText.slice(0, separatorIndex).trim();
  const taskName = rawText.slice(separatorIndex + 3).trim() || "일정";
  const badge = document.createElement("span");
  badge.className = "nw-client-badge";
  badge.textContent = clientName;
  badge.title = clientName;

  const task = document.createElement("span");
  task.className = "nw-task-title";
  task.textContent = taskName;
  task.title = taskName;

  titleElement.replaceChildren(badge);
  if (star) titleElement.appendChild(star);
  titleElement.appendChild(task);
  titleElement.dataset.nwHierarchyReady = "true";
}

function enhanceCalendarCards(root = document) {
  root.querySelectorAll?.(".nw-event-title").forEach(enhanceCalendarTitle);
}

function initializeHierarchy() {
  enhanceCalendarCards();

  const calendar = document.querySelector("#calendar");
  if (!calendar) {
    window.setTimeout(initializeHierarchy, 200);
    return;
  }

  if (calendar.dataset.nwHierarchyObserver === "true") return;
  calendar.dataset.nwHierarchyObserver = "true";

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        if (node.matches?.(".nw-event-title")) enhanceCalendarTitle(node);
        enhanceCalendarCards(node);
      });
    });
  });

  observer.observe(calendar, { childList: true, subtree: true });
  enhanceCalendarCards(calendar);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeHierarchy, { once: true });
} else {
  initializeHierarchy();
}
