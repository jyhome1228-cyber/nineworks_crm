import "./simple-event-form.js?v=20260831-2";
import "./assignment-alerts.js?v=20260831-1";

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

        /* Calendar filter labels are wrappers, not input boxes. Remove the inherited white outer box. */
        html[data-theme="light"] #calendarPage .calendar-toolbar .filter-group .select-control {
          display:grid !important;
          gap:6px !important;
          border:0 !important;
          border-radius:0 !important;
          padding:0 !important;
          background:transparent !important;
          box-shadow:none !important;
          color:#475467 !important;
        }
        html[data-theme="light"] #calendarPage .calendar-toolbar .filter-group .select-control > span {
          margin:0 !important;
          color:#596273 !important;
          font-size:11px !important;
          font-weight:650 !important;
          line-height:1.2 !important;
        }
        html[data-theme="light"] #calendarPage .calendar-toolbar .filter-group .select-control select {
          min-width:145px !important;
          min-height:40px !important;
          margin:0 !important;
          border:1px solid #d7dce3 !important;
          border-radius:9px !important;
          padding:0 34px 0 12px !important;
          background-color:#fff !important;
          color:#344054 !important;
          box-shadow:none !important;
        }
        #calendarPage .calendar-toolbar .filter-group {
          align-items:end !important;
          gap:10px !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  function hideSalesUi() {
    document.querySelectorAll('[data-route="sales"], #salesNavButton, [data-page="sales"], #salesPage, [data-client-sales]').forEach((element) => {
      element.hidden = true;
      element.setAttribute("aria-hidden", "true");
    });
  }

  function fixReadableProfile() {
    const profile = document.querySelector('.profile-button__text');
    if (!profile) return;
    profile.style.opacity = "1";
    profile.querySelectorAll('strong, small').forEach((node) => { node.style.opacity = "1"; });
  }

  function normalize() {
    ensureStyle();
    hideSalesUi();
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
