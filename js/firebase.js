import "./fullcalendar-native-events.js?v=20260803-1";
import "./ui-enhancements.js";
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

setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn("Firebase 로그인 유지 설정 실패", error);
});

function authErrorMessage(error) {
  const code = String(error?.code || "");
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found") || code.includes("invalid-email")) {
    return "이메일 또는 비밀번호가 올바르지 않습니다.";
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
    const credential = await firebaseSignInWithEmailAndPassword(authInstance, email, password);
    setLoginFeedback("로그인되었습니다.", "success");
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
      setLoginFeedback("Firebase에 등록된 관리자·직원 계정으로 로그인해주세요.", "info");
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
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};

window.NineworksFirebase = firebaseApi;

queueMicrotask(async () => {
  initializeLoginFeedback();

  try {
    const memberModule = await import("./member-cleanup.js");
    await memberModule.initializeMemberCleanup();
  } catch (error) {
    console.warn("담당자 정리 모듈 로드 실패", error);
  }

  import("./team-enhancements.js").catch((error) => console.warn("팀 기능 모듈 로드 실패", error));
  import("./interface-fixes.js").catch((error) => console.warn("인터페이스 보정 모듈 로드 실패", error));
  import("./goals.js").catch((error) => console.warn("목표일정 모듈 로드 실패", error));
  import("./calendar-resize-share.js").catch((error) => console.warn("캘린더 공유·크기 조절 모듈 로드 실패", error));
  import("./task-completion.js").catch((error) => console.warn("일정 완료 기능 모듈 로드 실패", error));
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
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};
