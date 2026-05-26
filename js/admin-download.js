// Refactored array processing module with tab states toggles
function buildPrintableCards() {
    const cardTargetContainer = document.getElementById("printableMasterCards");
    if (!cardTargetContainer) return;
    cardTargetContainer.innerHTML = "";

    // Sync interactive active style layout highlights
    document.querySelectorAll('.print-filter-tabs .filter-btn').forEach(btn => btn.classList.remove('active'));
    if (currentPrintFilter === 'all') document.getElementById("tabBtnAll")?.classList.add('active');
    if (currentPrintFilter === 'approved') document.getElementById("tabBtnApproved")?.classList.add('active');
    if (currentPrintFilter === 'pending') document.getElementById("tabBtnPending")?.classList.add('active');

    // Route correct filtered vector data resource
    let targetDataset = [];
    if (currentPrintFilter === "all") {
        targetDataset = [...approvedMembersMemoryCache, ...pendingMembersMemoryCache];
    } else if (currentPrintFilter === "approved") {
        targetDataset = approvedMembersMemoryCache;
    } else if (currentPrintFilter === "pending") {
        targetDataset = pendingMembersMemoryCache;
    }

    if (targetDataset.length === 0) {
        cardTargetContainer.innerHTML = `<div style="text-align:center; padding:40px; color:#475569; font-weight:bold;">No matching church records found for this view scope.</div>`;
        return;
    }

    // Loop through records to build card components (Reconstructed for side-by-side PDF rendering)
    targetDataset.forEach(m => {
        const card = document.createElement("div");
        card.className = "member-print-card";
        
        const isApproved = m.status.toLowerCase() === "approved";
        const badgeStyle = isApproved ? "background:#dcfce7; color:#15803d; border-color:#15803d;" : "background:#fef3c7; color:#b45309; border-color:#b45309;";
        
        // Match string names with your exact design mockups
        const dateLabel = isApproved ? "Baptized Date" : "Registered Date";
        const dateValue = isApproved ? m.dobaptism : m.createdAt;

        card.innerHTML = `
            <img src="${m.photoURL}" class="print-avatar" alt="Profile">
            <div class="print-card-details">
                <div class="print-card-header-row">
                    <h4>${m.name}</h4>
                    <span class="print-badge" style="${badgeStyle}">${m.status}</span>
                </div>
                
                <div class="print-grid-body">
                    <div class="print-grid-cell"><span class="field-lbl">Phone:</span><span class="field-val">${m.phone}</span></div>
                    <div class="print-grid-cell"><span class="field-lbl">DOB:</span><span class="field-val">${m.dob}</span></div>
                    
                    <div class="print-grid-cell"><span class="field-lbl">Village:</span><span class="field-val">${m.village}</span></div>
                    <div class="print-grid-cell"><span class="field-lbl">District:</span><span class="field-val">${m.district}</span></div>
                    
                    <div class="print-grid-cell"><span class="field-lbl">Church:</span><span class="field-val">${m.church}</span></div>
                    <div class="print-grid-cell"><span class="field-lbl">Pastor:</span><span class="field-val">${m.pastor}</span></div>
                    
                    <div class="print-grid-cell full-width-cell"><span class="field-lbl">${dateLabel}:</span><span class="field-val">${dateValue}</span></div>
                </div>
            </div>
        `;
        cardTargetContainer.appendChild(card);
    });
}
