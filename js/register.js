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

  // INPUT VALUES
  const name =
  document.getElementById("name").value.trim();

  const dob =
  document.getElementById("dob").value.trim();

  const country =
  document.getElementById("country").value.trim();

  const phone =
  document.getElementById("phone").value.trim();

  const pastor =
  document.getElementById("pastor").value.trim();

  const baptismDate =
  document.getElementById("date").value.trim();

  const district =
  document.getElementById("district").value.trim();

  const village =
  document.getElementById("village").value.trim();

  const email =
  document.getElementById("email").value.trim();

  const password =
  document.getElementById("password").value.trim();

  const photoString =
  document.getElementById("photoBase64String").value;

  const loading =
  document.getElementById("loading");


  // VALIDATION
  if(
    !name ||
    !dob ||
    !country ||
    !phone ||
    !pastor ||
    !baptismDate ||
    !district ||
    !village ||
    !email ||
    !password
  ){

    alert("⚠️ Please fill all fields.");
    return;

  }


  // PASSWORD CHECK
  if(password.length < 6){

    alert(
      "⚠️ Password must be at least 6 characters."
    );

    return;

  }


  try{

    // SHOW LOADING
    loading.style.display = "block";

    // CREATE FIREBASE AUTH ACCOUNT
    const userCred =
    await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCred.user;


    // SAVE MEMBER DATA
    await setDoc(
      doc(db, "members", user.uid),
      {

        uid: user.uid,

        fullName: name,

        dateOfBirth: dob,

        country: country,

        phoneNumber: phone,

        pastor: pastor,

        baptismDate: baptismDate,

        district: district,

        village: village,

        email: email,

        photoURL:
        photoString || "",

        status: "pending",

        role: "member",

        church:
        "Naigobya SDA Church",

        createdAt:
        new Date().toISOString()

      }
    );


    // SUCCESS
    alert(
      "✅ Registration Successful!"
    );

    // REDIRECT
    window.location.href =
    "index.html";

  }
  catch(error){

    console.error(error);

    alert(error.message);

  }
  finally{

    // HIDE LOADING
    loading.style.display = "none";

  }

};
