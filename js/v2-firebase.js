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
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const config = {
  apiKey: "AIzaSyBXhDb0jyhIR4G1ho6Y7V8sibwvENI2r8k",
  authDomain: "nineworks-crm.firebaseapp.com",
  projectId: "nineworks-crm",
  storageBucket: "nineworks-crm.firebasestorage.app",
  messagingSenderId: "1096147745343",
  appId: "1:1096147745343:web:cbec82631cbc2d9db1968a"
};

const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

setPersistence(auth, browserLocalPersistence).catch(() => {});

export {
  auth, db, collection, doc, getDoc, getDocs, setDoc, deleteDoc,
  onSnapshot, serverTimestamp, signInWithEmailAndPassword, signOut, onAuthStateChanged
};
