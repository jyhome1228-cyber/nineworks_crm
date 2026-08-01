import "./ui-enhancements.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  signInWithEmailAndPassword,
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
  try {
    const memberModule = await import("./member-cleanup.js");
    await memberModule.initializeMemberCleanup();
  } catch (error) {
    console.warn("담당자 정리 모듈 로드 실패", error);
  }

  import("./team-enhancements.js").catch((error) => console.warn("팀 기능 모듈 로드 실패", error));
  import("./interface-fixes.js").catch((error) => console.warn("인터페이스 보정 모듈 로드 실패", error));
  import("./goals.js").catch((error) => console.warn("목표일정 모듈 로드 실패", error));
  import("./calendar-event-details.js").catch((error) => console.warn("캘린더 상세 모듈 로드 실패", error));
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
