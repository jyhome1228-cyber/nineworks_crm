(() => {
  "use strict";

  const addLayoutOverrides = () => {
    if (document.getElementById("mypage-structure-style")) return;
    const style = document.createElement("style");
    style.id = "mypage-structure-style";
    style.textContent = `
      #mypagePage .goal-manager-panel .goal-page-heading {
        align-items: flex-start;
        margin-bottom: 24px;
      }
      #mypagePage .goal-manager-panel .goal-page-heading h1 {
        font-size: clamp(25px, 2.1vw, 32px);
        font-weight: 500;
        letter-spacing: -0.04em;
      }
      #mypagePage .goal-manager-panel .goal-page-heading > div > p:last-child {
        max-width: 720px;
        font-size: 14px;
        line-height: 1.65;
      }
      #mypagePage .goal-manager-panel .goal-summary-card {
        min-height: 108px;
      }
      #mypagePage .goal-manager-panel .goal-summary-card strong {
        margin-top: 16px;
        font-size: 30px;
      }
      @media (max-width: 760px) {
        #mypagePage .goal-manager-panel .goal-page-heading {
          display: grid;
        }
        #mypagePage .goal-manager-panel .goal-page-heading .button {
          width: 100%;
        }
      }
    `;
    document.head.appendChild(style);
  };

  const activateMyPageTab = (tabName) => {
    document.querySelectorAll("[data-page]").forEach((page) => {
      page.classList.toggle("is-active", page.dataset.page === "mypage");
    });
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.toggle("is-active", link.dataset.route === "mypage");
    });
    document.querySelectorAll("#mypagePage .workspace-tab").forEach((tab) => {
      tab.classList.toggle("is-active", tab.dataset.workspaceTab === tabName);
    });
    document.querySelectorAll("#mypagePage .workspace-panel").forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.workspacePanel === tabName);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const consolidateGoalPage = () => {
    const goalPage = document.querySelector("#goalsPage");
    const goalsPanel = document.querySelector('#mypagePage [data-workspace-panel="goals"]');
    if (!goalPage || !goalsPanel) return false;

    document.querySelector('.main-nav [data-route="goals"]')?.remove();

    goalsPanel.innerHTML = "";
    goalsPanel.classList.add("goal-manager-panel");

    while (goalPage.firstChild) {
      goalsPanel.appendChild(goalPage.firstChild);
    }

    const compatibilityList = document.createElement("div");
    compatibilityList.id = "goalList";
    compatibilityList.hidden = true;
    compatibilityList.setAttribute("aria-hidden", "true");
    goalsPanel.appendChild(compatibilityList);

    goalPage.remove();
    addLayoutOverrides();

    const goalsTab = document.querySelector('#mypagePage [data-workspace-tab="goals"]');
    if (goalsTab) goalsTab.textContent = "목표 일정";

    return true;
  };

  const removeLegacyTopMenus = () => {
    document.querySelector('.main-nav [data-route="mydashboard"]')?.remove();
    document.querySelector('.main-nav [data-route="goals"]')?.remove();
  };

  removeLegacyTopMenus();

  if (!consolidateGoalPage()) {
    const observer = new MutationObserver(() => {
      removeLegacyTopMenus();
      if (consolidateGoalPage()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  document.addEventListener("click", (event) => {
    const legacyGoalLink = event.target.closest('[data-route="goals"]');
    if (!legacyGoalLink) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    activateMyPageTab("goals");
  }, true);
})();