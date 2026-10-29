const KEY = "campusShareRentals";
const USER_KEY = "campusShareCurrentUser";

function getCurrentUser() {
  try {
    return JSON.parse(
      localStorage.getItem(USER_KEY) || "null"
    );
  } catch {
    return null;
  }
}

function getAllRentals() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function rentals() {
  const user = getCurrentUser();
  const all = getAllRentals();

  if (!user) return [];

  const studentId = String(user.studentId || "").trim().toLowerCase();
  const email = String(user.email || "").trim().toLowerCase();
  const accountId = String(user.id || "").trim().toLowerCase();

  return all.filter(rental => {
    const rentalStudentId =
      String(rental.studentId || "").trim().toLowerCase();

    const rentalEmail =
      String(rental.studentEmail || "").trim().toLowerCase();

    const rentalAccountId =
      String(rental.studentAccountId || "").trim().toLowerCase();

    return (
      (studentId && rentalStudentId && rentalStudentId === studentId) ||
      (email && rentalEmail && rentalEmail === email) ||
      (accountId && rentalAccountId && rentalAccountId === accountId)
    );
  });
}

function money(n) {
  return "₱" + Number(n || 0).toLocaleString();
}

function render() {
  const r = rentals();

  const total = r.reduce((s, x) => s + Number(x.total || 0), 0);
  const pending = r.filter(x => x.status === "Pending");

  const verified = r.filter(x =>
    ["Completed", "Returned"].includes(x.status)
  );

  const verifiedTotal = verified.reduce(
    (s, x) => s + Number(x.total || 0),
    0
  );

  const pendingTotal = pending.reduce(
    (s, x) => s + Number(x.total || 0),
    0
  );

  const totalSpent = document.getElementById("totalSpent");
  const transactionCount = document.getElementById("transactionCount");
  const verifiedElement = document.getElementById("verified");
  const verifiedCount = document.getElementById("verifiedCount");
  const pendingElement = document.getElementById("pending");
  const pendingCount = document.getElementById("pendingCount");
  const el = document.getElementById("records");

  if (totalSpent) totalSpent.textContent = money(total);
  if (transactionCount) {
    transactionCount.textContent =
      `${r.length} transaction${r.length === 1 ? "" : "s"}`;
  }

  if (verifiedElement) verifiedElement.textContent = money(verifiedTotal);
  if (verifiedCount) {
    verifiedCount.textContent =
      `${verified.length} transaction${verified.length === 1 ? "" : "s"}`;
  }

  if (pendingElement) pendingElement.textContent = money(pendingTotal);
  if (pendingCount) {
    pendingCount.textContent =
      `${pending.length} transaction${pending.length === 1 ? "" : "s"}`;
  }

  if (!el) return;

  if (!r.length) {
    el.innerHTML =
      '<div style="padding:45px;text-align:center;color:#777">No payment records yet. <a href="equipment.html">Browse equipment →</a></div>';
    return;
  }

  el.innerHTML = r.map((x, i) => {
    const isCompleted =
      ["Completed", "Returned"].includes(x.status);

    const statusText = "Demo only";
    const detail = isCompleted
      ? "Rental returned; payment gateway is not connected"
      : "No gateway verification; payment is simulated only";

    return `
      <article class="record">
        <div class="record-main" data-i="${i}">
          <div class="record-info">
            <div class="record-icon">▤</div>
            <div>
              <strong>${x.equipment} <small style="display:inline">#${x.ref}</small></strong>
              <small>${x.provider} · ${x.payment}</small>
            </div>
          </div>

          <div class="amount">
            <strong>${money(x.total)}</strong>
            <span class="badge pending-badge">${statusText}</span>
          </div>
        </div>

        <div class="record-detail">
          <div><span>Rental period</span><b>${x.start} → ${x.end}</b></div>
          <div><span>Payment method</span><b>${x.payment}</b></div>
          <div><span>Reference</span><b>${x.ref}</b></div>
          <div><span>Rental status</span><b>${x.status || "Pending"}</b></div>
          <div><span>Payment status</span><b>${x.paymentStatus || detail}</b></div>
          <div><span>CampusShare commission (10%)</span><b>${money(x.commissionAmount ?? Number((Number(x.total || 0) * 0.10).toFixed(2)))}</b></div>
          <div><span>Provider share (90%, before gateway fees)</span><b>${money(x.providerShare ?? Number((Number(x.total || 0) * 0.90).toFixed(2)))}</b></div>
          <div><span>Settlement status</span><b>${x.settlementStatus || "Pending return"}</b></div>
          <div><span>Provider payout</span><b>${x.payoutStatus || "Not paid — demo only"}</b></div>
          <div class="payment-actions">
            ${x.disputeStatus && x.disputeStatus !== "None"
              ? `<span class="payment-dispute-status">Issue reported: ${x.disputeStatus}</span>`
              : x.demoPaymentStatus === "SUCCESS"
                ? `<button type="button" class="report-issue-btn" data-report-issue="${String(x.ref || "").replace(/"/g, "&quot;")}">Report issue / request review</button>`
                : `<span class="payment-dispute-status">Issue reporting available after successful demo checkout</span>`}
          </div>
          <small class="demo-only-label">DEMO ONLY · No real money movement</small>
        </div>
      </article>
    `;
  }).join("");

  document.querySelectorAll(".record-main").forEach(element => {
    element.addEventListener("click", () => {
      element.parentElement.classList.toggle("open");
    });
  });

  document.querySelectorAll("[data-report-issue]").forEach(button => {
    button.addEventListener("click", () => {
      const ref = button.dataset.reportIssue;
      const reason = window.prompt("Briefly describe the issue. This creates a demo dispute and puts settlement on hold.");
      if (!reason || !reason.trim()) return;
      const all = getAllRentals();
      const target = all.find(item => String(item.ref || "") === String(ref));
      if (!target) return;
      if (target.demoPaymentStatus !== "SUCCESS") {
        window.alert("A dispute can only be opened for a rental with a successful demo payment. No payment was recorded for this request.");
        return;
      }
      if (!["Pending", "Approved", "Active", "Completed", "Returned"].includes(target.status)) {
        window.alert("This rental is not in a state that supports issue reporting.");
        return;
      }
      target.disputeStatus = "Pending admin review";
      target.disputeReason = reason.trim().slice(0, 1000);
      target.disputeCreatedAt = new Date().toISOString();
      target.settlementStatus = "On hold — admin review";
      target.payoutStatus = "On hold — demo only";
      localStorage.setItem(KEY, JSON.stringify(all));
      render();
      window.alert("Demo issue recorded. Settlement is on hold in this browser prototype. No real payment or payout was affected.");
    });
  });
}

render();
