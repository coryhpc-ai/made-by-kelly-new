// js/firebase.js — shared Firebase config
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAA1taCR7KHcPtnp2z44r_Wt_ielb_JhQg",
  authDomain: "wildlives.firebaseapp.com",
  projectId: "wildlives",
  storageBucket: "wildlives.firebasestorage.app",
  messagingSenderId: "792162914690",
  appId: "1:792162914690:web:fd2dd9ee1f1a327a6f3f9b",
  measurementId: "G-SJ9LYWHJPS"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);