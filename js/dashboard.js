// js/dashboard.js
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
// 🛠️ FIX: Added getDoc explicitly to the imports below
import { collection, onSnapshot, updateDoc, doc, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const LOGGED_ADMIN_EMAIL = "nicholasbagenda@gmail.com";
let deactivateSnapshotStream = null;

// Local runtime state caches
let cachedMembersArray = [];
let currentFilterView = "all"; // Options: 'all', 'approved', or 'pending_changes'

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
            let counterChanges = 0; // Tracks profiles with pending updates

            if (liveSnapshot.empty) {
                displayUIMessage("Connected, but the root 'members' collection contains 0 documents.", true);
            }

            liveSnapshot.forEach((documentObject) => {
                const profileData = documentObject.data();
                profileData.uniqueProfileId = documentObject.id; // Map key payload context safely
                cachedMembersArray.push(profileData);

                counterTotal++;
                const currentStatus = (profileData.status || "pending").toLowerCase();
                
                if (currentStatus === "pending") counterPending++;
                if (currentStatus === "approved") counterApproved++;
                if (currentStatus === "changes_pending") counterChanges++;
            });

            if (document.getElementById("totalMembers")) document.getElementById("totalMembers").innerText = counterTotal;
            if (document.getElementById("pendingMembers")) document.getElementById("pendingMembers").innerText = counterPending;
            if (document.getElementById("approvedMembers")) document.getElementById("approvedMembers").innerText = counterApproved;
            
            // UI Hookup: If you create a badge element with ID 'pendingChangesCount', it will display the count
            const changesBadge = document.getElementById("pendingChangesCount");
            if (changesBadge) changesBadge.innerText = counterChanges;

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
    } else if (currentFilterView === "pending_changes") {
        targetedDisplayData = cachedMembersArray.filter(member => member.status === "changes_pending");
    }

    // B. Apply Text Search Query Ruleset
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
        
        if (currentFilterView === "pending_changes" && profileData.pendingUpdates) {
            // ⚠️ MODIFICATION VIEW: Highlights old profile elements vs new changes submitted by user
            const updates = profileData.pendingUpdates;
            
            // Inline comparison string construction helper
            const buildDiffRow = (label, currentVal, newVal) => {
                if (currentVal === newVal || !newVal) return ""; // Skip if nothing changed
                return `<p style="margin:4px 0; font-size:0.85rem; color:#cbd5e1;">
                            <b>${label}:</b> <span style="color:#ef4444; text-decoration:line-through;">${currentVal}</span> 
                            ➡️ <span style="color:#22c55e; font-weight:bold;">${newVal}</span>
                        </p>`;
            };

            let changesPhotoSrc = updates.photoURL || finalUserImageSrc;

            memberCardElement.style.cssText = "background: rgba(245, 158, 11, 0.04); padding: 25px; border-radius: 12px; border: 1px dashed rgba(245, 158, 11, 0.4); text-align: left; margin-top: 15px; display: flex; align-items: flex-start; gap: 20px; flex-wrap: wrap;";
            memberCardElement.innerHTML = `
                <div style="text-align:center;">
                    <img src="${changesPhotoSrc}" style="width:90px; height:90px; border-radius:50%; object-fit:cover; border: 3px dashed #f59e0b;">
                    ${updates.photoURL ? '<p style="color:#f59e0b; font-size:0.75rem; margin:5px 0 0 0; font-weight:bold;">New Photo Sent</p>' : ''}
                </div>
                
                <div style="flex: 2; min-width: 250px;">
                    <h3 style="margin: 0 0 8px 0; color: #fff; font-size: 1.3rem;">${memberName} <span style="font-size:0.8rem; background:#78350f; color:#fef3c7; padding:2px 8px; border-radius:10px; margin-left:5px;">Profile Edit</span></h3>
                    <div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px;">
                        <h4 style="margin: 0 0 6px 0; color: #f59e0b; font-size: 0.9rem;">🔄 Requested Updates:</h4>
                        ${buildDiffRow("Full Name", memberName, updates.name)}
                        ${buildDiffRow("D.O.B", memberDob, updates.dob)}
                        ${buildDiffRow("Phone", memberPhone, updates.phone)}
                        ${buildDiffRow("Village", memberVillage, updates.village)}
                        ${buildDiffRow("County", memberCounty, updates.county)}
                        ${buildDiffRow("District", memberDistrict, updates.district)}
                        ${buildDiffRow("Country", memberCountry, updates.country)}
                        ${buildDiffRow("Church", memberChurch, updates.church)}
                        ${buildDiffRow("Area", memberArea, updates.area)}
                        ${buildDiffRow("Pastor", memberPastor, updates.pastor)}
                        ${buildDiffRow("Baptism Date", memberBaptismDate, updates.dobaptism)}
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 8px; justify-content: center; min-width: 180px; flex: 1;">
                    <button onclick="approveProfileChanges('${uniqueProfileId}')" style="background:#16a34a; color:white; border:none; padding:10px; border-radius:6px; cursor:pointer; font-weight:600; font-size:0.85rem;">✅ Accept Updates</button>
                    <button onclick="rejectProfileChanges('${uniqueProfileId}')" style="background:#ea580c; color:white; border:none; padding:10px; border-radius:6px; cursor:pointer; font-weight:600; font-size:0.85rem;">❌ Reject Updates</button>
                    <button onclick="window.location.href='church-members.html?uid=${uniqueProfileId}'" style="background:#1e293b; color:#cbd5e1; border:1px solid #334155; padding:10px; border-radius:6px; cursor:pointer; font-size:0.85rem;">View Profile</button>
                </div>
            `;

        } else if (currentFilterView === "approved") {
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
            let dynamicColor = profileData.status === "changes_pending" ? "#f59e0b" : "#ffaa00";
            let displayStatus = profileData.status === "changes_pending" ? "Edits Pending" : (profileData.status || "pending");
            
            memberCardElement.style.cssText = "background: rgba(255,255,255,0.05); padding: 25px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); text-align: center; margin-top: 15px; display: flex; flex-direction: column; align-items: center;";
            memberCardElement.innerHTML = `
                <img src="${finalUserImageSrc}" 
                     style="width:85px; height:85px; border-radius:50%; object-fit:cover; margin-bottom: 12px; border: 2px solid ${dynamicColor};"
                     onerror="this.onerror=null; this.src='https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(memberName)}';">
                
                <h3 style="margin: 5px 0; color: #fff; font-size: 1.25rem;">${memberName}</h3>
                <p style="margin: 3px 0; font-size: 0.9rem; color: #ccc;">📧 ${memberEmail} | 📞 ${memberPhone}</p>
                <p style="margin: 3px 0; font-size: 0.9rem; color: #94a3b8;">📅 Birth: ${memberDob} | 🌊 Baptism: ${memberBaptismDate}</p>
                
                <div style="background: rgba(0,0,0,0.2); width: 100%; padding: 12px; border-radius: 8px; margin: 12px 0; text-align: left; box-sizing: border-box;">
                    <p style="margin: 3px 0; font-size: 0.85rem; color: #cbd5e1;">📍 <b>Home:</b> ${memberVillage}, ${memberDistrict}</p>
                    <p style="margin: 3px 0; font-size: 0.85rem; color: #cbd5e1;"><b>Church:</b> ${memberChurch} (${memberArea})</p>
                    <p style="margin: 3px 0; font-size: 0.85rem; color: #cbd5e1;">👨‍🌾 <b>Pastor:</b> ${memberPastor}</p>
                </div>

                <p style="margin: 0 0 15px 0; font-size: 0.9rem;">Status: <b style="text-transform: uppercase; color: ${dynamicColor}">${displayStatus}</b></p>
                
                <div style="margin-bottom: 12px; width: 100%;">
                    <button onclick="window.location.href='church-members.html?uid=${uniqueProfileId}'" style="background:#0284c7; color:white; border:none; padding:10px 16px; border-radius:6px; cursor:pointer; font-weight:600; width:90%;">✏️ Edit Member Details</button>
                </div>

                <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; width: 100%;">
                    ${profileData.status === "changes_pending" ? 
                        `<button class="btn" style="background:#f59e0b; width:90%; color:white;" onclick="changeDashboardView('pending_changes')">🔍 Review Changes</button>` : 
                        `<button class="btn" style="background:#16a34a;" onclick="approveMember('${uniqueProfileId}')">✅ Approve</button>
                         <button class="btn" style="background:#ea580c;" onclick="rejectMember('${uniqueProfileId}')">❌ Reject</button>
                         <button class="btn" style="background:#dc2626;" onclick="deleteMember('${uniqueProfileId}', '${memberName}')">🗑️ Delete</button>`
                    }
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
    const changesBtn = document.getElementById("viewChangesBtn"); // Connects to the new tracking filter layout button

    // Reset styles across all button components
    [allBtn, approvedBtn, changesBtn].forEach(btn => {
        if (btn) btn.style.cssText = "background: #1e293b; border: 1px solid rgba(255,255,255,0.1); color: #94a3b8;";
    });

    if (viewModeTarget === "approved" && approvedBtn) {
        approvedBtn.style.cssText = "background: #16a34a; color: white;";
    } else if (viewModeTarget === "pending_changes" && changesBtn) {
        changesBtn.style.cssText = "background: #f59e0b; color: white;";
    } else if (allBtn) {
        allBtn.style.cssText = "background: #475569; color: white;";
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

// 🟢 APPROVE PROFILE CHANGES: Copies values from pendingUpdates object to core fields, then clears queue
// 🛠️ FIX: Explicitly exposed to 'window' to fix structural HTML execution binding errors
window.approveProfileChanges = async function (targetDocumentId) {
    try {
        displayUIMessage("⏳ Merging profile changes...", false);
        const memberRef = doc(db, "members", targetDocumentId);
        const snapshot = await getDoc(memberRef);
        
        if (!snapshot.exists()) return;
        const data = snapshot.data();
        const updates = data.pendingUpdates;

        if (!updates) {
            alert("No pending update payload block found.");
            return;
        }

        // Build object payload, mapping everything up to root reference variables
        const approvedPayload = {
            name: updates.name,
            dob: updates.dob,
            phone: updates.phone,
            village: updates.village,
            address: updates.village, 
            county: updates.county,
            district: updates.district,
            country: updates.country,
            church: updates.church,
            area: updates.area,
            pastor: updates.pastor,
            dobaptism: updates.dobaptism,
            status: "approved",         // Set account status back to verified active
            pendingUpdates: null        // Wipe out the pending storage block to empty memory
        };

        if (updates.photoURL) approvedPayload.photoURL = updates.photoURL;

        await updateDoc(memberRef, approvedPayload);
        displayUIMessage("🎉 Changes successfully merged to root database file metrics!", false);
    } catch (e) {
        displayUIMessage(`Profile merge routine aborted: ${e.message}`, true);
    }
};

// 🔴 REJECT PROFILE CHANGES: Deletes the pending payload block safely and returns status to normal
// 🛠️ FIX: Explicitly exposed to 'window' to fix structural HTML execution binding errors
window.rejectProfileChanges = async function (targetDocumentId) {
    if (!confirm("Are you sure you want to decline these edits? The profile values will rollback to original metrics.")) return;
    
    try {
        await updateDoc(doc(db, "members", targetDocumentId), {
            status: "approved",
            pendingUpdates: null
        });
        displayUIMessage("Safely dismissed pending profile edits.", false);
    } catch (e) {
        displayUIMessage(`Profile clear command aborted: ${e.message}`, true);
    }
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
