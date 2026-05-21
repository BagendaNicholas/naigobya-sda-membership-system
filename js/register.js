// js/register.js
import { auth, db } from "./firebase.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

window.registerUser = async function () {
  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const village = document.getElementById("village").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const photoString = document.getElementById("photoBase64String").value;
  const loading = document.getElementById("loading");

  if (!name || !phone || !village || !email || !password) {
    alert("⚠️ Please fill all fields.");
    return;
  }

  if (password.length < 6) {
    alert("⚠️ Password must be at least 6 characters.");
    return;
  }

  try {
    loading.style.display = "block";

    // Create user authentication node
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCred.user;

    // Save user metrics directly into Firestore, converting photoString into text field data
    await setDoc(doc(db, "members", user.uid), {
      uid: user.uid,
      name: name,
      phone: phone,
      address: village, 
      email: email,
      photoURL: photoString || "", // Injects Base64 data directly, bypassing Cloud Storage rules entirely
      status: "pending",
      role: "member",
      createdAt: new Date().toISOString()
    });

    alert("✅ Registration Successful!");
    window.location.href = "index.html";

  } catch (error) {
    console.error(error);
    alert(error.message);
  } finally {
    loading.style.display = "none";
  }
};
