// js/register.js
import { auth, db } from "./firebase.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// EXPOSED GLOBAL REGISTER CONTROLLER
window.registerUser = async function () {
  // 1. Capture ALL form inputs from DOM safely
  const name = document.getElementById("name").value.trim();
  const dob = document.getElementById("dob").value;
  const phone = document.getElementById("phone").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  
  const village = document.getElementById("village").value.trim();
  const county = document.getElementById("county").value.trim();
  const district = document.getElementById("district").value.trim();
  const country = document.getElementById("country").value.trim();
  
  const church = document.getElementById("church").value.trim();
  const area = document.getElementById("area").value.trim();
  const pastor = document.getElementById("pastor").value.trim();
  const dobaptism = document.getElementById("dobaptism").value;
  
  // Grabs the optimized image string converted instantly in the background by register.html
  const photoBase64String = document.getElementById("photoBase64String").value;
  const loading = document.getElementById("loading");

  // 2. DATA INPUT EMPTY VALIDATIONS (Checking all 10 profile fields + password)
  if (!name || !dob || !phone || !email || !password || !village || !county || !district || !country || !church || !area || !pastor || !dobaptism) {
    alert("⚠️ Please complete all required fields.");
    return;
  }

  // Mandatory photo requirement check
  if (!photoBase64String) {
    alert("⚠️ Please select a profile photo. Wait a split second for automatic optimization if needed.");
    return;
  }

  // 3. SECURITY POLICY BOUNDS LENGTH CHECK
  if (password.length < 6) {
    alert("⚠️ Password must be at least 6 characters long.");
    return;
  }

  try {
    // Activate loading screen indicator
    loading.style.display = "block";

    // 4. INITIATE USER AUTH PROVISIONING
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCred.user;

    // 5. WRITE RECORD DIRECTLY INTO CLOUD FIRESTORE
    // Pushes all fields along with the small, optimized background-converted base64 payload
    await setDoc(doc(db, "members", user.uid), {
      uid: user.uid,
      name: name,
      dob: dob,
      phone: phone,
      email: email,
      village: village,
      address: village, // Retained for fallback dashboard compatibility
      county: county,
      district: district,
      country: country,
      church: church,
      area: area,
      pastor: pastor,
      dobaptism: dobaptism,
      photoURL: photoBase64String, // Saves the compressed, Firestore-safe image text string (~40-80KB)
      status: "pending",
      role: "member",
      createdAt: new Date().toISOString()
    });

    alert("✅ Member Registration Completed Successfully!");

    // 6. REDIRECT DIRECTLY TO THE HOME PAGE
    window.location.href = "index.html";

  } catch (error) {
    console.error("Critical failure during core registration process flow:", error);
    alert(`Registration Error: ${error.message}`);
  } finally {
    loading.style.display = "none";
  }
};
