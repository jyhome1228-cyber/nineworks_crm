const style = document.createElement("link");
style.rel = "stylesheet";
style.href = new URL("../css/interface-fixes.css", import.meta.url).href;
document.head.appendChild(style);

const typographyStyle = document.createElement("link");
typographyStyle.rel = "stylesheet";
typographyStyle.href = new URL("../css/typography-refinement.css", import.meta.url).href;
document.head.appendChild(typographyStyle);

const readabilityStyle = document.createElement("link");
readabilityStyle.rel = "stylesheet";
readabilityStyle.href = new URL("../css/readability-bright.css", import.meta.url).href;
document.head.appendChild(readabilityStyle);

const api = window.NineworksFirebase;

function addVisibleLogoutButton() {
  if (document.querySelector("#topbarLogout")) return;
  const actions = document.querySelector(".topbar__actions");
  if (!actions || !api) return;

  const button = document.createElement("button");
  button.id = "topbarLogout";
  button.className = "topbar-logout";
  button.type = "button";
  button.setAttribute("aria-label", "로그아웃");
  button.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 17l5-5-5-5M15 12H3M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />
    </svg>
    <span>로그아웃</span>
  `;

  button.addEventListener("click", async () => {
    if (!window.confirm("로그아웃할까요?")) return;
    button.classList.add("is-loading");
    button.disabled = true;
    try {
      await api.signOut(api.auth);
    } catch (error) {
      console.error("로그아웃 실패", error);
      window.alert("로그아웃하지 못했습니다. 잠시 후 다시 시도해주세요.");
      button.disabled = false;
      button.classList.remove("is-loading");
    }
  });

  actions.appendChild(button);
}

function ensureLoginCopyIsCurrent() {
  const title = document.querySelector("#loginTitle");
  const emailLabel = document.querySelector("#loginEmail")?.closest(".field")?.querySelector(":scope > span");
  const notice = document.querySelector(".login-form__notice");
  const loginButton = document.querySelector("#loginForm button[type='submit']");

  if (title) title.innerHTML = "나인웍스 계정으로<br />로그인하세요.";
  if (emailLabel) emailLabel.textContent = "이메일";
  if (notice) notice.innerHTML = "Firebase에 등록된 관리자·직원 계정만 로그인할 수 있습니다.";
  if (loginButton && !loginButton.disabled) loginButton.textContent = "로그인";

  if (loginButton && !loginButton.dataset.labelObserver) {
    loginButton.dataset.labelObserver = "true";
    const observer = new MutationObserver(() => {
      if (!loginButton.disabled && loginButton.textContent.trim() !== "로그인") {
        loginButton.textContent = "로그인";
      }
    });
    observer.observe(loginButton, { childList: true, attributes: true, attributeFilter: ["disabled"] });
  }
}

function initializeInterfaceFixes() {
  addVisibleLogoutButton();
  ensureLoginCopyIsCurrent();

  const observer = new MutationObserver(() => {
    addVisibleLogoutButton();
    ensureLoginCopyIsCurrent();
  });
  const app = document.querySelector("#appView");
  if (app) observer.observe(app, { attributes: true, attributeFilter: ["hidden"] });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeInterfaceFixes, { once: true });
} else {
  initializeInterfaceFixes();
}
