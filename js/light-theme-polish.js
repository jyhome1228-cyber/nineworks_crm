(() => {
  "use strict";

  const id = "nineworks-light-theme-polish";
  if (document.getElementById(id)) return;

  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = new URL("../css/light-theme-polish.css?v=20260830-1", import.meta.url).href;
  document.head.appendChild(link);
})();
