import { auth } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

let tapCount = 0;

// 5 TAP UNLOCK 🔑
window.onload = () => {
  document.getElementById("logo").addEventListener("click", () => {

    tapCount++;

    if (tapCount === 5) {
      document.getElementById("adminPanel").style.display = "block";
      alert("🔑 Admin Mode Unlocked");
      tapCount = 0;
    }

    setTimeout(() => {
      tapCount = 0;
    }, 2000);

  });
};

// ADMIN LOGIN
window.loginAdmin = async function () {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {

    await signInWithEmailAndPassword(auth, email, password);

    alert("Login successful!");
    window.location.href = "admin-dashboard.html";

  } catch (error) {
    alert(error.message);
  }

};
