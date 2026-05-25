// js/admin-download.js
import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const ADMIN_EMAIL = "nicholasbagenda@gmail.com";
let approvedMembersMemoryCache = [];
let pendingMembersMemoryCache = [];

// 1. GATEKEEPER SECURITY CHECK
onAuthStateChanged(auth, async (user) => {
    if (!user || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        alert("🔒 Access Denied: This download portal is restricted to the head Church Administrator.");
        window.location.href = "index.html";
        return;
    }
    await buildChurchLedgerData();
});

// 2. FETCH AND SORT RECORDS FROM FIRESTORE
async function buildChurchLedgerData() {
    try {
        const querySnapshot = await getDocs(collection(db, "members"));
        approvedMembersMemoryCache = [];
        pendingMembersMemoryCache = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const memberObj = {
                name: data.name || "N/A",
                dob: data.dob || "N/A",
                phone: data.phone || "N/A",
                email: data.email || "N/A",
                village: data.village || data.address || "N/A",
                county: data.county || "N/A",
                district: data.district || "N/A",
                country: data.country || "Uganda",
                church: data.church || "N/A",
                area: data.area || "N/A",
                pastor: data.pastor || "N/A",
                dobaptism: data.dobaptism || "N/A",
                status: data.status || "pending",
                createdAt: data.createdAt ? data.createdAt.substring(0, 10) : "N/A"
            };

            if (memberObj.status.toLowerCase() === "approved") {
                approvedMembersMemoryCache.push(memberObj);
            } else {
                pendingMembersMemoryCache.push(memberObj);
            }
        });

        // Update counts on UI elements
        document.getElementById("approvedCount").innerText = approvedMembersMemoryCache.length;
        document.getElementById("pendingCount").innerText = pendingMembersMemoryCache.length;

        // Render distinct data tables
        renderTableRows(approvedMembersMemoryCache, "approvedTableBody");
        renderTableRows(pendingMembersMemoryCache, "pendingTableBody");

        // Turn off loading screen indicator and reveal tables
        document.getElementById("masterLoading").style.display = "none";
        document.getElementById("portalContent").style.display = "block";

    } catch (err) {
        console.error("Failed to read church records roster:", err);
        alert("⚠️ Access Error: Ensure your security rules are published in Firebase. Details: " + err.message);
    }
}

function renderTableRows(dataset, elementId) {
    const tableBody = document.getElementById(elementId);
    if (!tableBody) return;
    tableBody.innerHTML = "";

    if (dataset.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#64748b; padding:20px;">No records found in this category.</td></tr>`;
        return;
    }

    dataset.forEach(m => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><strong>${m.name}</strong></td>
            <td>${m.phone}</td>
            <td>${m.village}</td>
            <td>${m.district}</td>
            <td>${m.church}</td>
            <td>${elementId === "approvedTableBody" ? m.dobaptism : m.createdAt}</td>
        `;
        tableBody.appendChild(row);
    });
}

// 3. EXPORT CONTROLLER ENGINES (EXPOSED GLOBALLY)
window.exportList = function(targetStatus) {
    const dataToExport = targetStatus === 'approved' ? approvedMembersMemoryCache : pendingMembersMemoryCache;
    if (dataToExport.length === 0) {
        alert("⚠️ Export canceled: The chosen list is currently empty.");
        return;
    }
    generateCSVFile(dataToExport, `Naigobya_SDA_${targetStatus}_members`);
};

window.downloadBothLists = function() {
    const combinedData = [...approvedMembersMemoryCache, ...pendingMembersMemoryCache];
    if (combinedData.length === 0) {
        alert("⚠️ Export canceled: There are zero records available.");
        return;
    }
    generateCSVFile(combinedData, "Naigobya_SDA_All_Members_Master_Ledger");
};

function generateCSVFile(arrayData, filename) {
    const headers = ["Full Name", "Date of Birth", "Phone Number", "Email Address", "Village", "County", "District", "Country", "Local Church", "Church District Area", "Pastor in Charge", "Date of Baptism", "Verification Status"];
    let csvRows = [headers.join(",")];

    for (const row of arrayData) {
        const values = [
            row.name, row.dob, row.phone, row.email, row.village, row.county, 
            row.district, row.country, row.church, row.area, row.pastor, row.dobaptism, row.status.toUpperCase()
        ];
        
        const sanitizedValues = values.map(value => {
            const cleanString = ("" + value).replace(/"/g, '""'); 
            return cleanString.includes(",") ? `"${cleanString}"` : cleanString;
        });
        csvRows.push(sanitizedValues.join(","));
    }

    const csvContent = "\uFEFF" + csvRows.join("\n"); 
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
