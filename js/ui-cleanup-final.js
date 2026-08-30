(() => {
  "use strict";

  const STYLE_ID = "nineworks-light-theme-final";

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const link = document.createElement("link");
    link.id = STYLE_ID;
    link.rel = "stylesheet";
    link.href = new URL("../css/light-theme-final.css?v=20260830-2", import.meta.url).href;
    document.head.appendChild(link);
  }

  function removeSalesUi() {
    document.querySelectorAll('[data-route="sales"], #salesNavButton').forEach((element) => element.remove());
    document.querySelectorAll('[data-page="sales"], #salesPage').forEach((element) => element.remove());
    document.querySelectorAll('[data-client-sales]').forEach((element) => element.remove());
  }

  function fixReadableProfile() {
    const profile = document.querySelector('.profile-button__text');
    if (!profile) return;
    profile.style.opacity = "1";
    profile.querySelectorAll('strong, small').forEach((node) => { node.style.opacity = "1"; });
  }

  function normalize() {
    ensureStyle();
    removeSalesUi();
    fixReadableProfile();
  }

  function observe() {
    const observer = new MutationObserver(() => normalize());
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { normalize(); observe(); }, { once: true });
  } else {
    normalize();
    observe();
  }
})();
