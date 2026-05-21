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


// ONLY ADMIN EMAIL
const ADMIN_EMAIL = "nicholasbagenda@gmail.com";

let allMembers = []; // store for search + editing


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


// LOAD MEMBERS
async function loadMembers() {

  const membersList = document.getElementById("membersList");
  membersList.innerHTML = "";

  allMembers = [];

  let total = 0;
  let pending = 0;
  let approved = 0;

  const querySnapshot = await getDocs(collection(db, "members"));

  querySnapshot.forEach((member) => {

    const data = member.data();
    const id = member.id;

    allMembers.push({ id, ...data });

    total++;

    if (data.status === "pending") pending++;
    if (data.status === "approved") approved++;

    const div = document.createElement("div");
    div.classList.add("card");

    div.innerHTML = `
      <div style="text-align:center;">

        <img src="${data.photoURL || 'https://via.placeholder.com/80'}"
        class="member-photo"
        style="width:80px;height:80px;border-radius:50%;object-fit:cover;">

        <input type="text" id="name-${id}" value="${data.name || ''}" style="margin-top:5px;width:90%;">

        <input type="text" id="email-${id}" value="${data.email || ''}" style="margin-top:5px;width:90%;">

        <input type="text" id="phone-${id}" value="${data.phone || ''}" style="margin-top:5px;width:90%;">

        <p>Status:
          <b>${data.status}</b>
        </p>

        <!-- UPDATE BUTTON -->
        <button onclick="updateMember('${id}')"
        style="margin-top:10px;background:#2563eb;color:white;padding:6px;border:none;">
          💾 Save Changes
        </button>

        <!-- APPROVE / REJECT -->
        <div style="margin-top:10px;">

          <button onclick="approveMember('${id}')">
            ✅ Approve
          </button>

          <button onclick="rejectMember('${id}')"
          style="background:red;">
            ❌ Reject
          </button>

        </div>

      </div>
    `;

    membersList.appendChild(div);

  });

  // STATS UPDATE
  document.getElementById("totalMembers").innerText = total;
  document.getElementById("pendingMembers").innerText = pending;
  document.getElementById("approvedMembers").innerText = approved;
}


// ✏️ UPDATE MEMBER INFO (NEW FEATURE)
window.updateMember = async function (id) {

  const newName = document.getElementById(`name-${id}`).value;
  const newEmail = document.getElementById(`email-${id}`).value;
  const newPhone = document.getElementById(`phone-${id}`).value;

  if (!newName || !newEmail) {
    alert("Name and Email are required!");
    return;
  }

  await updateDoc(doc(db, "members", id), {
    name: newName,
    email: newEmail,
    phone: newPhone
  });

  alert("✅ Member updated successfully!");

  loadMembers();
};


// APPROVE
window.approveMember = async function (id) {

  await updateDoc(doc(db, "members", id), {
    status: "approved"
  });

  alert("✅ Member Approved");
  loadMembers();
};


// REJECT
window.rejectMember = async function (id) {

  await updateDoc(doc(db, "members", id), {
    status: "rejected"
  });

  alert("❌ Member Rejected");
  loadMembers();
};


// SEARCH
window.filterMembers = function () {

  const input = document.getElementById("searchInput").value.toLowerCase();

  allMembers.forEach((member) => {

    const cardInputs = document.getElementById(`name-${member.id}`);
    const card = cardInputs?.parentElement;

    if (!card) return;

    const text =
      (member.name + member.email + member.phone).toLowerCase();

    if (text.includes(input)) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });
};
