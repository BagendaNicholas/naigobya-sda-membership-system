import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

window.onload = async function () {

  const container = document.getElementById("membersList");

  const querySnapshot = await getDocs(collection(db, "members"));

  querySnapshot.forEach((member) => {

    const data = member.data();

    const div = document.createElement("div");

    div.style = "background:#1e293b;margin:10px;padding:10px;border-radius:10px;";

    div.innerHTML = `
      <h3>${data.name}</h3>
      <p>${data.phone}</p>
      <p>Status: ${data.status}</p>

      <button onclick="approve('${member.id}')">Approve</button>
      <button onclick="reject('${member.id}')">Reject</button>
    `;

    container.appendChild(div);

  });

};

// APPROVE
window.approve = async function (id) {
  await updateDoc(doc(db, "members", id), {
    status: "approved"
  });

  alert("Member Approved");
  location.reload();
};

// REJECT
window.reject = async function (id) {
  await updateDoc(doc(db, "members", id), {
    status: "rejected"
  });

  alert("Member Rejected");
  location.reload();
};
