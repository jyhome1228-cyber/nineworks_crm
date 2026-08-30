(() => {
  "use strict";

  const STYLE_ID = "nineworks-light-theme-final";
  const FUNCTIONAL_STYLE_ID = "nineworks-ui-functional-hotfix";

  function ensureStyle() {
    if (!document.getElementById(STYLE_ID)) {
      const link = document.createElement("link");
      link.id = STYLE_ID;
      link.rel = "stylesheet";
      link.href = new URL("../css/light-theme-final.css?v=20260830-3", import.meta.url).href;
      document.head.appendChild(link);
    }

    if (!document.getElementById(FUNCTIONAL_STYLE_ID)) {
      const style = document.createElement("style");
      style.id = FUNCTIONAL_STYLE_ID;
      style.textContent = `
        /* sales workspace is discontinued, but the shared client quick-modal backdrop remains usable */
        #salesCrmBackdrop:not([hidden]) { display:block !important; }
        #clientQuickModal:not([hidden]) { display:block !important; }
        html[data-theme="light"] #clientQuickModal {
          border-color:#dfe3e8 !important;
          background:#fff !important;
          color:#17191d !important;
          box-shadow:0 24px 70px rgba(15,23,42,.14) !important;
        }
        html[data-theme="light"] #clientQuickModal .crm-form-head,
        html[data-theme="light"] #clientQuickModal .crm-form-body { background:#fff !important; color:#17191d !important; }
        html[data-theme="light"] #clientQuickModal .crm-form-head p,
        html[data-theme="light"] #clientQuickModal .crm-form-help,
        html[data-theme="light"] #clientQuickModal .crm-form-field > span { color:#667085 !important; opacity:1 !important; }
        html[data-theme="light"] #clientQuickModal input,
        html[data-theme="light"] #clientQuickModal select,
        html[data-theme="light"] #clientQuickModal textarea {
          border-color:#d7dce3 !important;
          background:#fff !important;
          color:#20242a !important;
        }
        html[data-theme="light"] .client-progress-button {
          border-color:#e1e5ea !important;
          background:#fff !important;
          color:#344054 !important;
        }
        html[data-theme="light"] .client-progress-button strong { color:#344054 !important; }
        html[data-theme="light"] .client-progress-button small { color:#667085 !important; }
      `;
      document.head.appendChild(style);
    }
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
