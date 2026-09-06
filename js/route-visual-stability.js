(() => {
  "use strict";

  let timer = 0;
  let mask = null;

  function ensureMask() {
    if (mask?.isConnected) return mask;
    mask = document.createElement("div");
    mask.id = "nwRouteMask";
    Object.assign(mask.style, {
      position: "fixed",
      zIndex: "9000",
      top: "64px",
      right: "0",
      bottom: "0",
      left: "0",
      background: "#f7f7f5",
      opacity: "0",
      visibility: "hidden",
      pointerEvents: "none"
    });
    document.body.appendChild(mask);
    return mask;
  }

  function beginRouteMask() {
    const root = document.documentElement;
    const layer = ensureMask();
    root.classList.add("nw-route-switching");
    layer.style.opacity = "1";
    layer.style.visibility = "visible";
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      root.classList.remove("nw-route-switching");
      layer.style.opacity = "0";
      layer.style.visibility = "hidden";
    }, 190);
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
