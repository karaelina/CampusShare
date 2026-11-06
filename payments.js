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
    ["Approved", "Active", "Completed", "Returned"].includes(x.status)
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
    const isVerified =
      ["Approved", "Active", "Completed", "Returned"].includes(x.status);

    const statusText = isVerified ? "Verified" : "Pending";
    const detail = isVerified
      ? "Payment verified"
      : "Awaiting administrator verification";

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
            <span class="badge ${isVerified ? "verified" : "pending-badge"}">${statusText}</span>
          </div>
        </div>

        <div class="record-detail">
          <div><span>Rental period</span><b>${x.start} → ${x.end}</b></div>
          <div><span>Payment method</span><b>${x.payment}</b></div>
          <div><span>Reference</span><b>${x.ref}</b></div>
          <div><span>Rental status</span><b>${x.status || "Pending"}</b></div>
          <div><span>Payment status</span><b>${detail}</b></div>
        </div>
      </article>
    `;
  }).join("");

  document.querySelectorAll(".record-main").forEach(element => {
    element.addEventListener("click", () => {
      element.parentElement.classList.toggle("open");
    });
  });
}

render();
