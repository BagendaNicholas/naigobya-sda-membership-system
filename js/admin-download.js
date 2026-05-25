// js/admin-download.js
import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const ADMIN_EMAIL = "nicholasbagenda@gmail.com";
let approvedMembersMemoryCache = [];
let pendingMembersMemoryCache = [];
let currentPrintFilter = "all"; // Tracks active structural context array filter

// 1. SECURITY TIMEOUT ENGINE CHECK
onAuthStateChanged(auth, async (user) => {
    if (!user || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        alert("🔒 Access Denied: This download portal is restricted to the head Church Administrator.");
        window.location.href = "index.html";
        return;
    }
    await buildChurchLedgerData();
});

// 2. QUERY RECOVERY CONTROLLER
async function buildChurchLedgerData() {
    try {
        const querySnapshot = await getDocs(collection(db, "members"));
        approvedMembersMemoryCache = [];
        pendingMembersMemoryCache = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const fallbackAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name || 'Member')}`;
            
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
                photoURL: data.photoURL || fallbackAvatar,
                status: data.status || "pending",
                createdAt: data.createdAt ? data.createdAt.substring(0, 10) : "N/A"
            };

            if (memberObj.status.toLowerCase() === "approved") {
                approvedMembersMemoryCache.push(memberObj);
            } else {
                pendingMembersMemoryCache.push(memberObj);
            }
        });

        document.getElementById("approvedCount").innerText = approvedMembersMemoryCache.length;
        document.getElementById("pendingCount").innerText = pendingMembersMemoryCache.length;

        renderTableRows(approvedMembersMemoryCache, "approvedTableBody");
        renderTableRows(pendingMembersMemoryCache, "pendingTableBody");

        document.getElementById("masterLoading").style.display = "none";
        document.getElementById("portalContent").style.display = "block";

    } catch (err) {
        console.error("Firestore Read Failure:", err);
        alert("⚠️ Access Error: " + err.message);
    }
}

function renderTableRows(dataset, elementId) {
    const tableBody = document.getElementById(elementId);
    if (!tableBody) return;
    tableBody.innerHTML = "";

    if (dataset.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#64748b; padding:20px;">No records found.</td></tr>`;
        return;
    }

    dataset.forEach(m => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><img src="${m.photoURL}" class="row-avatar" alt="Avatar"></td>
            <td><strong>${m.name}</strong></td>
            <td>${m.phone}</td>
            <td>${m.village}</td>
            <td>${m.district}</td>
            <td>${elementId === "approvedTableBody" ? m.dobaptism : m.createdAt}</td>
        `;
        tableBody.appendChild(row);
    });
}

// 3. GENERATE MOBILE PROFILE PRINT CARD ENTRIES (FLEX INJECTION)
window.activatePrintLayout = function(defaultFilter = 'all') {
    currentPrintFilter = defaultFilter;
    buildPrintableCards();

    document.querySelectorAll('.web-ui-element').forEach(el => el.style.display = 'none');
    document.getElementById("printReportView").style.display = "block";
    window.scrollTo(0, 0);
};

// Refactored array processing module with tab states toggles
function buildPrintableCards() {
    const cardTargetContainer = document.getElementById("printableMasterCards");
    if (!cardTargetContainer) return;
    cardTargetContainer.innerHTML = "";

    // Sync button UI classes
    document.querySelectorAll('.print-filter-tabs .filter-btn').forEach(btn => btn.classList.remove('active'));
    if (currentPrintFilter === 'all') document.getElementById("tabBtnAll")?.classList.add('active');
    if (currentPrintFilter === 'approved') document.getElementById("tabBtnApproved")?.classList.add('active');
    if (currentPrintFilter === 'pending') document.getElementById("tabBtnPending")?.classList.add('active');

    // Filter memory state cache vectors
    let targetDataset = [];
    if (currentPrintFilter === "all") {
        targetDataset = [...approvedMembersMemoryCache, ...pendingMembersMemoryCache];
    } else if (currentPrintFilter === "approved") {
        targetDataset = approvedMembersMemoryCache;
    } else if (currentPrintFilter === "pending") {
        targetDataset = pendingMembersMemoryCache;
    }

    if (targetDataset.length === 0) {
        cardTargetContainer.innerHTML = `<div style="text-align:center; padding:40px; color:#475569; font-weight:bold;">No contextual matching roster profiles found for selection block.</div>`;
        return;
    }

    // 👑 Flex row layout logic to fix mobile columns cascading error bugs 
    targetDataset.forEach(m => {
        const card = document.createElement("div");
        card.className = "member-print-card";
        
        const isApproved = m.status.toLowerCase() === "approved";
        const badgeStyle = isApproved ? "background:#dcfce7; color:#15803d; border-color:#15803d;" : "background:#fef3c7; color:#b45309; border-color:#b45309;";
        const dateLabel = isApproved ? "Baptized Date" : "Registered Date";
        const dateValue = isApproved ? m.dobaptism : m.createdAt;

        card.innerHTML = `
            <img src="${m.photoURL}" class="print-avatar" alt="Profile">
            <div class="print-card-details">
                <h4>${m.name}</h4>
                <div class="print-info-row"><span class="print-info-label">Phone:</span><span class="print-info-value">${m.phone}</span></div>
                <div class="print-info-row"><span class="print-info-label">DOB:</span><span class="print-info-value">${m.dob}</span></div>
                <div class="print-info-row"><span class="print-info-label">Village:</span><span class="print-info-value">${m.village}</span></div>
                <div class="print-info-row"><span class="print-info-label">District:</span><span class="print-info-value">${m.district}</span></div>
                <div class="print-info-row"><span class="print-info-label">Church:</span><span class="print-info-value">${m.church}</span></div>
                <div class="print-info-row"><span class="print-info-label">${dateLabel}:</span><span class="print-info-value">${dateValue}</span></div>
            </div>
            <span class="print-badge" style="${badgeStyle}">${m.status}</span>
        `;
        cardTargetContainer.appendChild(card);
    });
}

// Live interactive trigger for UI filtering tabs
window.switchPrintFilter = function(filterType) {
    currentPrintFilter = filterType;
    buildPrintableCards();
};

window.closePrintLayout = function() {
    document.getElementById("printReportView").style.display = "none";
    document.querySelectorAll('.web-ui-element').forEach(el => {
        if(el.classList.contains('panel-container')) el.style.display = 'block';
        if(el.classList.contains('navbar')) el.style.display = 'flex';
    });
};

window.exportList = function(targetStatus) {
    const dataToExport = targetStatus === 'approved' ? approvedMembersMemoryCache : pendingMembersMemoryCache;
    if (dataToExport.length === 0) { alert("⚠️ List is empty."); return; }
    generateCSVFile(dataToExport, `Naigobya_SDA_${targetStatus}_members`);
};

window.downloadBothLists = function() {
    const combinedData = [...approvedMembersMemoryCache, ...pendingMembersMemoryCache];
    if (combinedData.length === 0) { alert("⚠️ Roster is empty."); return; }
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
        const sanitizedValues = values.map(v => {
            const clean = ("" + v).replace(/"/g, '""'); 
            return clean.includes(",") ? `"${clean}"` : clean;
        });
        csvRows.push(sanitizedValues.join(","));
    }

    const csvContent = "\uFEFF" + csvRows.join("\n"); 
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        link.setAttribute("href", URL.createObjectURL(blob));
        link.setAttribute("download", `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
