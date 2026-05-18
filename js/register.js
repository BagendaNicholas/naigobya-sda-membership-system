import { auth, db, storage } from "./firebase.js";

import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import { ref, set } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-database.js";

import { ref as sRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-storage.js";


// REGISTER FUNCTION
window.registerUser = async function () {

  const name = document.getElementById("name").value;
  const phone = document.getElementById("phone").value;
  const village = document.getElementById("village").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const photo = document.getElementById("photo").files[0];

  if (!name || !phone || !village || !email || !password) {
    alert("Please fill all fields");
    return;
  }

  try {

    // 1. Create Auth User
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Upload Photo
    let photoURL = "";

    if (photo) {
      const photoRef = sRef(storage, "members/" + user.uid);
      await uploadBytes(photoRef, photo);
      photoURL = await getDownloadURL(photoRef);
    }

    // 3. Save to Realtime Database
    await set(ref(db, "members/" + user.uid), {
      name: name,
      phone: phone,
      village: village,
      email: email,
      photo: photoURL,
      status: "pending",
      role: "member"
    });

    alert("Registration successful! Waiting for approval.");

    window.location.href = "index.html";

  } catch (error) {
    alert(error.message);
  }
};
