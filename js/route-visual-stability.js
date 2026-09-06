(() => {
  "use strict";

  let timer = 0;

  function beginRouteMask() {
    const root = document.documentElement;
    root.classList.add("nw-route-switching");
    window.clearTimeout(timer);
    timer = window.setTimeout(() => root.classList.remove("nw-route-switching"), 180);
  }

  document.addEventListener("click", (event) => {
    if (!event.target.closest("[data-route]")) return;
    beginRouteMask();
    window.setTimeout(() => {
      window.scrollTo(0, 0);
      window.dispatchEvent(new Event("resize"));
    }, 0);
  }, true);

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".workspace-tab, .v2-settings-tab")) return;
    beginRouteMask();
  }, true);
})();
