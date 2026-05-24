// js/register.js
import { auth, db } from "./firebase.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// EXPOSED GLOBAL REGISTER CONTROLLER
window.registerUser = async function () {
  // Capture DOM data inputs safely
  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const village = document.getElementById("village").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const loading = document.getElementById("loading");

  // 1. DATA INPUT EMPTY VALIDATIONS
  if (!name || !phone || !village || !email || !password) {
    alert("⚠️ Please complete all required fields.");
    return;
  }

  // 2. SECURITY POLICY BOUNDS LENGTH CHECK
  if (password.length < 6) {
    alert("⚠️ Password must be at least 6 characters long.");
    return;
  }

  try {
    // Activate loading screen indicator
    loading.style.display = "block";

    // 3. INITIATE USER AUTH PROVISIONING
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCred.user;

    // 4. WRITE RECORD DIRECTLY INTO CLOUD FIRESTORE
    // Bypasses Firebase Storage entirely to avoid billing limitations!
    await setDoc(doc(db, "members", user.uid), {
      uid: user.uid,
      name: name,
      phone: phone,
      address: village, 
      email: email,
      photoURL: "", // Dashboard handles beautiful initials icon automatically
      status: "pending",
      role: "member",
      createdAt: new Date().toISOString()
    });

    alert("✅ Member Registration Completed Successfully!");

    // 5. REDIRECT DIRECTLY TO THE ADMIN INTERFACE PIPELINE
    window.location.href = "admin-dashboard.html";

  } catch (error) {
    console.error("Critical failure during core registration process flow:", error);
    alert(`Registration Error: ${error.message}`);
  } finally {
    loading.style.display = "none";
  }
};
