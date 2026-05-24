// js/members.js
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const LOGGED_ADMIN_EMAIL = "nicholasbagenda@gmail.com";
let currentTargetUid = null;

// 1. WATCH AUTHENTICATION STATE & ROUTE CORRECTLY
onAuthStateChanged(auth, async (activeUser) => {
if (!activeUser) {
alert("🔒 Unauthorized access. Please log into your account first.");
window.location.href = "login.html";
return;
}

// Read the query parameters from the browser link bar (?uid=...)  
const urlParams = new URLSearchParams(window.location.search);  
const URL_UID = urlParams.get("uid");  

// EVALUATION CROSSROADS: Are you the Admin or a Regular Member?  
if (activeUser.email.toLowerCase() === LOGGED_ADMIN_EMAIL.toLowerCase()) {  
    // SCENARIO A: You are the Admin editing someone else  
    if (URL_UID) {  
        currentTargetUid = URL_UID;  
        // Unhide the Admin dashboard button if it exists in your navbar layout  
        const adminBtn = document.getElementById("adminLink");  
        if (adminBtn) adminBtn.style.display = "inline-block";  
    } else {  
        // Admin clicked profile without picking a member first  
        alert("Admin Mode: Redirecting to Dashboard to pick a member to edit.");  
        window.location.href = "admin-dashboard.html";  
        return;  
    }  
} else {  
    // SCENARIO B: You are a regular member looking at your own portal  
    currentTargetUid = activeUser.uid;  
    const adminBtn = document.getElementById("adminLink");  
    if (adminBtn) adminBtn.style.display = "none";  
}  

// Fire off the Firestore data retrieval pipeline  
if (currentTargetUid) {  
    await loadMemberProfileData(currentTargetUid);  
}

});

// 2. RETRIEVE DATA FROM FIRESTORE AND POPULATE FIELDS
async function loadMemberProfileData(uid) {
try {
const memberDocRef = doc(db, "members", uid);
const snapshot = await getDoc(memberDocRef);

if (!snapshot.exists()) {  
        console.error("Document reference ID not found in Firestore:", uid);  
        document.getElementById("welcomeName").innerText = "Profile Not Found";  
        return;  
    }  

    const memberData = snapshot.data();  

    // Target field mapping safely into your HTML form fields  
    if (document.getElementById("welcomeName")) {  
        document.getElementById("welcomeName").innerText = memberData.name || "Church Member";  
    }  
    if (document.getElementById("memberName")) {  
        document.getElementById("memberName").value = memberData.name || "";  
    }  
    if (document.getElementById("memberPhone")) {  
        document.getElementById("memberPhone").value = memberData.phone || "";  
    }  
    if (document.getElementById("memberVillage")) {  
        document.getElementById("memberVillage").value = memberData.address || memberData.village || "";  
    }  

    // Handle Status Badges cleanly  
    const statusBox = document.getElementById("accountStatus");  
    if (statusBox) {  
        const currentStatus = (memberData.status || "pending").toLowerCase();  
        statusBox.innerText = currentStatus === "approved" ? "Verified Approved" : currentStatus.toUpperCase() + " VERIFICATION";  
        statusBox.className = `status-badge status-${currentStatus}`;  
    }  

    // Map Base64 avatar strings or apply fallback initials generator if missing  
    const avatarImageElement = document.getElementById("displayAvatar") || document.getElementById("previewImage");  
    if (avatarImageElement) {  
        if (memberData.photoURL) {  
            avatarImageElement.src = memberData.photoURL;  
            avatarImageElement.style.display = "block"; // Make sure it's visible  
        } else {  
            avatarImageElement.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(memberData.name || 'Member')}`;  
            avatarImageElement.style.display = "block";  
        }  
    }  

} catch (err) {  
    console.error("Error reading member details from Firestore path root:", err);  
    alert("⚠️ Failed to load database records: " + err.message);  
}

}

// 3. LISTEN FOR RE-UPLOADED IMAGE PROFILE CHANGES
const fileSelectorInput = document.getElementById("updatePhoto") || document.getElementById("photo");
if (fileSelectorInput) {
fileSelectorInput.addEventListener("change", function () {
const selectedFile = this.files[0];
if (selectedFile) {
if (selectedFile.size > 1024 * 1024) {
alert("⚠️ Image size is too large. Please keep photo selections under 1MB to preserve storage space.");
this.value = "";
return;
}

const imgReader = new FileReader();  
        imgReader.onload = function (event) {  
            const imgDisplay = document.getElementById("displayAvatar") || document.getElementById("previewImage");  
            if (imgDisplay) {  
                imgDisplay.src = event.target.result;  
                imgDisplay.style.display = "block";  
            }  
              
            // Save string inside data bucket input fields  
            const rawStringBox = document.getElementById("updatePhotoBase64") || document.getElementById("photoBase64String");  
            if (rawStringBox) rawStringBox.value = event.target.result;  
        };  
        imgReader.readAsDataURL(selectedFile);  
    }  
});

}

// 4. TRANSACTION PROFILE WRITE AND UPDATE HANDLER ENGINE
const saveBtn = document.getElementById("saveProfileBtn");
if (saveBtn) {
saveBtn.addEventListener("click", async () => {
if (!currentTargetUid) {
alert("❌ Operational Error: Target User ID reference context is unassigned.");
return;
}

const nameField = document.getElementById("memberName").value.trim();  
    const phoneField = document.getElementById("memberPhone").value.trim();  
    const villageField = document.getElementById("memberVillage").value.trim();  
      
    const photoStringInput = document.getElementById("updatePhotoBase64") || document.getElementById("photoBase64String");  
    const base64PhotoData = photoStringInput ? photoStringInput.value : "";  
      
    const loader = document.getElementById("loadingOverlay") || document.getElementById("loading");  

    if (!nameField || !phoneField || !villageField) {  
        alert("⚠️ Modification Denied: All text descriptor fields must remain populated.");  
        return;  
    }  

    try {  
        if (loader) loader.style.display = "block";  

        const updateFieldsPayload = {  
            name: nameField,  
            phone: phoneField,  
            address: villageField  
        };  

        // Include the profile photo text string if updated  
        if (base64PhotoData) {  
            updateFieldsPayload.photoURL = base64PhotoData;  
        }  

        const databaseTargetRef = doc(db, "members", currentTargetUid);  
        await updateDoc(databaseTargetRef, updateFieldsPayload);  

        alert("🎉 Profile records updated successfully!");  
          
        if (document.getElementById("welcomeName")) {  
            document.getElementById("welcomeName").innerText = nameField;  
        }  

    } catch (writeError) {  
        console.error("Firestore submission transmission failed entirely:", writeError);  
        alert("⚠️ Could not process saves to cloud profile document root: " + writeError.message);  
    } finally {  
        if (loader) loader.style.display = "none";  
    }  
});

}

// 5. TERMINATE SESSIONS SIGN-OUT TRIGGER
const clearSessionLogoutBtn = document.getElementById("logoutBtn");
if (clearSessionLogoutBtn) {
clearSessionLogoutBtn.addEventListener("click", async () => {
if (confirm("Are you sure you want to sign out?")) {
await signOut(auth);
window.location.href = "login.html";
}
});
                                   }
