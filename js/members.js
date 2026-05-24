// js/members.js

import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";


// ADMIN EMAIL
const ADMIN_EMAIL =
"nicholasbagenda@gmail.com";


// ACTIVE TARGET USER
let currentTargetUid = null;


// AUTH WATCHER
onAuthStateChanged(auth, async(user)=>{

    // NOT LOGGED IN
    if(!user){

        alert(
        "🔒 Please login first."
        );

        window.location.href =
        "admin-login.html";

        return;

    }

    // URL PARAMS
    const urlParams =
    new URLSearchParams(
    window.location.search
    );

    const targetUid =
    urlParams.get("uid");


    // ADMIN MODE
    if(
    user.email.toLowerCase()
    ===
    ADMIN_EMAIL.toLowerCase()
    ){

        // SHOW ADMIN LINK
        const adminLink =
        document.getElementById(
        "adminLink"
        );

        if(adminLink){

            adminLink.style.display =
            "inline-block";

        }

        // EDIT OTHER MEMBER
        if(targetUid){

            currentTargetUid =
            targetUid;

        }
        else{

            // DEFAULT TO ADMIN OWN PROFILE
            currentTargetUid =
            user.uid;

        }

    }
    else{

        // NORMAL MEMBER
        currentTargetUid =
        user.uid;

    }


    // LOAD PROFILE
    await loadMemberProfile(
    currentTargetUid
    );

});


// LOAD MEMBER DATA
async function loadMemberProfile(uid){

    try{

        const memberRef =
        doc(db, "members", uid);

        const snapshot =
        await getDoc(memberRef);

        if(!snapshot.exists()){

            alert(
            "⚠️ Member profile not found."
            );

            return;

        }

        const data =
        snapshot.data();


        // PROFILE HEADER
        document.getElementById(
        "welcomeName"
        ).innerText =
        data.fullName ||
        "Church Member";


        // INPUTS
        document.getElementById(
        "memberName"
        ).value =
        data.fullName || "";


        document.getElementById(
        "memberDOB"
        ).value =
        data.dateOfBirth || "";


        document.getElementById(
        "memberCountry"
        ).value =
        data.country || "";


        document.getElementById(
        "memberPhone"
        ).value =
        data.phoneNumber || "";


        document.getElementById(
        "memberPastor"
        ).value =
        data.pastor || "";


        document.getElementById(
        "memberBaptism"
        ).value =
        data.baptismDate || "";


        document.getElementById(
        "memberDistrict"
        ).value =
        data.district || "";


        document.getElementById(
        "memberVillage"
        ).value =
        data.village || "";


        document.getElementById(
        "memberEmail"
        ).value =
        data.email || "";


        // STATUS
        const statusBox =
        document.getElementById(
        "accountStatus"
        );

        const status =
        (
        data.status ||
        "pending"
        ).toLowerCase();


        statusBox.innerText =
        status.toUpperCase();

        statusBox.className =
        `status-${status}`;


        // PHOTO
        const avatar =
        document.getElementById(
        "displayAvatar"
        );

        if(data.photoURL){

            avatar.src =
            data.photoURL;

        }
        else{

            avatar.src =
            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.fullName || "Member")}`;

        }

    }
    catch(error){

        console.error(error);

        alert(
        "⚠️ Failed to load member profile."
        );

    }

}


// IMAGE UPDATE
const photoInput =
document.getElementById(
"updatePhoto"
);

if(photoInput){

    photoInput.addEventListener(
    "change",
    function(){

        const file =
        this.files[0];

        if(file){

            // SIZE LIMIT
            if(file.size > 1024 * 1024){

                alert(
                "⚠️ Please choose image below 1MB."
                );

                this.value = "";

                return;

            }

            const reader =
            new FileReader();

            reader.onload =
            function(e){

                const imageString =
                e.target.result;

                // DISPLAY
                document.getElementById(
                "displayAvatar"
                ).src =
                imageString;

                // SAVE STRING
                document.getElementById(
                "updatePhotoBase64"
                ).value =
                imageString;

            };

            reader.readAsDataURL(file);

        }

    });

}


// SAVE PROFILE
const saveBtn =
document.getElementById(
"saveProfileBtn"
);

if(saveBtn){

    saveBtn.addEventListener(
    "click",
    async()=>{

        if(!currentTargetUid){

            alert(
            "⚠️ User ID missing."
            );

            return;

        }

        // INPUTS
        const fullName =
        document.getElementById(
        "memberName"
        ).value.trim();


        const dateOfBirth =
        document.getElementById(
        "memberDOB"
        ).value.trim();


        const country =
        document.getElementById(
        "memberCountry"
        ).value.trim();


        const phoneNumber =
        document.getElementById(
        "memberPhone"
        ).value.trim();


        const pastor =
        document.getElementById(
        "memberPastor"
        ).value.trim();


        const baptismDate =
        document.getElementById(
        "memberBaptism"
        ).value.trim();


        const district =
        document.getElementById(
        "memberDistrict"
        ).value.trim();


        const village =
        document.getElementById(
        "memberVillage"
        ).value.trim();


        const photoURL =
        document.getElementById(
        "updatePhotoBase64"
        ).value;


        const loading =
        document.getElementById(
        "loading"
        );


        // VALIDATION
        if(
        !fullName ||
        !phoneNumber ||
        !country
        ){

            alert(
            "⚠️ Please fill required fields."
            );

            return;

        }


        try{

            loading.style.display =
            "block";


            const updateData = {

                fullName,

                dateOfBirth,

                country,

                phoneNumber,

                pastor,

                baptismDate,

                district,

                village

            };


            // PHOTO
            if(photoURL){

                updateData.photoURL =
                photoURL;

            }


            // UPDATE FIRESTORE
            await updateDoc(
                doc(
                db,
                "members",
                currentTargetUid
                ),
                updateData
            );


            // UPDATE TITLE
            document.getElementById(
            "welcomeName"
            ).innerText =
            fullName;


            alert(
            "✅ Profile Updated Successfully!"
            );

        }
        catch(error){

            console.error(error);

            alert(
            "⚠️ Failed to save changes."
            );

        }
        finally{

            loading.style.display =
            "none";

        }

    });

}


// LOGOUT
window.logoutUser =
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
