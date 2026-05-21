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
const ADMIN_EMAIL =
"nicholasbagenda@gmail.com";


// CHECK AUTH
onAuthStateChanged(auth, async(user)=>{

    if(!user){

        window.location.href =
        "admin-login.html";

        return;

    }

    if(user.email !== ADMIN_EMAIL){

        alert("❌ Access Denied");

        window.location.href =
        "index.html";

        return;

    }

    loadMembers();

});


// LOGOUT
window.logoutAdmin = async function(){

    await signOut(auth);

    window.location.href =
    "index.html";

};


// LOAD MEMBERS
async function loadMembers(){

    const membersList =
    document.getElementById("membersList");

    membersList.innerHTML = "";

    let total = 0;
    let pending = 0;
    let approved = 0;

    const querySnapshot =
    await getDocs(collection(db, "members"));

    querySnapshot.forEach((member)=>{

        total++;

        const data = member.data();

        if(data.status === "pending"){
            pending++;
        }

        if(data.status === "approved"){
            approved++;
        }

        const div =
        document.createElement("div");

        div.classList.add("card");

        div.innerHTML = `

            <div style="text-align:center;">

                <img
                src="${data.photoURL}"
                class="member-photo">

                <h3>${data.name}</h3>

                <p>${data.email}</p>

                <p>${data.phone}</p>

                <p>Status:
                <b>${data.status}</b></p>

                <button
                onclick="approveMember('${member.id}')"
                style="margin-top:10px;">
                ✅ Approve
                </button>

                <button
                onclick="rejectMember('${member.id}')"
                style="
                margin-top:10px;
                background:red;">
                ❌ Reject
                </button>

            </div>

        `;

        membersList.appendChild(div);

    });

    // UPDATE STATS
    document.getElementById(
    "totalMembers").innerText = total;

    document.getElementById(
    "pendingMembers").innerText = pending;

    document.getElementById(
    "approvedMembers").innerText = approved;

}


// APPROVE
window.approveMember =
async function(id){

    await updateDoc(
        doc(db,"members",id),
        {
            status:"approved"
        }
    );

    alert("✅ Member Approved");

    location.reload();

};


// REJECT
window.rejectMember =
async function(id){

    await updateDoc(
        doc(db,"members",id),
        {
            status:"rejected"
        }
    );

    alert("❌ Member Rejected");

    location.reload();

};


// SEARCH
window.filterMembers =
function(){

    const input =
    document.getElementById(
    "searchInput").value.toLowerCase();

    const cards =
    document.querySelectorAll(".card");

    cards.forEach((card)=>{

        const text =
        card.innerText.toLowerCase();

        if(text.includes(input)){

            card.style.display =
            "block";

        }else{

            card.style.display =
            "none";

        }

    });

};
