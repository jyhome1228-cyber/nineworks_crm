(() => {
  "use strict";

  const STYLE_ID = "nineworks-editorial-dashboard-theme";

  function ensureEditorialStyle() {
    let link = document.getElementById(STYLE_ID);
    if (!link) {
      link = document.createElement("link");
      link.id = STYLE_ID;
      link.rel = "stylesheet";
      link.href = new URL("../css/editorial-dashboard-theme.css?v=20260902-1", import.meta.url).href;
      document.head.appendChild(link);
    }

    // Feature modules inject their own CSS dynamically. Keep the editorial layer last
    // so the same visual system is maintained without modifying each feature module.
    if (document.head.lastElementChild !== link) document.head.appendChild(link);
    return link;
  }

  function keepStyleLast() {
    if (document.documentElement.dataset.editorialThemeObserver === "true") return;
    document.documentElement.dataset.editorialThemeObserver = "true";

    let queued = false;
    const observer = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        const link = ensureEditorialStyle();
        if (document.head.lastElementChild !== link) document.head.appendChild(link);
      });
    });
    observer.observe(document.head, { childList: true });
  }

  function init() {
    ensureEditorialStyle();
    keepStyleLast();
    document.documentElement.classList.add("nw-editorial-dashboard");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
