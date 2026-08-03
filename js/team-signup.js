const signupStyle = document.createElement("link");
signupStyle.rel = "stylesheet";
signupStyle.href = new URL("../css/team-signup.css?v=20260803-1", import.meta.url).href;
document.head.appendChild(signupStyle);

const api = window.NineworksFirebase;
const FIREBASE_API_KEY = "AIzaSyBXhDb0jyhIR4G1ho6Y7V8sibwvENI2r8k";
const FIREBASE_PROJECT_ID = "nineworks-crm";
const MANAGEMENT_CODE_HASH = "243d9c2bcab9e6499473c879c31cc936c2b8ab484784d1aa73941ad0e68194da";

function normalizeLoginId(value = "") {
  const raw = String(value).trim();
  if (raw.includes("@")) return raw.toLowerCase();
  return `${raw.toLowerCase()}@9workscrm.cloud`;
}

function escapeText(value = "") {
  return String(value).trim();
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(String(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function setSignupFeedback(message = "", type = "error") {
  const feedback = document.querySelector("#signupFeedback");
  if (!feedback) return;
  feedback.textContent = message;
  feedback.className = "signup-form__feedback";
  if (message) feedback.classList.add("is-visible", `is-${type}`);
}

function setSignupLoading(loading) {
  const submit = document.querySelector("#signupForm button[type='submit']");
  const cancel = document.querySelector("#closeSignupModalBottom");
  if (submit) {
    submit.disabled = loading;
    submit.textContent = loading ? "가입 처리 중..." : "팀원 가입";
  }
  if (cancel) cancel.disabled = loading;
}

function openSignupModal() {
  const backdrop = document.querySelector("#signupBackdrop");
  const modal = document.querySelector("#signupModal");
  if (!backdrop || !modal) return;
  document.querySelector("#signupForm")?.reset();
  setSignupFeedback("");
  backdrop.hidden = false;
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  window.setTimeout(() => document.querySelector("#signupName")?.focus(), 60);
}

function closeSignupModal() {
  const backdrop = document.querySelector("#signupBackdrop");
  const modal = document.querySelector("#signupModal");
  if (backdrop) backdrop.hidden = true;
  if (modal) modal.hidden = true;
  document.body.style.overflow = "";
}

function firebaseErrorMessage(code = "") {
  const value = String(code).toUpperCase();
  if (value.includes("EMAIL_EXISTS")) return "이미 사용 중인 아이디입니다.";
  if (value.includes("WEAK_PASSWORD")) return "비밀번호는 6자 이상 입력해주세요.";
  if (value.includes("INVALID_EMAIL")) return "아이디 형식이 올바르지 않습니다.";
  if (value.includes("OPERATION_NOT_ALLOWED")) return "가입 기능이 활성화되지 않았습니다. 관리자에게 문의해주세요.";
  if (value.includes("TOO_MANY_ATTEMPTS")) return "가입 시도가 많습니다. 잠시 후 다시 시도해주세요.";
  return "가입을 완료하지 못했습니다. 입력 내용을 확인해주세요.";
}

async function createFirebaseAccount(email, password) {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(firebaseErrorMessage(result?.error?.message));
    error.code = result?.error?.message || "SIGNUP_FAILED";
    throw error;
  }
  return result;
}

function firestoreString(value) {
  return { stringValue: String(value || "") };
}

async function createTeamProfile({ localId, idToken, name, email, loginId, phone }) {
  const now = new Date().toISOString();
  const endpoint = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${encodeURIComponent(localId)}`;
  const response = await fetch(endpoint, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`
    },
    body: JSON.stringify({
      fields: {
        uid: firestoreString(localId),
        name: firestoreString(name),
        email: firestoreString(email),
        loginId: firestoreString(loginId),
        phone: firestoreString(phone),
        role: firestoreString("staff"),
        active: { booleanValue: true },
        teamMember: { booleanValue: true },
        createdAt: { timestampValue: now },
        updatedAt: { timestampValue: now }
      }
    })
  });
  if (!response.ok) {
    const detail = await response.text();
    console.warn("팀원 프로필 저장 실패", detail);
    throw new Error("계정은 생성됐지만 팀원 정보를 저장하지 못했습니다. 관리자에게 문의해주세요.");
  }
}

async function handleSignup(event) {
  event.preventDefault();
  setSignupFeedback("");

  const name = escapeText(document.querySelector("#signupName")?.value);
  const loginId = escapeText(document.querySelector("#signupLoginId")?.value).toLowerCase();
  const phone = escapeText(document.querySelector("#signupPhone")?.value);
  const password = document.querySelector("#signupPassword")?.value || "";
  const passwordConfirm = document.querySelector("#signupPasswordConfirm")?.value || "";
  const managementCode = escapeText(document.querySelector("#signupManagementCode")?.value).toLowerCase();

  if (name.length < 2) {
    setSignupFeedback("이름을 두 글자 이상 입력해주세요.");
    return;
  }
  if (!/^[a-z0-9._-]{4,30}$/.test(loginId)) {
    setSignupFeedback("아이디는 영문 소문자, 숫자, 점, 밑줄로 4자 이상 입력해주세요.");
    return;
  }
  if (!/^[0-9-]{9,15}$/.test(phone)) {
    setSignupFeedback("연락처를 올바르게 입력해주세요.");
    return;
  }
  if (password.length < 6) {
    setSignupFeedback("비밀번호는 6자 이상 입력해주세요.");
    return;
  }
  if (password !== passwordConfirm) {
    setSignupFeedback("비밀번호가 서로 일치하지 않습니다.");
    return;
  }

  const codeHash = await sha256(managementCode);
  if (codeHash !== MANAGEMENT_CODE_HASH) {
    setSignupFeedback("관리코드가 올바르지 않습니다.");
    return;
  }

  setSignupLoading(true);
  try {
    const email = normalizeLoginId(loginId);
    const account = await createFirebaseAccount(email, password);
    await createTeamProfile({
      localId: account.localId,
      idToken: account.idToken,
      name,
      email,
      loginId,
      phone: phone.replace(/[^0-9]/g, "")
    });

    setSignupFeedback("가입이 완료되었습니다. 로그인 중입니다.", "success");
    await api.signInWithEmailAndPassword(api.auth, email, password);
    window.setTimeout(closeSignupModal, 350);
  } catch (error) {
    console.error("팀원 가입 실패", error);
    setSignupFeedback(error?.message || firebaseErrorMessage(error?.code));
  } finally {
    setSignupLoading(false);
  }
}

function createSignupModal() {
  if (document.querySelector("#signupModal")) return;

  const backdrop = document.createElement("div");
  backdrop.id = "signupBackdrop";
  backdrop.className = "signup-backdrop";
  backdrop.hidden = true;

  const modal = document.createElement("section");
  modal.id = "signupModal";
  modal.className = "signup-modal";
  modal.hidden = true;
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "signupModalTitle");
  modal.innerHTML = `
    <div class="signup-modal__head">
      <div>
        <p class="eyebrow">TEAM REGISTRATION</p>
        <h2 id="signupModalTitle">팀원 가입</h2>
        <p>관리코드를 전달받은 나인웍스 팀원만 가입할 수 있습니다.</p>
      </div>
      <button id="closeSignupModal" class="icon-button" type="button" aria-label="가입 창 닫기">×</button>
    </div>
    <form id="signupForm" class="signup-form">
      <div class="signup-form__grid">
        <label class="field"><span>이름</span><input id="signupName" type="text" autocomplete="name" placeholder="이름을 입력하세요" required /></label>
        <label class="field"><span>연락처</span><input id="signupPhone" type="tel" autocomplete="tel" placeholder="010-0000-0000" required /></label>
      </div>
      <label class="field"><span>아이디</span><input id="signupLoginId" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="영문·숫자 4자 이상" required /></label>
      <p class="signup-form__help">가입한 아이디로 로그인할 수 있습니다. 이메일 주소는 입력하지 않아도 됩니다.</p>
      <div class="signup-form__grid">
        <label class="field"><span>비밀번호</span><input id="signupPassword" type="password" autocomplete="new-password" placeholder="6자 이상" required /></label>
        <label class="field"><span>비밀번호 확인</span><input id="signupPasswordConfirm" type="password" autocomplete="new-password" placeholder="비밀번호 재입력" required /></label>
      </div>
      <label class="field"><span>관리코드</span><input id="signupManagementCode" type="password" autocomplete="off" placeholder="관리코드를 입력하세요" required /></label>
      <div id="signupFeedback" class="signup-form__feedback" role="alert" aria-live="assertive"></div>
      <div class="signup-form__actions">
        <button id="closeSignupModalBottom" class="button button--ghost" type="button">취소</button>
        <button class="button button--primary" type="submit">팀원 가입</button>
      </div>
    </form>
  `;

  document.body.append(backdrop, modal);
  backdrop.addEventListener("click", closeSignupModal);
  modal.querySelector("#closeSignupModal")?.addEventListener("click", closeSignupModal);
  modal.querySelector("#closeSignupModalBottom")?.addEventListener("click", closeSignupModal);
  modal.querySelector("#signupForm")?.addEventListener("submit", handleSignup);
}

function updateLoginScreen() {
  const title = document.querySelector("#loginTitle");
  const label = document.querySelector("#loginEmail")?.closest(".field")?.querySelector("span");
  const input = document.querySelector("#loginEmail");
  const submit = document.querySelector("#loginForm button[type='submit']");
  const adminLabel = document.querySelector(".login-copy .admin-label");
  const description = document.querySelector(".login-copy > p:last-child");
  const notice = document.querySelector(".login-form__notice");

  if (title) title.innerHTML = "팀원 계정으로<br />로그인하세요.";
  if (adminLabel) adminLabel.textContent = "TEAM WORKSPACE";
  if (description) description.textContent = "나인웍스 팀원이 함께 일정과 업무를 관리하는 내부 공간입니다.";
  if (label) label.textContent = "아이디 또는 이메일";
  if (input) {
    input.type = "text";
    input.inputMode = "text";
    input.placeholder = "아이디를 입력하세요";
    input.autocapitalize = "none";
    input.spellcheck = false;
  }
  if (submit) submit.textContent = "로그인";
  if (notice) {
    notice.textContent = "계정이 없다면 아래 팀원 가입을 이용해주세요.";
    notice.classList.add("is-info");
  }

  const form = document.querySelector("#loginForm");
  if (form && !document.querySelector("#openSignupModal")) {
    const secondary = document.createElement("div");
    secondary.className = "login-form__secondary";
    secondary.innerHTML = '<button id="openSignupModal" class="signup-open-button" type="button">팀원 가입하기</button>';
    const noticeElement = form.querySelector(".login-form__notice");
    form.insertBefore(secondary, noticeElement || null);
    secondary.querySelector("#openSignupModal")?.addEventListener("click", openSignupModal);
  }

  if (submit && !submit.dataset.teamLabelObserver) {
    submit.dataset.teamLabelObserver = "true";
    new MutationObserver(() => {
      if (!submit.disabled && submit.textContent === "관리자 로그인") submit.textContent = "로그인";
    }).observe(submit, { childList: true, characterData: true, subtree: true });
  }

  if (form && !form.dataset.loginIdNormalizer) {
    form.dataset.loginIdNormalizer = "true";
    form.addEventListener("submit", () => {
      const loginInput = document.querySelector("#loginEmail");
      if (!loginInput) return;
      const original = loginInput.value.trim();
      if (!original || original.includes("@")) return;
      loginInput.value = normalizeLoginId(original);
      window.setTimeout(() => {
        if (document.querySelector("#loginView")?.hidden) return;
        loginInput.value = original;
      }, 0);
    }, true);
  }
}

function initializeTeamSignup() {
  createSignupModal();
  updateLoginScreen();
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !document.querySelector("#signupModal")?.hidden) closeSignupModal();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeTeamSignup, { once: true });
} else {
  initializeTeamSignup();
}
