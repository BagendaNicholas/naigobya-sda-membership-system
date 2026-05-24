// js/register.js

import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";


// REGISTER FUNCTION
window.registerUser = async function () {

  // GET INPUT VALUES
  const fullName = document.getElementById("fullName").value.trim();
  const dob = document.getElementById("dob").value;
  const gender = document.getElementById("gender").value;
  const phone = document.getElementById("phone").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const address = document.getElementById("address").value.trim();
  const village = document.getElementById("village").value.trim();
  const baptismStatus = document.getElementById("baptismStatus").value.trim();
  const churchRole = document.getElementById("churchRole").value.trim();
  const dateJoined = document.getElementById("dateJoined").value;
  const photoString = document.getElementById("photoBase64String").value;
  const loading = document.getElementById("loading");


  // VALIDATION
  if (!fullName || !dob || !gender || !phone || !email || !password || !village) {
    alert("⚠️ Please fill all required fields.");
    return;
  }

  if (password.length < 6) {
    alert("⚠️ Password must be at least 6 characters.");
    return;
  }


  try {

    // SHOW LOADING
    if (loading) loading.style.display = "block";


    // CREATE AUTH USER (MEMBER CHOOSES PASSWORD)
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCred.user;


    // SAVE MEMBER DATA
    await setDoc(doc(db, "members", user.uid), {

      uid: user.uid,
      fullName,
      dateOfBirth: dob,
      gender,
      phoneNumber: phone,
      email,
      address,
      village,
      baptismStatus,
      churchRole,
      dateJoined,
      photoURL: photoString || "",

      church: "Naigobya SDA Church",
      role: "member",
      status: "pending",
      createdAt: new Date().toISOString()

    });


    alert("✅ Registration Successful!");
    window.location.href = "index.html";

  }
  catch (error) {
    console.error("Registration Error:", error);
    alert(error.message);
  }
  finally {
    if (loading) loading.style.display = "none";
  }

};
