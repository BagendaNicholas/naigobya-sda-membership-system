// js/dashboard.js

import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  collection,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";


// ADMIN EMAIL
const ADMIN_EMAIL =
"nicholasbagenda@gmail.com";


// GLOBAL STATE
let membersCache = [];

let currentView =
"all";


// AUTH WATCHER
onAuthStateChanged(
auth,
(user)=>{

    if(!user){

        window.location.href =
        "admin-login.html";

        return;

    }

    if(
    user.email.toLowerCase()
    !==
    ADMIN_EMAIL.toLowerCase()
    ){

        alert(
        "❌ Access Denied"
        );

        window.location.href =
        "index.html";

        return;

    }

    loadMembers();

});


// LOAD MEMBERS
function loadMembers(){

    const membersRef =
    collection(db, "members");

    onSnapshot(
    membersRef,
    (snapshot)=>{

        membersCache = [];

        let total = 0;
        let pending = 0;
        let approved = 0;

        snapshot.forEach((docSnap)=>{

            const data =
            docSnap.data();

            data.id =
            docSnap.id;

            membersCache.push(data);

            total++;

            if(data.status === "pending"){
                pending++;
            }

            if(data.status === "approved"){
                approved++;
            }

        });

        document.getElementById(
        "totalMembers"
        ).innerText = total;

        document.getElementById(
        "pendingMembers"
        ).innerText = pending;

        document.getElementById(
        "approvedMembers"
        ).innerText = approved;

        renderMembers();

    });

}


// RENDER MEMBERS
function renderMembers(){

    const membersList =
    document.getElementById(
    "membersList"
    );

    const emptyState =
    document.getElementById(
    "emptyState"
    );

    const searchText =
    document.getElementById(
    "searchInput"
    ).value.toLowerCase();

    membersList.innerHTML = "";


    // FILTER
    let filtered =
    membersCache;


    // VIEW FILTER
    if(currentView === "approved"){

        filtered =
        filtered.filter(
        member =>
        member.status === "approved"
        );

    }


    // SEARCH FILTER
    filtered =
    filtered.filter(member=>{

        const fullName =
        (
        member.fullName ||
        member.name ||
        ""
        ).toLowerCase();

        const email =
        (
        member.email ||
        ""
        ).toLowerCase();

        const village =
        (
        member.village ||
        ""
        ).toLowerCase();

        const district =
        (
        member.district ||
        ""
        ).toLowerCase();

        const pastor =
        (
        member.pastor ||
        ""
        ).toLowerCase();

        const country =
        (
        member.country ||
        ""
        ).toLowerCase();

        return(
            fullName.includes(searchText) ||
            email.includes(searchText) ||
            village.includes(searchText) ||
            district.includes(searchText) ||
            pastor.includes(searchText) ||
            country.includes(searchText)
        );

    });


    // EMPTY
    if(filtered.length === 0){

        emptyState.style.display =
        "block";

        return;

    }

    emptyState.style.display =
    "none";


    // CREATE CARDS
    filtered.forEach((member)=>{

        const card =
        document.createElement("div");

        card.className =
        "member-card";


        // PHOTO
        const photo =
        member.photoURL ||

        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.fullName || member.name || "Member")}`;


        // STATUS
        const status =
        (
        member.status ||
        "pending"
        ).toLowerCase();


        card.innerHTML = `

            <img
            src="${photo}">

            <h3>
                ${member.fullName || member.name || "Church Member"}
            </h3>

            <p>
                📧 ${member.email || "No Email"}
            </p>

            <p>
                📞 ${member.phone || member.phoneNumber || "No Phone"}
            </p>

            <p>
                🌍 ${member.country || "No Country"}
            </p>

            <p>
                🏘 ${member.district || "No District"}
            </p>

            <p>
                📍 ${member.village || "Unknown Village"}
            </p>

            <p>
                ⛪ Pastor: ${member.pastor || "Not Provided"}
            </p>

            <p>
                🎂 DOB: ${member.dob || "Not Provided"}
            </p>

            <p>
                💧 Baptism: ${member.date || "Not Provided"}
            </p>

            <div class="status ${status}">
                ${status.toUpperCase()}
            </div>

            <div class="action-buttons">

                <button
                class="btn-edit"
                onclick="
                window.location.href=
                'church-members.html?uid=${member.id}'
                ">
                    ✏️ Edit
                </button>

                <button
                class="btn-approve"
                onclick="
                approveMember('${member.id}')
                ">
                    ✅ Approve
                </button>

                <button
                class="btn-reject"
                onclick="
                rejectMember('${member.id}')
                ">
                    ❌ Reject
                </button>

                <button
                class="btn-delete"
                onclick="
                deleteMember('${member.id}')
                ">
                    🗑 Delete
                </button>

            </div>

        `;

        membersList.appendChild(card);

    });

}


// VIEW SWITCHER
window.changeDashboardView =
function(view){

    currentView = view;

    const allBtn =
    document.getElementById(
    "viewAllBtn"
    );

    const approvedBtn =
    document.getElementById(
    "viewApprovedBtn"
    );

    allBtn.classList.remove(
    "active-view"
    );

    approvedBtn.classList.remove(
    "active-view"
    );

    allBtn.classList.add(
    "inactive-view"
    );

    approvedBtn.classList.add(
    "inactive-view"
    );

    if(view === "all"){

        allBtn.classList.remove(
        "inactive-view"
        );

        allBtn.classList.add(
        "active-view"
        );

    }
    else{

        approvedBtn.classList.remove(
        "inactive-view"
        );

        approvedBtn.classList.add(
        "active-view"
        );

    }

    renderMembers();

};


// SEARCH
window.filterMembers =
function(){

    renderMembers();

};


// APPROVE
window.approveMember =
async function(uid){

    try{

        await updateDoc(
            doc(db, "members", uid),
            {
                status: "approved"
            }
        );

        alert(
        "✅ Member Approved"
        );

    }
    catch(error){

        console.error(error);

        alert(
        "⚠️ Failed to approve member."
        );

    }

};


// REJECT
window.rejectMember =
async function(uid){

    try{

        await updateDoc(
            doc(db, "members", uid),
            {
                status: "rejected"
            }
        );

        alert(
        "❌ Member Rejected"
        );

    }
    catch(error){

        console.error(error);

        alert(
        "⚠️ Failed to reject member."
        );

    }

};


// DELETE
window.deleteMember =
async function(uid){

    const confirmDelete =
    confirm(
    "⚠️ Are you sure you want to permanently delete this member?"
    );

    if(!confirmDelete) return;

    try{

        await deleteDoc(
            doc(db, "members", uid)
        );

        alert(
        "🗑 Member Deleted Successfully"
        );

    }
    catch(error){

        console.error(error);

        alert(
        "⚠️ Failed to delete member."
        );

    }

};


// LOGOUT
window.logoutAdmin =
async function(){

    const confirmLogout =
    confirm(
    "Are you sure you want to logout?"
    );

    if(!confirmLogout) return;

    await signOut(auth);

    window.location.href =
    "index.html";

};
