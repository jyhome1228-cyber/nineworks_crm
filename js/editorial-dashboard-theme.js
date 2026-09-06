(() => {
  "use strict";

  const VERSION = "20260907-1";

  function mountEntryLoader() {
    if (!document.body) return;

    let loader = document.getElementById("nwEntryLoader");
    if (!loader) {
      loader = document.createElement("div");
      loader.id = "nwEntryLoader";
      loader.className = "nw-entry-loader";
      loader.setAttribute("role", "status");
      loader.setAttribute("aria-live", "polite");
      loader.innerHTML = `
        <div class="nw-entry-loader__inner">
          <img class="nw-entry-loader__logo" src="./assets/nineworks-logo.svg?v=${VERSION}" alt="NINEWORKS" />
          <div class="nw-entry-loader__bars" aria-hidden="true"><i></i><i></i><i></i></div>
          <p class="nw-entry-loader__label">WORKSPACE LOADING</p>
        </div>
      `;
      document.body.prepend(loader);
    }

    if (loader.dataset.bound === "true") return;
    loader.dataset.bound = "true";

    const startedAt = performance.now();
    let finished = false;
    let observer = null;

    const finish = () => {
      if (finished) return;
      finished = true;
      observer?.disconnect();
      const elapsed = performance.now() - startedAt;
      const delay = Math.max(0, 360 - elapsed);
      window.setTimeout(() => {
        loader.classList.add("is-leaving");
        window.setTimeout(() => loader.remove(), 220);
      }, delay);
    };

    const checkReady = () => {
      const root = document.documentElement;
      if (root.classList.contains("nw-auth-resolved") && root.classList.contains("nw-theme-ready")) finish();
    };

    observer = new MutationObserver(checkReady);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    checkReady();
    window.setTimeout(finish, 2200);
  }

  function loadModule(path, label) {
    import(`${path}?v=${VERSION}`).catch((error) => console.warn(`${label} 로드 실패`, error));
  }

  function init() {
    document.documentElement.classList.add("nw-editorial-dashboard", "nw-universal-system");
    mountEntryLoader();
    loadModule("./quick-schedule-input.js", "빠른 일정 입력 모듈");
    loadModule("./calendar-density-runtime.js", "캘린더 간격 보정 모듈");
    loadModule("./route-visual-stability.js", "페이지 전환 안정화 모듈");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
