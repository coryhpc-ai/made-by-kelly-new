// js/firebase.js — shared Firebase config
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyATmW_ozZ7IhRFGRMiObdv56odRdCRguho",
  authDomain: "made-by-kelly.firebaseapp.com",
  projectId: "made-by-kelly",
  storageBucket: "made-by-kelly.firebasestorage.app",
  messagingSenderId: "375313114709",
  appId: "1:375313114709:web:1fea72856aaf0fc69f56dc",
  measurementId: "G-CF5JEHQ7JJ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);