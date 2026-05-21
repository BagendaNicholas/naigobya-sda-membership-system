// js/register.js
import { auth, db, storage } from "./firebase.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
import { ref as sRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-storage.js";

// EXPOSED GLOBAL REGISTER CONTROLLER
window.registerUser = async function () {
  // Capture DOM data metrics safely
  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const village = document.getElementById("village").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const photo = document.getElementById("photo").files[0];
  const loading = document.getElementById("loading");

  // 1. DATA INPUT EMPTY VALIDATIONS
  if (!name || !phone || !village || !email || !password) {
    alert("⚠️ Please complete all required form fields.");
    return;
  }

  // 2. SECURITY POLICY BOUNDS LENGTH CHECK
  if (password.length < 6) {
    alert("⚠️ Authentication security requires passwords to be at least 6 characters.");
    return;
  }

  // 3. FILE METRIC POINTER CHECK
  if (!photo) {
    alert("⚠️ Please capture or upload an introductory profile photo.");
    return;
  }

  // 4. STORAGE FILE BINARY COMPRESSION LIMIT WATCH (2MB)
  if (photo.size > 2 * 1024 * 1024) {
    alert("⚠️ Upload limit exceeded. Profile image files must remain below 2MB.");
    return;
  }

  try {
    // Activate loading UI display indicator state
    loading.style.display = "block";

    // 5. INITIATE USER PROVISIONING
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCred.user;

    // 6. MAP COMPONENT TARGET TO STORAGE STORAGE BUCKETS
    const imageRef = sRef(storage, `members/${user.uid}`);

    // Push raw file bytes up to cloud storage
    await uploadBytes(imageRef, photo);

    // Retrieve live publicly signed web asset connection path
    const photoURL = await getDownloadURL(imageRef);

    // 7. WRITE CORE RECORD SETS DOWN INTO CLOUD FIRESTORE
    // "address" parameter explicitly maps to your dashboard tracking card logic
    await setDoc(doc(db, "members", user.uid), {
      uid: user.uid,
      name: name,
      phone: phone,
      address: village, // Saved matching your admin dashboard's profile requirements
      email: email,
      photoURL: photoURL,
      status: "pending",
      role: "member",
      createdAt: new Date().toISOString()
    });

    alert("✅ Member Registration Completed Successfully!");

    // 8. FORWARD USER ALONG ROUTING PIPELINE DIRECTLY TO THE ADMIN INTERFACE
    window.location.href = "admin-dashboard.html";

  } catch (error) {
    console.error("Critical failure during core registration process flow:", error);
    alert(`Registration Error: ${error.message}`);
  } finally {
    // Safely remove loading visual items from screen flow
    loading.style.display = "none";
  }
};
