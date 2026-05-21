// js/dashboard.js
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { collection, onSnapshot, updateDoc, doc } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const LOGGED_ADMIN_EMAIL = "nicholasbagenda@gmail.com";
let deactivateSnapshotStream = null;

function displayUIMessage(message, isError = false) {
    let msgBox = document.getElementById("dbErrorMessage");
    if (!msgBox) {
        msgBox = document.createElement("p");
        msgBox.id = "dbErrorMessage";
        document.querySelector(".container").insertBefore(msgBox, document.getElementById("stats"));
    }
    msgBox.style.cssText = `color: ${isError ? '#ff4444' : '#00ff88'}; font-weight: bold; text-align: center; margin: 15px 0; font-size: 0.95rem;`;
    msgBox.innerText = message;
}

// 1. AUTH WATCHER
onAuthStateChanged(auth, (activeUser) => {
    if (!activeUser) {
        if (deactivateSnapshotStream) deactivateSnapshotStream();
        window.location.href = "admin-login.html";
        return;
    }

    if (activeUser.email.toLowerCase() !== LOGGED_ADMIN_EMAIL.toLowerCase()) {
        alert(`❌ Access Denied: ${activeUser.email} is not authorized.`);
        window.location.href = "index.html";
        return;
    }

    displayUIMessage("🔄 Syncing with Firebase Root Path...", false);
    streamLiveChurchMembers();
});

// 2. DATA SNAPSHOT STREAM
function streamLiveChurchMembers() {
    const listDisplayContainer = document.getElementById("membersList");
    if (!listDisplayContainer) return;

    if (!db) {
        displayUIMessage("⚠️ Connection Error: The database object 'db' was not loaded from firebase.js. Check your import path scripts.", true);
        return;
    }

    try {
        deactivateSnapshotStream = onSnapshot(collection(db, "members"), (liveSnapshot) => {
            displayUIMessage("", false); 
            listDisplayContainer.innerHTML = "";
            
            let counterTotal = 0;
            let counterPending = 0;
            let counterApproved = 0;

            if (liveSnapshot.empty) {
                displayUIMessage("Connected, but the root 'members' collection contains 0 documents.", true);
            }

            liveSnapshot.forEach((documentObject) => {
                const profileData = documentObject.data();
                const uniqueProfileId = documentObject.id;
                const memberName = profileData.name || "Anonymous Member";

                counterTotal++;
                if (profileData.status === "pending") counterPending++;
                if (profileData.status === "approved") counterApproved++;

                const memberCardElement = document.createElement("div");
                memberCardElement.className = "member-profile-card";
                memberCardElement.style.cssText = "background: rgba(255,255,255,0.05); padding: 20px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); text-align: center; margin-top: 15px;";

                // FIXED: Changed image src fallback to a high-availability profile initials generator
                // Added an inline onerror fallback string pointing to a static user icon as an absolute backup layer
                memberCardElement.innerHTML = `
                    <img src="${profileData.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(memberName)}`}" 
                         style="width:80px; height:80px; border-radius:50%; object-fit:cover; margin-bottom: 12px; border: 2px solid #16a34a;"
                         onerror="this.onerror=null; this.src='https://cdn-icons-png.flaticon.com/512/3135/3135715.png';">
                    <h3 style="margin: 5px 0; color: #fff;">${memberName}</h3>
                    <p style="margin: 4px 0; font-size: 0.9rem; color: #ccc;">${profileData.email || "No Email"}</p>
                    <p style="margin: 4px 0; font-size: 0.9rem; color: #ccc;">${profileData.phone || "No Phone"}</p>
                    <p style="margin: 12px 0; font-size: 0.95rem;">Status: <b style="text-transform: uppercase; color: ${profileData.status === 'approved' ? '#16a34a' : '#ffaa00'}">${profileData.status || "pending"}</b></p>
                    
                    <div style="display: flex; gap: 10px; justify-content: center; margin-top: 15px;">
                        <button onclick="approveMember('${uniqueProfileId}')" style="background:#16a34a; color:white; border:none; padding:8px 14px; border-radius:4px; cursor:pointer; font-weight:600;">✅ Approve</button>
                        <button onclick="rejectMember('${uniqueProfileId}')" style="background:#dc2626; color:white; border:none; padding:8px 14px; border-radius:4px; cursor:pointer; font-weight:600;">❌ Reject</button>
                    </div>
                `;
                listDisplayContainer.appendChild(memberCardElement);
            });

            document.getElementById("totalMembers").innerText = counterTotal;
            document.getElementById("pendingMembers").innerText = counterPending;
            document.getElementById("approvedMembers").innerText = counterApproved;

            window.filterMembers();
        }, (streamFetchError) => {
            displayUIMessage(`⚠️ Firebase Stream Error: ${streamFetchError.message}`, true);
        });
    } catch (err) {
        displayUIMessage(`⚠️ Runtime Exception: ${err.message}`, true);
    }
}

// 3. ACTION LOGIC
window.approveMember = async function (targetDocumentId) {
    try {
        await updateDoc(doc(db, "members", targetDocumentId), { status: "approved" });
    } catch (e) { displayUIMessage(`Approval failed: ${e.message}`, true); }
};

window.rejectMember = async function (targetDocumentId) {
    try {
        await updateDoc(doc(db, "members", targetDocumentId), { status: "rejected" });
    } catch (e) { displayUIMessage(`Rejection failed: ${e.message}`, true); }
};

window.filterMembers = function () {
    const rawSearchInputValue = document.getElementById("searchInput").value.toLowerCase();
    const targetedProfileElements = document.querySelectorAll(".member-profile-card");
    targetedProfileElements.forEach((el) => {
        el.style.display = el.innerText.toLowerCase().includes(rawSearchInputValue) ? "block" : "none";
    });
};

window.logoutAdmin = async function (e) {
    if (e) e.preventDefault();
    if (deactivateSnapshotStream) deactivateSnapshotStream();
    await signOut(auth);
    window.location.href = "index.html";
};
