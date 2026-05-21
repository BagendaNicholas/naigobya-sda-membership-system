// js/dashboard.js
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { collection, onSnapshot, updateDoc, doc } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const LOGGED_ADMIN_EMAIL = "nicholasbagenda@gmail.com";
let deactivateSnapshotStream = null;

// Local runtime state caches
let cachedMembersArray = [];
let currentFilterView = "all"; // Options: 'all' or 'approved'

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
            
            // Re-initialize local tracking array
            cachedMembersArray = [];
            
            let counterTotal = 0;
            let counterPending = 0;
            let counterApproved = 0;

            if (liveSnapshot.empty) {
                displayUIMessage("Connected, but the root 'members' collection contains 0 documents.", true);
            }

            liveSnapshot.forEach((documentObject) => {
                const profileData = documentObject.data();
                profileData.uniqueProfileId = documentObject.id; // Map key payload context safely
                cachedMembersArray.push(profileData);

                counterTotal++;
                if (profileData.status === "pending") counterPending++;
                if (profileData.status === "approved") counterApproved++;
            });

            document.getElementById("totalMembers").innerText = counterTotal;
            document.getElementById("pendingMembers").innerText = counterPending;
            document.getElementById("approvedMembers").innerText = counterApproved;

            // Run structural rendering processing pipeline
            renderDashboardInterface();
        }, (streamFetchError) => {
            displayUIMessage(`⚠️ Firebase Stream Error: ${streamFetchError.message}`, true);
        });
    } catch (err) {
        displayUIMessage(`⚠️ Runtime Exception: ${err.message}`, true);
    }
}

// NEW: CENTRAL INTERFACE RENDER PIPELINE CONTROL
function renderDashboardInterface() {
    const listDisplayContainer = document.getElementById("membersList");
    const rawSearchInputValue = document.getElementById("searchInput").value.toLowerCase().trim();
    
    listDisplayContainer.innerHTML = "";

    // A. Apply Context Filter Ruleset
    let targetedDisplayData = cachedMembersArray;
    if (currentFilterView === "approved") {
        targetedDisplayData = cachedMembersArray.filter(member => member.status === "approved");
    }

    // B. Apply Text Search Query Ruleset
    if (rawSearchInputValue) {
        targetedDisplayData = targetedDisplayData.filter(member => {
            const name = (member.name || "").toLowerCase();
            const email = (member.email || "").toLowerCase();
            const phone = (member.phone || "");
            const village = (member.address || member.village || "").toLowerCase();
            
            return name.includes(rawSearchInputValue) || 
                   email.includes(rawSearchInputValue) || 
                   phone.includes(rawSearchInputValue) || 
                   village.includes(rawSearchInputValue);
        });
    }

    if (targetedDisplayData.length === 0) {
        listDisplayContainer.innerHTML = `<p style="text-align:center; color:#cbd5e1; margin-top:20px;">No records match your selected criteria.</p>`;
        return;
    }

    // C. Draw Dynamic UI Profiles elements
    targetedDisplayData.forEach((profileData) => {
        const uniqueProfileId = profileData.uniqueProfileId;
        const memberName = profileData.name || "Anonymous Member";
        const memberVillage = profileData.address || profileData.village || "Not Provided";

        const memberCardElement = document.createElement("div");
        memberCardElement.className = "member-profile-card";
        
        if (currentFilterView === "approved") {
            // CONDITIONAL VIEW MARGIN: Premium full-row list visualization layout for the Approved Roster
            memberCardElement.style.cssText = "background: rgba(34, 197, 94, 0.04); padding: 20px; border-radius: 12px; border: 1px solid rgba(34, 197, 94, 0.2); text-align: left; margin-top: 15px; display: flex; align-items: center; gap: 20px; flex-wrap: wrap;";
            memberCardElement.innerHTML = `
                <img src="${profileData.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(memberName)}`}" 
                     style="width:75px; height:75px; border-radius:50%; object-fit:cover; border: 2px solid #16a34a;"
                     onerror="this.onerror=null; this.src='https://cdn-icons-png.flaticon.com/512/3135/3135715.png';">
                <div style="flex: 1; min-width: 200px;">
                    <h3 style="margin: 0 0 6px 0; color: #fff; font-size: 1.2rem;">${memberName}</h3>
                    <p style="margin: 3px 0; font-size: 0.9rem; color: #cbd5e1;">📧 ${profileData.email || "No Email Address"}</p>
                    <p style="margin: 3px 0; font-size: 0.9rem; color: #cbd5e1;">📞 ${profileData.phone || "No Phone Contact"}</p>
                    <p style="margin: 6px 0 0 0; font-size: 0.9rem; color: #94a3b8;">📍 Village/District: <b style="color:#fff;">${memberVillage}</b></p>
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px; justify-content: center; min-width: 150px;">
                    <button onclick="window.location.href='church-members.html?uid=${uniqueProfileId}'" style="background:#0284c7; color:white; border:none; padding:8px 14px; border-radius:6px; cursor:pointer; font-weight:600; font-size:0.85rem;">✏️ Edit Member Details</button>
                    <button onclick="rejectMember('${uniqueProfileId}')" style="background:#dc2626; color:white; border:none; padding:8px 14px; border-radius:6px; cursor:pointer; font-weight:600; font-size:0.85rem;">❌ Revoke Status</button>
                </div>
            `;
        } else {
            // CONDITIONAL VIEW MARGIN: Original Pending Queue view with operational workflow action paths
            memberCardElement.style.cssText = "background: rgba(255,255,255,0.05); padding: 20px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); text-align: center; margin-top: 15px;";
            memberCardElement.innerHTML = `
                <img src="${profileData.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(memberName)}`}" 
                     style="width:80px; height:80px; border-radius:50%; object-fit:cover; margin-bottom: 12px; border: 2px solid #16a34a;"
                     onerror="this.onerror=null; this.src='https://cdn-icons-png.flaticon.com/512/3135/3135715.png';">
                <h3 style="margin: 5px 0; color: #fff;">${memberName}</h3>
                <p style="margin: 4px 0; font-size: 0.9rem; color: #ccc;">${profileData.email || "No Email"}</p>
                <p style="margin: 4px 0; font-size: 0.9rem; color: #ccc;">${profileData.phone || "No Phone"}</p>
                <p style="margin: 12px 0; font-size: 0.95rem;">Status: <b style="text-transform: uppercase; color: ${profileData.status === 'approved' ? '#16a34a' : '#ffaa00'}">${profileData.status || "pending"}</b></p>
                
                <div style="margin-bottom: 12px;">
                    <button onclick="window.location.href='church-members.html?uid=${uniqueProfileId}'" style="background:#0284c7; color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer; font-weight:600; width:85%;">✏️ Edit Member Details</button>
                </div>

                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="approveMember('${uniqueProfileId}')" style="background:#16a34a; color:white; border:none; padding:8px 14px; border-radius:4px; cursor:pointer; font-weight:600;">✅ Approve</button>
                    <button onclick="rejectMember('${uniqueProfileId}')" style="background:#dc2626; color:white; border:none; padding:8px 14px; border-radius:4px; cursor:pointer; font-weight:600;">❌ Reject</button>
                </div>
            `;
        }
        listDisplayContainer.appendChild(memberCardElement);
    });
}

// NEW: VIEW SELECTION CONTROLLER ENTRY POINT
window.changeDashboardView = function(viewModeTarget) {
    currentFilterView = viewModeTarget;
    
    const allBtn = document.getElementById("viewAllBtn");
    const approvedBtn = document.getElementById("viewApprovedBtn");

    if (viewModeTarget === "approved") {
        // Highlighting active states for approved rosters
        approvedBtn.style.cssText = "background: #16a34a; color: white;";
        allBtn.style.cssText = "background: #1e293b; border: 1px solid rgba(255,255,255,0.1); color: #94a3b8;";
    } else {
        // Highlighting active states for general workflow queues
        allBtn.style.cssText = "background: #475569; color: white;";
        approvedBtn.style.cssText = "background: #1e293b; border: 1px solid rgba(255,255,255,0.1); color: #94a3b8;";
    }

    renderDashboardInterface();
};

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

// 4. CLIENT SIDE INTERACTIVE TEXT SEARCH BRIDGE
window.filterMembers = function () {
    renderDashboardInterface();
};

window.logoutAdmin = async function (e) {
    if (e) e.preventDefault();
    if (deactivateSnapshotStream) deactivateSnapshotStream();
    await signOut(auth);
    window.location.href = "index.html";
};
