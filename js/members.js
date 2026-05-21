// js/members.js
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

let currentTargetUid = null; // Stores target document reference scope
let isAdminUser = false;     // Privilege flag tracking context

// 1. MONITOR AUTHENTICATION STATE & LOCK ACCESS DOWN SECURELY
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        alert("🔒 Unauthorized access. Please log into your account first.");
        window.location.href = "login.html"; // Redirect unauthenticated guests instantly
        return;
    }

    // Determine privilege context: Check if logged-in user is the dedicated admin
    if (user.email === "nicholasbagenda@gmail.com") {
        isAdminUser = true;
        document.getElementById("adminLink").style.display = "inline-block"; // Show dashboard link
        
        // URL Parameter Lookup parsing (?uid=MEMBER_ID)
        const urlParams = new URLSearchParams(window.location.search);
        currentTargetUid = urlParams.get("uid");

        if (!currentTargetUid) {
            alert("Admin Mode: Please navigate here via the Admin Dashboard to select a member profile.");
            window.location.href = "admin-dashboard.html";
            return;
        }
    } else {
        // Regular user context: Lock target path strictly to their own UID document block
        currentTargetUid = user.uid;
        document.getElementById("adminLink").style.display = "none";
    }

    // Pull profile payload metrics safely
    await loadMemberData(currentTargetUid);
});

// 2. FETCH FIREBASE DOCUMENT DATA AND INJECT INTO FORM
async function loadMemberData(uid) {
    try {
        const docRef = doc(db, "members", uid);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            alert("❌ User profile entry could not be discovered inside the cloud database records.");
            return;
        }

        const data = docSnap.data();

        // Populate visual layout elements safely
        document.getElementById("welcomeName").innerText = data.name || "Church Member";
        document.getElementById("memberName").value = data.name || "";
        document.getElementById("memberPhone").value = data.phone || "";
        document.getElementById("memberVillage").value = data.address || "";
        
        // Update live status indicators
        const statusBox = document.getElementById("accountStatus");
        statusBox.innerText = data.status || "pending";
        statusBox.className = `status-badge status-${data.status || 'pending'}`;

        // Load custom base64 image or apply standard avatar asset path string fallback
        if (data.photoURL) {
            document.getElementById("displayAvatar").src = data.photoURL;
        } else {
            document.getElementById("displayAvatar").src = "https://via.placeholder.com/150";
        }

    } catch (error) {
        console.error("Failed to read user document attributes cleanly:", error);
    }
}

// 3. LISTEN FOR PHOTO INPUT CHANGES & ENCODE LOCAL CONVERSIONS TO BASE64
document.getElementById("updatePhoto").addEventListener("change", function() {
    const file = this.files[0];
    if (file) {
        if (file.size > 1024 * 1024) { // Enforce 1MB limit for Firestore comfort
            alert("⚠️ Image file is too large. Please select a compressed picture below 1MB.");
            this.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById("displayAvatar").src = e.target.result;
            document.getElementById("updatePhotoBase64").value = e.target.result; // Store base64 data
        };
        reader.readAsDataURL(file);
    }
});

// 4. TRANSACTION SAVE BUTTON LOGIC ACTION HANDLER
document.getElementById("saveProfileBtn").addEventListener("click", async () => {
    if (!currentTargetUid) return;

    const name = document.getElementById("memberName").value.trim();
    const phone = document.getElementById("memberPhone").value.trim();
    const village = document.getElementById("memberVillage").value.trim();
    const newPhotoBase64 = document.getElementById("updatePhotoBase64").value;
    const loading = document.getElementById("loadingOverlay");

    if (!name || !phone || !village) {
        alert("⚠️ All fields are required to process updates.");
        return;
    }

    try {
        loading.style.display = "block";

        const updatePayload = {
            name: name,
            phone: phone,
            address: village
        };

        // If a new photo was uploaded, include it in the update payload
        if (newPhotoBase64) {
            updatePayload.photoURL = newPhotoBase64;
        }

        // Commit modifications directly back up to cloud document path location
        const docRef = doc(db, "members", currentTargetUid);
        await updateDoc(docRef, updatePayload);

        alert("🎉 Profile records successfully updated!");
        
        // Refresh display variables
        document.getElementById("welcomeName").innerText = name;

    } catch (error) {
        console.error("Write execution failed on destination document profile root:", error);
        alert(`Error committing records: ${error.message}`);
    } finally {
        loading.style.display = "none";
    }
});

// 5. TERMINATE LIVE SESSIONS LOGOUT ACTION
document.getElementById("logoutBtn").addEventListener("click", async () => {
    if (confirm("Are you sure you want to log out?")) {
        await signOut(auth);
        window.location.href = "login.html"; // Send them back to login page
    }
});

