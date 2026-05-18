import { auth } from "./firebase.js";
import { db, storage } from "./firebase.js";

import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-storage.js";
import { ref as sRef } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-storage.js";


window.registerUser = async function () {

  const name = document.getElementById("name").value;
  const phone = document.getElementById("phone").value;
  const village = document.getElementById("village").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const photo = document.getElementById("photo").files[0];

  try {

    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCred.user;

    let photoURL = "";

    if (photo) {
      const imgRef = sRef(storage, "members/" + user.uid);
      await uploadBytes(imgRef, photo);
      photoURL = await getDownloadURL(imgRef);
    }

    await setDoc(doc(db, "members", user.uid), {
      name,
      phone,
      village,
      email,
      photoURL,
      status: "pending"
    });

    alert("Registered successfully!");
    window.location.href = "index.html";

  } catch (err) {
    alert(err.message);
  }
};
