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

// 2. RETRIEVE DATA FROM FIRESTORE AND POPULATE FIELDS (UPGRADED WITH ALL 10 FIELDS)
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
        
        // 10 Fields Pre-fill Map Engine
        if (document.getElementById("memberName")) document.getElementById("memberName").value = memberData.name || "";
        if (document.getElementById("memberDob")) document.getElementById("memberDob").value = memberData.dob || "";
        if (document.getElementById("memberPhone")) document.getElementById("memberPhone").value = memberData.phone || "";
        if (document.getElementById("memberVillage")) document.getElementById("memberVillage").value = memberData.village || memberData.address || "";
        if (document.getElementById("memberCounty")) document.getElementById("memberCounty").value = memberData.county || "";
        if (document.getElementById("memberDistrict")) document.getElementById("memberDistrict").value = memberData.district || "";
        if (document.getElementById("memberCountry")) document.getElementById("memberCountry").value = memberData.country || "Uganda";
        if (document.getElementById("memberChurch")) document.getElementById("memberChurch").value = memberData.church || "";
        if (document.getElementById("memberArea")) document.getElementById("memberArea").value = memberData.area || "";
        if (document.getElementById("memberPastor")) document.getElementById("memberPastor").value = memberData.pastor || "";
        if (document.getElementById("memberDobaptism")) document.getElementById("memberDobaptism").value = memberData.dobaptism || "";

        // Handle Status Badges cleanly
        const statusBox = document.getElementById("accountStatus");
        if (statusBox) {
            const currentStatus = (memberData.status || "pending").toLowerCase();
            statusBox.innerText = currentStatus === "approved" ? "Verified Approved" : currentStatus.toUpperCase() + " VERIFICATION";
            statusBox.className = `status-badge status-${currentStatus}`;
        }

        // Map Base64 avatar strings or apply fallback initials generator if missing
        const avatarImageElement = document.getElementById("displayAvatar");
        if (avatarImageElement) {
            if (memberData.photoURL) {
                avatarImageElement.src = memberData.photoURL;
            } else {
                avatarImageElement.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(memberData.name || 'Member')}`;
            }
        }

    } catch (err) {
        console.error("Error reading member details from Firestore path root:", err);
        alert("⚠️ Failed to load database records: " + err.message);
    }
}

// 3. LISTEN FOR RE-UPLOADED IMAGE PROFILE CHANGES (CLEANED UP FOR BACKGROUND ENGINE COMPATIBILITY)
// The HTML script block inside church-members.html handles the heavy background canvas down-sampling.
// This block safely resets UI states if needed.
const fileSelectorInput = document.getElementById("updatePhoto");
if (fileSelectorInput) {
    fileSelectorInput.addEventListener("change", function () {
        const selectedFile = this.files[0];
        if (selectedFile) {
            // Initial safeguard against excessively huge allocations (>5MB)
            if (selectedFile.size > 5 * 1024 * 1024) { 
                alert("⚠️ Image size is too large. Please keep original photo selections under 5MB.");
                this.value = "";
                const photoStatus = document.getElementById("photoStatus");
                if (photoStatus) photoStatus.style.display = "none";
            }
        }
    });
}

// 4. TRANSACTION PROFILE WRITE AND UPDATE HANDLER ENGINE (UPGRADED WITH ALL 10 FIELDS)
const saveBtn = document.getElementById("saveProfileBtn");
if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
        if (!currentTargetUid) {
            alert("❌ Operational Error: Target User ID reference context is unassigned.");
            return;
        }

        // Extracting all the updated input variants from the interactive UI layout
        const nameField = document.getElementById("memberName").value.trim();
        const dobField = document.getElementById("memberDob").value;
        const phoneField = document.getElementById("memberPhone").value.trim();
        const villageField = document.getElementById("memberVillage").value.trim();
        const countyField = document.getElementById("memberCounty").value.trim();
        const districtField = document.getElementById("memberDistrict").value.trim();
        const countryField = document.getElementById("memberCountry").value.trim();
        const churchField = document.getElementById("memberChurch").value.trim();
        const areaField = document.getElementById("memberArea").value.trim();
        const pastorField = document.getElementById("memberPastor").value.trim();
        const dobaptismField = document.getElementById("memberDobaptism").value;
        
        const photoStringInput = document.getElementById("updatePhotoBase64");
        const base64PhotoData = photoStringInput ? photoStringInput.value : "";
        
        const loader = document.getElementById("loadingOverlay");

        // Validation rule validation checks (Ensuring structural inputs are not blank)
        if (!nameField || !dobField || !phoneField || !villageField || !countyField || !districtField || !countryField || !churchField || !areaField || !pastorField || !dobaptismField) {
            alert("⚠️ Modification Denied: All profile data fields must remain fully populated.");
            return;
        }

        try {
            if (loader) loader.style.display = "block";

            // Structuring the final write payload mapping object
            const updateFieldsPayload = {
                name: nameField,
                dob: dobField,
                phone: phoneField,
                village: villageField,
                address: villageField, // Fallback legacy alignment hook
                county: countyField,
                district: districtField,
                country: countryField,
                church: churchField,
                area: areaField,
                pastor: pastorField,
                dobaptism: dobaptismField
            };

            // Grab the tiny, space-optimized text string from our background cache loop container
            if (base64PhotoData) {
                updateFieldsPayload.photoURL = base64PhotoData;
            }

            const databaseTargetRef = doc(db, "members", currentTargetUid);
            await updateDoc(databaseTargetRef, updateFieldsPayload);

            alert("🎉 Profile records updated successfully!");
            
            if (document.getElementById("welcomeName")) {
                document.getElementById("welcomeName").innerText = nameField;
            }
            
            // Clean up the optimization alert layout box for clean future interactions
            const photoStatus = document.getElementById("photoStatus");
            if (photoStatus) photoStatus.style.display = "none";

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
