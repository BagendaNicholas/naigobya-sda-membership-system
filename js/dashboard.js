import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  collection,
  getDocs,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";


// ADMIN EMAIL
const ADMIN_EMAIL = "nicholasbagenda@gmail.com";

let membersCache = [];


// AUTH CHECK
onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "admin-login.html";
    return;
  }

  if (user.email !== ADMIN_EMAIL) {
    alert("❌ Access Denied");
    window.location.href = "index.html";
    return;
  }

  loadMembers();
});


// LOGOUT
window.logoutAdmin = async function () {
  await signOut(auth);
  window.location.href = "index.html";
};


// LOAD MEMBERS FROM FIRESTORE
async function loadMembers() {

  const membersList = document.getElementById("membersList");
  membersList.innerHTML = "";

  membersCache = [];

  let total = 0;
  let pending = 0;
  let approved = 0;

  const snapshot = await getDocs(collection(db, "members"));

  snapshot.forEach((docSnap) => {

    const data = docSnap.data();
    const id = docSnap.id;

    membersCache.push({ id, ...data });

    total++;

    if (data.status === "pending") pending++;
    if (data.status === "approved") approved++;

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div style="text-align:center">

        <img src="${data.photoURL || 'https://via.placeholder.com/80'}"
        style="width:80px;height:80px;border-radius:50%;object-fit:cover;">

        <h3>${data.name || "No Name"}</h3>
        <p>${data.email || "No Email"}</p>
        <p>${data.phone || "No Phone"}</p>
        <p>${data.address || ""}</p>

        <p>Status: <b>${data.status || "pending"}</b></p>

        <button onclick="approveMember('${id}')"
        style="background:#16a34a;color:white;margin-top:8px;">
          ✅ Approve
        </button>

        <button onclick="rejectMember('${id}')"
        style="background:red;color:white;margin-top:8px;">
          ❌ Reject
        </button>

      </div>
    `;

    membersList.appendChild(card);
  });

  // UPDATE STATS
  document.getElementById("totalMembers").innerText = total;
  document.getElementById("pendingMembers").innerText = pending;
  document.getElementById("approvedMembers").innerText = approved;
}


// APPROVE MEMBER
window.approveMember = async function (id) {

  await updateDoc(doc(db, "members", id), {
    status: "approved"
  });

  loadMembers();
};


// REJECT MEMBER
window.rejectMember = async function (id) {

  await updateDoc(doc(db, "members", id), {
    status: "rejected"
  });

  loadMembers();
};


// SEARCH MEMBERS
window.filterMembers = function () {

  const value = document.getElementById("searchInput").value.toLowerCase();

  const cards = document.querySelectorAll(".card");

  cards.forEach((card) => {

    const text = card.innerText.toLowerCase();

    if (text.includes(value)) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });
};
