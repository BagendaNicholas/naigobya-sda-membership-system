// js/dashboard.js
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { collection, onSnapshot, updateDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

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

// CENTRAL INTERFACE RENDER PIPELINE CONTROL
function renderDashboardInterface() {
    const listDisplayContainer = document.getElementById("membersList");
    const rawSearchInputValue = document.getElementById("searchInput").value.toLowerCase().trim();
    
    listDisplayContainer.innerHTML = "";

    // A. Apply Context Filter Ruleset
    let targetedDisplayData = cachedMembersArray;
    if (currentFilterView === "approved") {
        targetedDisplayData = cachedMembersArray.filter(member => member.status === "approved");
    }

    // B. Apply Text Search Query Ruleset (UPGRADED WITH ALL 10 FIELDS)
    if (rawSearchInputValue) {
        targetedDisplayData = targetedDisplayData.filter(member => {
            const name = (member.name || "").toLowerCase();
            const email = (member.email || "").toLowerCase();
            const phone = (member.phone || "");
            const village = (member.village || member.address || "").toLowerCase();
            const county = (member.county || "").toLowerCase();
            const district = (member.district || "").toLowerCase();
            const country = (member.country || "").toLowerCase();
            const church = (member.church || "").toLowerCase();
            const pastor = (member.pastor || "").toLowerCase();
            const area = (member.area || "").toLowerCase();
            
            return name.includes(rawSearchInputValue) || 
                   email.includes(rawSearchInputValue) || 
                   phone.includes(rawSearchInputValue) || 
                   village.includes(rawSearchInputValue) ||
                   county.includes(rawSearchInputValue) ||
                   district.includes(rawSearchInputValue) ||
                   country.includes(rawSearchInputValue) ||
                   church.includes(rawSearchInputValue) ||
                   pastor.includes(rawSearchInputValue) ||
                   area.includes(rawSearchInputValue);
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
        
        // Extracting all the 10 data tokens cleanly with fallbacks
        const memberDob = profileData.dob || "Not Provided";
        const memberPhone = profileData.phone || "No Contact";
        const memberEmail = profileData.email || "No Email";
        const memberVillage = profileData.village || profileData.address || "Not Provided";
        const memberCounty = profileData.county || "Not Provided";
        const memberDistrict = profileData.district || "Not Provided";
        const memberCountry = profileData.country || "Uganda";
        const memberChurch = profileData.church || "Not Provided";
        const memberArea = profileData.area || "Not Provided";
        const memberPastor = profileData.pastor || "Not Provided";
        const memberBaptismDate = profileData.dobaptism || "Not Provided";

        // Safe Image Parsing Engine to read raw Base64 strings correctly
        let finalUserImageSrc = "";
        if (profileData.photoURL && profileData.photoURL.trim() !== "") {
            finalUserImageSrc = profileData.photoURL; 
        } else {
            finalUserImageSrc = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(memberName)}`;
        }

        const memberCardElement = document.createElement("div");
        memberCardElement.className = "member-profile-card";
        
        if (currentFilterView === "approved") {
            // CONDITIONAL VIEW: Full-row list visualization layout for Approved Roster
            memberCardElement.style.cssText = "background: rgba(34, 197, 94, 0.04); padding: 25px; border-radius: 12px; border: 1px solid rgba(34, 197, 94, 0.2); text-align: left; margin-top: 15px; display: flex; align-items: flex-start; gap: 20px; flex-wrap: wrap;";
            memberCardElement.innerHTML = `
                <img src="${finalUserImageSrc}" 
                     style="width:90px; height:90px; border-radius:50%; object-fit:cover; border: 3px solid #16a34a;"
                     onerror="this.onerror=null; this.src='https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(memberName)}';">
                
                <div style="flex: 2; min-width: 250px;">
                    <h3 style="margin: 0 0 8px 0; color: #fff; font-size: 1.3rem;">${memberName}</h3>
                    <p style="margin: 4px 0; font-size: 0.9rem; color: #cbd5e1;">📧 <b>Email:</b> ${memberEmail}</p>
                    <p style="margin: 4px 0; font-size: 0.9rem; color: #cbd5e1;">📞 <b>Phone:</b> ${memberPhone}</p>
                    <p style="margin: 4px 0; font-size: 0.9rem; color: #cbd5e1;">📅 <b>D.O.B:</b> ${memberDob}</p>
                    <p style="margin: 8px 0 0 0; font-size: 0.9rem; color: #94a3b8;">📍 <b>Location:</b> ${memberVillage}, ${memberCounty}, ${memberDistrict}, ${memberCountry}</p>
                </div>

                <div style="flex: 2; min-width: 250px; border-left: 1px solid rgba(255,255,255,0.1); padding-left: 20px;">
                    <h4 style="margin: 0 0 6px 0; color: #22c55e; font-size: 1rem;">⛪ Church Affiliation</h4>
                    <p style="margin: 4px 0; font-size: 0.9rem; color: #cbd5e1;"><b>Church:</b> ${memberChurch}</p>
                    <p style="margin: 4px 0; font-size: 0.9rem; color: #cbd5e1;"><b>District/Area:</b> ${memberArea}</p>
                    <p style="margin: 4px 0; font-size: 0.9rem; color: #cbd5e1;"><b>Pastor:</b> ${memberPastor}</p>
                    <p style="margin: 4px 0; font-size: 0.9rem; color: #cbd5e1;">🌊 <b>Baptism Date:</b> ${memberBaptismDate}</p>
                </div>

                <div style="display: flex; flex-direction: column; gap: 8px; justify-content: center; min-width: 160px; flex: 1;">
                    <button onclick="window.location.href='church-members.html?uid=${uniqueProfileId}'" style="background:#0284c7; color:white; border:none; padding:10px; border-radius:6px; cursor:pointer; font-weight:600; font-size:0.85rem;">✏️ Edit Details</button>
                    <button onclick="rejectMember('${uniqueProfileId}')" style="background:#ea580c; color:white; border:none; padding:10px; border-radius:6px; cursor:pointer; font-weight:600; font-size:0.85rem;">❌ Revoke Status</button>
                    <button onclick="deleteMember('${uniqueProfileId}', '${memberName}')" style="background:#dc2626; color:white; border:none; padding:10px; border-radius:6px; cursor:pointer; font-weight:600; font-size:0.85rem;">🗑️ Delete Member</button>
                </div>
            `;
        } else {
            // CONDITIONAL VIEW: Organized Pending Queue grid layout with multi-field readouts
            memberCardElement.style.cssText = "background: rgba(255,255,255,0.05); padding: 25px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); text-align: center; margin-top: 15px; display: flex; flex-direction: column; align-items: center;";
            memberCardElement.innerHTML = `
                <img src="${finalUserImageSrc}" 
                     style="width:85px; height:85px; border-radius:50%; object-fit:cover; margin-bottom: 12px; border: 2px solid #ffaa00;"
                     onerror="this.onerror=null; this.src='https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(memberName)}';">
                
                <h3 style="margin: 5px 0; color: #fff; font-size: 1.25rem;">${memberName}</h3>
                <p style="margin: 3px 0; font-size: 0.9rem; color: #ccc;">📧 ${memberEmail} | 📞 ${memberPhone}</p>
                <p style="margin: 3px 0; font-size: 0.9rem; color: #94a3b8;">📅 Birth: ${memberDob} | 🌊 Baptism: ${memberBaptismDate}</p>
                
                <div style="background: rgba(0,0,0,0.2); width: 100%; padding: 12px; border-radius: 8px; margin: 12px 0; text-align: left; box-sizing: border-box;">
                    <p style="margin: 3px 0; font-size: 0.85rem; color: #cbd5e1;">📍 <b>Home:</b> ${memberVillage}, ${memberDistrict}</p>
                    <p style="margin: 3px 0; font-size: 0.85rem; color: #cbd5e1;">⛪ <b>Church:</b> ${memberChurch} (${memberArea})</p>
                    <p style="margin: 3px 0; font-size: 0.85rem; color: #cbd5e1;">👨‍🌾 <b>Pastor:</b> ${memberPastor}</p>
                </div>

                <p style="margin: 0 0 15px 0; font-size: 0.9rem;">Status: <b style="text-transform: uppercase; color: #ffaa00">${profileData.status || "pending"}</b></p>
                
                <div style="margin-bottom: 12px; width: 100%;">
                    <button onclick="window.location.href='church-members.html?uid=${uniqueProfileId}'" style="background:#0284c7; color:white; border:none; padding:10px 16px; border-radius:6px; cursor:pointer; font-weight:600; width:90%;">✏️ Edit Member Details</button>
                </div>

                <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; width: 100%;">
                    <button class="btn" style="background:#16a34a;" onclick="approveMember('${uniqueProfileId}')">✅ Approve</button>
                    <button class="btn" style="background:#ea580c;" onclick="rejectMember('${uniqueProfileId}')">❌ Reject</button>
                    <button class="btn" style="background:#dc2626;" onclick="deleteMember('${uniqueProfileId}', '${memberName}')">🗑️ Delete</button>
                </div>
            `;
        }
        listDisplayContainer.appendChild(memberCardElement);
    });
}

// VIEW SELECTION CONTROLLER ENTRY POINT
window.changeDashboardView = function(viewModeTarget) {
    currentFilterView = viewModeTarget;
    
    const allBtn = document.getElementById("viewAllBtn");
    const approvedBtn = document.getElementById("viewApprovedBtn");

    if (viewModeTarget === "approved") {
        approvedBtn.style.cssText = "background: #16a34a; color: white;";
        allBtn.style.cssText = "background: #1e293b; border: 1px solid rgba(255,255,255,0.1); color: #94a3b8;";
    } else {
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

// EXPOSED GLOBAL DELETE CONTROLLER
window.deleteMember = async function (targetDocumentId, memberName) {
    const verifyUserIntent = confirm(`🚨 PERMANENT REMOVAL WARNING:\n\nAre you sure you want to completely erase the record for "${memberName}"?\nThis action cannot be undone.`);
    
    if (!verifyUserIntent) return;

    try {
        displayUIMessage(`⏳ Executing drop command for member: ${memberName}...`, false);
        await deleteDoc(doc(db, "members", targetDocumentId));
        displayUIMessage(`✅ Member record "${memberName}" deleted completely from collection database.`, false);
    } catch (err) {
        console.error("Critical crash inside deletion processing cycle:", err);
        displayUIMessage(`🗑️ Deletion transaction aborted: ${err.message}`, true);
    }
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
