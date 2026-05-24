// js/register.js
import { auth, db } from "./firebase.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// Local runtime state cache for holding the converted image payload
let globalBase64ImageString = "";

// A. IMAGE SELECTION & BASE64 PROCESSING ENGINE
// Runs immediately when a user selects a file, before clicking submit
document.addEventListener("DOMContentLoaded", () => {
  const photoFileInput = document.getElementById("photo"); // Matches registration HTML input ID
  const avatarPreview = document.getElementById("avatarPreview"); // Target preview image if you have one

  if (photoFileInput) {
    photoFileInput.addEventListener("change", function (e) {
      const targetFile = e.target.files[0];
      
      if (targetFile) {
        // Enforce a 1MB file limit to prevent Firestore document storage overflow crashes
        if (targetFile.size > 1024 * 1024) {
          alert("⚠️ The chosen photo is too large! Please choose an image smaller than 1MB.");
          photoFileInput.value = "";
          return;
        }

        const fileReader = new FileReader();
        
        fileReader.onload = function (event) {
          globalBase64ImageString = event.target.result; // Saves the "data:image/jpeg;base64,..." string
          
          // If you have a preview image element, update its view source
          if (avatarPreview) {
            avatarPreview.src = globalBase64ImageString;
          }
        };
        
        fileReader.readAsDataURL(targetFile);
      }
    });
  }
});

// B. EXPOSED GLOBAL REGISTER CONTROLLER
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

  // Mandatory photo requirement check
  if (!globalBase64ImageString) {
    alert("⚠️ Please select a profile photo before submitting registration.");
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
    // Now safely passes the processed raw text image string into photoURL!
    await setDoc(doc(db, "members", user.uid), {
      uid: user.uid,
      name: name,
      phone: phone,
      address: village, 
      email: email,
      photoURL: globalBase64ImageString, // Fixed! No longer an empty string ""
      status: "pending",
      role: "member",
      createdAt: new Date().toISOString()
    });

    alert("✅ Member Registration Completed Successfully!");

    // Clear runtime memory values upon completion
    globalBase64ImageString = "";

    // 5. REDIRECT DIRECTLY TO THE ADMIN INTERFACE PIPELINE
    window.location.href = "admin-dashboard.html";

  } catch (error) {
    console.error("Critical failure during core registration process flow:", error);
    alert(`Registration Error: ${error.message}`);
  } finally {
    loading.style.display = "none";
  }
};
