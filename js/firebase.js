import "./fullcalendar-native-events.js?v=20260803-1";
import "./calendar-past-week-collapse.js?v=20260810-1";
import "./calendar-duration-resize.js?v=20260804-4";
import "./time-setting-ui-v2.js?v=20260803-1";
import "./calendar-visual-polish.js?v=20260804-2";
import "./calendar-card-hierarchy.js?v=20260803-3";
import "./ui-enhancements.js";
import "./ipad-touch-support.js?v=20260803-1";
import "./qa-management-v2.js?v=20260811-2";
import "./qa-save-fix.js?v=20260811-1";
import "./sales-pipeline.js?v=20260807-1";
import "./finance-ui-loader.js?v=20260807-1";
import "./finance-management-v3.js?v=20260807-1";
import "./finance-monthly-simple.js?v=20260807-1";
import "./finance-monthly-auto-received.js?v=20260807-2";
import "./finance-receivable-semantics.js?v=20260807-1";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const interactionStyle = document.createElement("link");
interactionStyle.rel = "stylesheet";
interactionStyle.href = new URL("../css/interaction-fixes.css?v=20260803-1", import.meta.url).href;
document.head.appendChild(interactionStyle);

const firebaseConfig = {
  apiKey: "AIzaSyBXhDb0jyhIR4G1ho6Y7V8sibwvENI2r8k",
  authDomain: "nineworks-crm.firebaseapp.com",
  projectId: "nineworks-crm",
  storageBucket: "nineworks-crm.firebasestorage.app",
  messagingSenderId: "1096147745343",
  appId: "1:1096147745343:web:cbec82631cbc2d9db1968a"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

const authPersistenceReady = setPersistence(auth, browserLocalPersistence)
  .then(() => true)
  .catch((error) => {
    console.warn("Firebase 로그인 유지 설정 실패", error);
    return false;
  });

function authErrorMessage(error) {
  const code = String(error?.code || "");
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found") || code.includes("invalid-email")) {
    return "아이디 또는 비밀번호가 올바르지 않습니다.";
  }
  if (code.includes("too-many-requests")) {
    return "로그인 시도가 많습니다. 잠시 후 다시 시도해주세요.";
  }
  if (code.includes("network-request-failed")) {
    return "인터넷 연결을 확인한 뒤 다시 로그인해주세요.";
  }
  if (code.includes("user-disabled")) {
    return "사용이 중지된 계정입니다. 관리자에게 문의해주세요.";
  }
  if (code.includes("operation-not-allowed")) {
    return "로그인 설정이 완료되지 않았습니다. 관리자에게 문의해주세요.";
  }
  return "로그인하지 못했습니다. 입력 정보를 확인해주세요.";
}

function setLoginFeedback(message, type = "info") {
  const notice = document.querySelector(".login-form__notice");
  const form = document.querySelector("#loginForm");
  if (!notice) return;

  notice.textContent = message;
  notice.classList.remove("is-info", "is-success", "is-error");
  notice.classList.add(`is-${type}`);
  notice.setAttribute("role", type === "error" ? "alert" : "status");
  notice.setAttribute("aria-live", type === "error" ? "assertive" : "polite");
  form?.classList.toggle("has-auth-error", type === "error");
}

async function signInWithEmailAndPassword(authInstance, email, password) {
  setLoginFeedback("계정 정보를 확인하고 있습니다.", "info");
  try {
    await authPersistenceReady;
    const credential = await firebaseSignInWithEmailAndPassword(authInstance, email, password);
    setLoginFeedback("로그인 상태가 이 기기에 유지됩니다.", "success");
    return credential;
  } catch (error) {
    setLoginFeedback(authErrorMessage(error), "error");
    throw error;
  }
}

function initializeLoginFeedback() {
  const form = document.querySelector("#loginForm");
  if (!form || form.dataset.feedbackReady === "true") return;
  form.dataset.feedbackReady = "true";

  ["#loginEmail", "#loginPassword"].forEach((selector) => {
    document.querySelector(selector)?.addEventListener("input", () => {
      if (!form.classList.contains("has-auth-error")) return;
      form.classList.remove("has-auth-error");
      setLoginFeedback("가입한 팀원 아이디 또는 기존 이메일 계정으로 로그인해주세요.", "info");
    });
  });
}

const firebaseApi = {
  auth,
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  serverTimestamp,
  authPersistenceReady,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};

window.NineworksFirebase = firebaseApi;

queueMicrotask(async () => {
  initializeLoginFeedback();

  import("./team-signup.js?v=20260803-1").catch((error) => console.warn("팀원 가입 모듈 로드 실패", error));

  import("./team-enhancements.js")
    .then(() => import("./dynamic-member-roster.js?v=20260803-1"))
    .catch((error) => console.warn("가입 팀원 담당자 목록 모듈 로드 실패", error));

  import("./interface-fixes.js").catch((error) => console.warn("인터페이스 보정 모듈 로드 실패", error));
  import("./goals.js").catch((error) => console.warn("목표일정 모듈 로드 실패", error));
  import("./calendar-resize-share.js").catch((error) => console.warn("캘린더 공유·크기 조절 모듈 로드 실패", error));
  import("./task-completion.js").catch((error) => console.warn("일정 완료 기능 모듈 로드 실패", error));
  import("./calendar-summary-grid.js?v=20260803-1").catch((error) => console.warn("캘린더 요약 레이아웃 모듈 로드 실패", error));
  import("./browser-reminders-v2.js?v=20260803-2")
    .then(() => Promise.all([
      import("./reminder-settings-page.js?v=20260803-1"),
      import("./reminder-sound-repeat.js?v=20260803-1"),
      import("./optional-schedule-settings.js?v=20260803-1")
    ]))
    .catch((error) => console.warn("개인 알림 관리 모듈 로드 실패", error));
});

export {
  auth,
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  serverTimestamp,
  authPersistenceReady,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};
