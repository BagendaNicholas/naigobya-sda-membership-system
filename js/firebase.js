// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-storage.js";
// FIXED: Changed from firebase-database to firebase-firestore
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBI9I2UV-vljVtJJgD_Z2klwL2vRnH4XOc",
  authDomain: "my-church-project-3dd99.firebaseapp.com",
  databaseURL: "https://my-church-project-3dd99-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "my-church-project-3dd99",
  storageBucket: "my-church-project-3dd99.appspot.com",
  messagingSenderId: "57141406995",
  appId: "1:57141406995:web:0cb9b4beda375df9fcfee6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase Services
const auth = getAuth(app);
const storage = getStorage(app);
const db = getFirestore(app); // FIXED: Initializing Cloud Firestore here

// Export everything cleanly
export { auth, db, storage };
