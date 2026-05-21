// js/login.js
import { auth } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

const ADMIN_EMAIL = "nicholasbagenda@gmail.com";

window.loginUserSession = async function () {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const loading = document.getElementById("loadingMessage");

    // 1. RAW FIELDS EMPTY INPUT CHECK
    if (!email || !password) {
        alert("⚠️ Please fill in both your email and password fields.");
        return;
    }

    try {
        // Trigger visual processing loading state
        loading.style.display = "block";

        // 2. ATTEMPT CORE FIREBASE SIGN IN
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const loggedUser = userCredential.user;

        // 3. SMART CROSS-ROADS ROUTING DIRECTION ENGINE
        if (loggedUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
            alert("👨‍💼 Welcome back Admin! Redirecting to Management Panel...");
            window.location.href = "admin-dashboard.html";
        } else {
            alert("✅ Login Successful! Opening your profile portal...");
            window.location.href = "church-members.html";
        }

    } catch (error) {
        console.error("Authentication exception triggered during signup trace:", error);
        
        // Map common authentication error keys into user-friendly instructions
        if (error.code === "auth/invalid-credential" || error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
            alert("❌ Access Denied: Incorrect email or password configuration.");
        } else if (error.code === "auth/invalid-email") {
            alert("⚠️ Please enter a properly formatted email address structure.");
        } else {
            alert(`⚠️ Sign-In Failed: ${error.message}`);
        }
    } finally {
        // Clear background processing spinner strings from template layout view
        loading.style.display = "none";
    }
};
