import { auth, db, storage } from "./firebase.js";

import {
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import {
  ref as sRef,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-storage.js";


// REGISTER FUNCTION
window.registerUser = async function () {

  // INPUTS
  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const village = document.getElementById("village").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const photo = document.getElementById("photo").files[0];

  const loading =
  document.getElementById("loading");


  // VALIDATION
  if (!name || !phone || !village || !email || !password) {

    alert("Please fill all fields.");
    return;

  }

  // PASSWORD LENGTH
  if (password.length < 6) {

    alert("Password must be at least 6 characters.");
    return;

  }

  // PHOTO CHECK
  if (!photo) {

    alert("Please select a profile photo.");
    return;

  }

  // IMAGE SIZE CHECK (2MB)
  if (photo.size > 2 * 1024 * 1024) {

    alert("Image must be below 2MB.");
    return;

  }

  try {

    // SHOW LOADING
    loading.style.display = "block";

    // CREATE USER
    const userCred =
    await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCred.user;

    // STORAGE PATH
    const imageRef =
    sRef(storage, `members/${user.uid}`);

    // UPLOAD IMAGE
    await uploadBytes(imageRef, photo);

    // GET IMAGE URL
    const photoURL =
    await getDownloadURL(imageRef);

    // SAVE MEMBER DATA
    await setDoc(doc(db, "members", user.uid), {

      uid: user.uid,

      name: name,

      phone: phone,

      village: village,

      email: email,

      photoURL: photoURL,

      status: "pending",

      role: "member",

      createdAt:
      new Date().toISOString()

    });

    // SUCCESS
    alert("✅ Registration Successful!");

    // REDIRECT
    window.location.href = "index.html";

  } catch (error) {

    console.error(error);

    alert(error.message);

  } finally {

    loading.style.display = "none";

  }

};
