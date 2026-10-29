/* =========================
   CAMPUSSHARE MY RENTALS
========================= */


/* =========================
   CURRENT STUDENT
========================= */

function getCurrentStudent() {

  try {

    const currentUser =
      JSON.parse(
        localStorage.getItem("campusShareCurrentUser") || "null"
      );

    if (currentUser) {
      return currentUser;
    }
    return currentUser;

} catch {

    return null;

  }

}


const currentStudent =
  getCurrentStudent();


/* =========================
   AUTH CHECK
========================= */

if (!currentStudent) {

  window.location.href =
    "login.html";

}


/* =========================
   RENTAL STORAGE
========================= */

function getAllRentals() {

  try {

    return JSON.parse(
      localStorage.getItem("campusShareRentals") || "[]"
    );

  } catch {

    return [];

  }

}


/* =========================
   STUDENT-SPECIFIC RENTALS
========================= */

function getRentals() {

  if (!currentStudent) {
    return [];
  }


  const studentId =
    String(
      currentStudent.studentId || ""
    )
      .trim()
      .toLowerCase();


  const studentEmail =
    String(
      currentStudent.email || ""
    )
      .trim()
      .toLowerCase();


  const studentAccountId =
    String(
      currentStudent.id || ""
    )
      .trim()
      .toLowerCase();


  return getAllRentals().filter(rental => {

    /*
      IMPORTANT:
      Old demo rentals without student ownership
      are intentionally excluded.

      Only rentals created for a student account
      can appear in My Rentals.
    */

    const rentalStudentId =
      String(
        rental.studentId || ""
      )
        .trim()
        .toLowerCase();


    const rentalStudentEmail =
      String(
        rental.studentEmail || ""
      )
        .trim()
        .toLowerCase();


    const rentalAccountId =
      String(
        rental.studentAccountId || ""
      )
        .trim()
        .toLowerCase();


    return (

      (
        studentId &&
        rentalStudentId &&
        rentalStudentId === studentId
      ) ||

      (
        studentEmail &&
        rentalStudentEmail &&
        rentalStudentEmail === studentEmail
      ) ||

      (
        studentAccountId &&
        rentalAccountId &&
        rentalAccountId === studentAccountId
      )

    );

  });

}


/* =========================
   FORMAT DATE
========================= */

function formatDate(date) {

  return new Date(
    date + "T00:00:00"
  )
    .toLocaleDateString(
      "en-PH",
      {
        month: "short",
        day: "numeric",
        year: "numeric"
      }
    );

}


/* =========================
   UPDATE STUDENT INFO
========================= */

function updateStudentInfo() {

  if (!currentStudent) return;


  const name =
    [
      currentStudent.firstName,
      currentStudent.lastName
    ]
      .filter(Boolean)
      .join(" ")
      .trim() ||

    currentStudent.name ||

    "Student";


  const studentId =
    currentStudent.studentId ||

    "Student";


  const school =
    currentStudent.school ||

    "CampusShare Student";


  const initials =
    name
      .split(" ")
      .map(word => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();


  const sidebarName =
    document.getElementById(
      "sidebarName"
    );

  const sidebarStudentId =
    document.getElementById(
      "sidebarStudentId"
    );

  const welcomeName =
    document.getElementById(
      "welcomeName"
    );

  const sidebarAvatar =
    document.getElementById(
      "sidebarAvatar"
    );

  const profileButton =
    document.getElementById(
      "profileButton"
    );


  if (sidebarName) {

    sidebarName.textContent =
      name;

  }


  if (sidebarStudentId) {

    sidebarStudentId.textContent =
      `${studentId} · ${school}`;

  }


  if (welcomeName) {

    welcomeName.textContent =
      name.split(" ")[0];

  }


  if (sidebarAvatar) {

    sidebarAvatar.textContent =
      initials.charAt(0);

  }


  if (profileButton) {

    profileButton.textContent =
      initials.charAt(0);

  }

}


/* =========================
   UPDATE RENTAL STATS
========================= */

function updateStats() {

  const rentals =
    getRentals();


  const total =
    rentals.length;


  const active =
    rentals.filter(
      rental =>
        rental.status === "Active"
    ).length;


  const pending =
    rentals.filter(
      rental =>
        rental.status === "Pending"
    ).length;


  const completed =
    rentals.filter(
      rental =>
        rental.status === "Completed" ||
        rental.status === "Returned"
    ).length;


  document.getElementById(
    "totalRentals"
  ).textContent =
    total;


  document.getElementById(
    "activeRentals"
  ).textContent =
    active;


  document.getElementById(
    "pendingRentals"
  ).textContent =
    pending;


  document.getElementById(
    "completedRentals"
  ).textContent =
    completed;


  updateWelcomeMessage(
    active,
    pending
  );

}


/* =========================
   WELCOME MESSAGE
========================= */

function updateWelcomeMessage(
  active,
  pending
) {

  const message =
    document.getElementById(
      "welcomeMessage"
    );


  if (!message) return;


  if (
    active > 0 &&
    pending > 0
  ) {

    message.innerHTML =
      `You have <b class="green-text">${active} active rental${active > 1 ? "s" : ""}</b> and <b class="yellow-text">${pending} pending approval${pending > 1 ? "s" : ""}</b>.`;

  }

  else if (active > 0) {

    message.innerHTML =
      `You currently have <b class="green-text">${active} active rental${active > 1 ? "s" : ""}</b>.`;

  }

  else if (pending > 0) {

    message.innerHTML =
      `You have <b class="yellow-text">${pending} rental request${pending > 1 ? "s" : ""}</b> awaiting approval.`;

  }

  else {

    message.textContent =
      "You currently have no active or pending rentals.";

  }

}


/* =========================
   CURRENT RENTAL
========================= */

function renderCurrentRental() {

  const container =
    document.getElementById(
      "currentRental"
    );


  if (!container) return;


  const rentals =
    getRentals();


  const activeRental =
    rentals.find(
      rental =>
        rental.status === "Active"
    );


  if (!activeRental) {

    container.innerHTML = `
      <article class="rental-card">

        <div class="equipment-icon">
          —
        </div>

        <div class="rental-info">

          <div class="rental-title-row">

            <strong>
              No active rental
            </strong>

            <span class="status-pill">
              None
            </span>

          </div>

          <div class="muted">
            You currently have no active equipment rental.
          </div>

          <div class="due">
            Browse available equipment to start a new rental.
          </div>

        </div>

      </article>
    `;

    return;

  }


  container.innerHTML = `
    <article class="rental-card">

      <div class="equipment-icon">
        ▣
      </div>

      <div class="rental-info">

        <div class="rental-title-row">

          <strong>
            ${activeRental.equipment}
          </strong>

          <span class="status-pill success">
            Active
          </span>

        </div>

        <div class="muted">
          ${activeRental.provider}
          ·
          ${formatDate(activeRental.start)}
          –
          ${formatDate(activeRental.end)}
        </div>

        <div class="due">
          ◉ Pickup:
          ${activeRental.pickup}
        </div>

      </div>

    </article>
  `;

}


/* =========================
   RECENT RENTAL
========================= */

function renderRecentRental() {

  const container =
    document.getElementById(
      "recentRental"
    );


  if (!container) return;


  const rentals =
    getRentals();


  if (!rentals.length) {

    container.innerHTML = `
      <article class="rental-card">

        <div class="equipment-icon">
          —
        </div>

        <div class="rental-info">

          <div class="rental-title-row">

            <strong>
              No rental history
            </strong>

          </div>

          <div class="muted">
            Your recent rental activity will appear here.
          </div>

        </div>

      </article>
    `;

    return;

  }


  const sorted =
    [...rentals].sort(
      (a, b) =>
        new Date(
          b.createdAt || b.start
        ) -

        new Date(
          a.createdAt || a.start
        )
    );


  const rental =
    sorted[0];


  const statusClass =
    String(
      rental.status || ""
    ).toLowerCase();


  container.innerHTML = `
    <article class="rental-card">

      <div class="equipment-icon">
        ▣
      </div>

      <div class="rental-info">

        <div class="rental-title-row">

          <strong>
            ${rental.equipment}
          </strong>

          <span class="status-pill ${statusClass}">
            ${rental.status}
          </span>

        </div>

        <div class="muted">
          ${rental.provider}
          ·
          ${formatDate(rental.start)}
          –
          ${formatDate(rental.end)}
        </div>

        <div class="due">
          ₱${Number(
            rental.total
          ).toLocaleString()}
          ·
          ${rental.payment}
          ·
          ${rental.ref}
        </div>

      </div>

    </article>
  `;

}


/* =========================
   RECENT NOTIFICATIONS
========================= */

function renderRecentNotifications() {

  const container =
    document.getElementById(
      "recentNotifications"
    );


  if (!container) return;


  const rentals =
    getRentals();


  if (!rentals.length) {

    container.innerHTML = `
      <article class="notification-row">

        <div class="notice-icon">
          ✓
        </div>

        <div>

          <strong>
            No recent notifications
          </strong>

          <p>
            Your latest CampusShare updates will appear here.
          </p>

        </div>

      </article>
    `;

    return;

  }


  const sorted =
    [...rentals].sort(
      (a, b) =>
        new Date(
          b.createdAt || b.start
        ) -

        new Date(
          a.createdAt || a.start
        )
    );


  const latest =
    sorted.slice(0, 3);


  container.innerHTML =
    latest.map(rental => {

      let title = "";
      let message = "";
      let icon = "✓";
      let iconClass = "success-icon";


      if (
        rental.status === "Pending"
      ) {

        title =
          "Rental Request Submitted";

        message =
          `Your request for ${rental.equipment} is waiting for administrator approval.`;

        icon = "◷";
        iconClass =
          "reminder-icon";

      }

      else if (
        rental.status === "Approved"
      ) {

        title =
          "Rental Approved";

        message =
          `Your rental of ${rental.equipment} has been approved.`;

        icon = "✓";
        iconClass =
          "success-icon";

      }

      else if (
        rental.status === "Active"
      ) {

        title =
          "Equipment Checked Out";

        message =
          `${rental.equipment} is currently checked out to you.`;

        icon = "▣";
        iconClass =
          "success-icon";

      }

      else {

        title =
          "Rental Completed";

        message =
          `Your rental of ${rental.equipment} has been completed and returned.`;

        icon = "✓";
        iconClass =
          "success-icon";

      }


      return `
        <article class="notification-row">

          <div class="notice-icon ${iconClass}">
            ${icon}
          </div>

          <div>

            <strong>
              ${title}
            </strong>

            <p>
              ${message}
            </p>

          </div>

        </article>
      `;

    }).join("");

}


/* =========================
   NOTIFICATION BADGE
========================= */

function updateNotificationBadge() {

  const rentals =
    getRentals();


  const unread =
    rentals.filter(
      rental =>
        rental.status === "Pending"
    ).length;


  const sidebarBadge =
    document.getElementById(
      "notificationBadge"
    );

  const buttonBadge =
    document.getElementById(
      "notificationButtonBadge"
    );


  if (!sidebarBadge || !buttonBadge) {
    return;
  }


  sidebarBadge.textContent =
    unread;

  buttonBadge.textContent =
    unread;


  if (unread === 0) {

    sidebarBadge.style.display =
      "none";

    buttonBadge.style.display =
      "none";

  }

  else {

    sidebarBadge.style.display =
      "inline-flex";

    buttonBadge.style.display =
      "inline-flex";

  }

}


/* =========================
   BUTTON NAVIGATION
========================= */

const profileButton =
  document.getElementById(
    "profileButton"
  );

if (profileButton) {

  profileButton.addEventListener(
    "click",
    () => {

      window.location.href =
        "profile.html";

    }
  );

}


const notificationButton =
  document.getElementById(
    "notificationButton"
  );

if (notificationButton) {

  notificationButton.addEventListener(
    "click",
    () => {

      window.location.href =
        "notifications.html";

    }
  );

}


/* =========================
   GLOBAL SEARCH
========================= */

const globalSearch =
  document.getElementById(
    "globalSearch"
  );

if (globalSearch) {

  globalSearch.addEventListener(
    "keydown",
    event => {

      if (
        event.key !== "Enter"
      ) {
        return;
      }


      const query =
        event.target.value.trim();


      if (!query) return;


      window.location.href =
        `equipment.html?search=${encodeURIComponent(query)}`;

    }
  );

}


/* =========================
   MY RENTALS PAGE (LIVE STATUS)
========================= */

let activeRentalFilter = "all";

function displayRentalDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-PH", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit"
  });
}

function renderMyRentals() {
  const rentals = getRentals().slice().sort((a, b) =>
    new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
  const count = status => rentals.filter(r => status.includes(r.status)).length;
  const setCount = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
  setCount("pending", count(["Pending"]));
  setCount("approved", count(["Approved"]));
  setCount("active", count(["Active"]));
  setCount("completed", count(["Completed", "Returned"]));

  const list = document.getElementById("rentalList");
  if (!list) return;
  const visible = activeRentalFilter === "all" ? rentals : rentals.filter(r =>
    activeRentalFilter === "Completed" ? ["Completed", "Returned"].includes(r.status) : r.status === activeRentalFilter
  );
  if (!visible.length) {
    list.innerHTML = `<div class="empty"><strong>No ${activeRentalFilter === "all" ? "rental requests" : activeRentalFilter.toLowerCase() + " rentals"} yet.</strong><p>Your rental requests and provider updates will appear here.</p></div>`;
    return;
  }
  list.innerHTML = visible.map(r => {
    const status = r.status || "Pending";
    const safe = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#39;"}[ch]));
    const duration = r.hours ? `${r.hours} hour${r.hours === 1 ? "" : "s"}` : (r.days ? `${r.days} day${r.days === 1 ? "" : "s"}` : "—");
    const ratingRows = (() => { try { const rows = JSON.parse(localStorage.getItem("campusShareRatings") || "[]"); return Array.isArray(rows) ? rows : []; } catch { return []; } })();
    const existingRating = ratingRows.find(row => String(row.rentalRef) === String(r.ref || ""));
    const canRate = ["Completed", "Returned"].includes(status) && /successful/i.test(String(r.paymentStatus || ""));
    const ratingBlock = canRate ? (existingRating
      ? `<div class="cs-rating-saved"><strong>Your rating:</strong> <span>${"★".repeat(Number(existingRating.rating || 0))}${"☆".repeat(5 - Number(existingRating.rating || 0))}</span> <small>${safe(existingRating.review || "Thanks for your feedback!")}</small></div>`
      : `<div class="cs-rating-editor" data-rating-editor="${safe(r.ref || "")}"><label>Rate your rental experience</label><select data-rating-value aria-label="Rating from one to five stars"><option value="5">★★★★★ — Excellent</option><option value="4">★★★★☆ — Good</option><option value="3">★★★☆☆ — Okay</option><option value="2">★★☆☆☆ — Poor</option><option value="1">★☆☆☆☆ — Very poor</option></select><textarea data-rating-review rows="2" placeholder="Optional review about the equipment/provider"></textarea><button type="button" class="modal-secondary" data-submit-rating="${safe(r.ref || "")}">Submit Rating</button></div>`)
      : "";
    return `<article class="rental-card" style="margin-top:14px;padding:20px;border:1px solid #dedede;border-radius:14px;background:#fff;display:flex;gap:16px;justify-content:space-between;align-items:flex-start;flex-wrap:wrap">
      <div class="rental-info" style="flex:1;min-width:230px">
        <div class="rental-title-row"><strong>${safe(r.equipment || "Equipment")}</strong><span class="badge">${safe(status)}</span></div>
        <p class="muted">${safe(r.provider || r.campusName || "CampusShare Provider")} · Request #${safe(r.ref || "—")}</p>
        <p>Rental period: ${safe(displayRentalDate(r.start))} – ${safe(displayRentalDate(r.end))}</p>
        <p>Duration: ${safe(duration)} · Rate: ₱${Number(r.hourlyRate ?? r.pricePerHour ?? 0).toLocaleString()}/hour</p>
        <p>Pickup / use location: ${safe(r.pickup || r.pickupLocation || "Provider-designated location")}</p>
        <strong>Estimated total: ₱${Number(r.total || 0).toLocaleString()}</strong>
        <p class="muted">Payment: ${safe(r.paymentStatus || "Not simulated yet")} · ${safe(r.payment || "Demo method")}</p>
        ${r.statusUpdatedAt ? `<p class="muted">Last updated: ${safe(displayRentalDate(r.statusUpdatedAt))}</p>` : ""}
        ${ratingBlock}
      </div>
      <button type="button" class="modal-secondary" data-view-rental="${safe(r.ref || "")}">View Details</button>
    </article>`;
  }).join("");

  list.querySelectorAll("[data-view-rental]").forEach(button => button.addEventListener("click", () => {
    const rental = rentals.find(r => String(r.ref || "") === button.dataset.viewRental);
    if (!rental) return;
    const modal = document.getElementById("rentalModal");
    const put = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
    put("modalEquipment", rental.equipment || "Equipment");
    put("modalProvider", `${rental.provider || rental.campusName || "Provider"} · ₱${Number(rental.total || 0).toLocaleString()}`);
    put("modalStatus", rental.status || "Pending");
    const details = document.getElementById("modalDetails");
    if (details) details.innerHTML = `<p><b>Request:</b> ${String(rental.ref || "—")}</p><p><b>Period:</b> ${displayRentalDate(rental.start)} – ${displayRentalDate(rental.end)}</p><p><b>Pickup:</b> ${String(rental.pickup || rental.pickupLocation || "Provider-designated location")}</p><p><b>Payment:</b> ${String(rental.payment || "—")}</p><p><b>Estimated total:</b> ₱${Number(rental.total || 0).toLocaleString()}</p>`;
    modal?.classList.add("show");
    modal?.classList.remove("hidden");
  }));

  list.querySelectorAll("[data-submit-rating]").forEach(button => button.addEventListener("click", () => {
    const ref = button.dataset.submitRating;
    const rental = rentals.find(row => String(row.ref || "") === String(ref));
    if (!rental || !["Completed", "Returned"].includes(rental.status) || !/successful/i.test(String(rental.paymentStatus || ""))) { alert("Only completed rentals with successful demo payment can be rated."); return; }
    let ratings = [];
    try { ratings = JSON.parse(localStorage.getItem("campusShareRatings") || "[]"); if (!Array.isArray(ratings)) ratings = []; } catch { ratings = []; }
    if (ratings.some(row => String(row.rentalRef) === String(ref))) { alert("You have already rated this rental."); renderMyRentals(); return; }
    const editor = button.closest("[data-rating-editor]");
    const rating = Number(editor?.querySelector("[data-rating-value]")?.value || 5);
    const review = String(editor?.querySelector("[data-rating-review]")?.value || "").trim();
    ratings.push({ id: "RATE-" + Date.now(), rentalRef: String(ref), equipmentId: String(rental.equipmentId || rental.itemId || ""), equipment: String(rental.equipment || "Equipment"), provider: String(rental.provider || rental.campusName || "CampusShare Provider"), studentId: String(currentStudent?.studentId || currentStudent?.id || ""), studentName: [currentStudent?.firstName, currentStudent?.lastName].filter(Boolean).join(" ").trim() || currentStudent?.name || "Student", rating, review, createdAt: new Date().toISOString() });
    localStorage.setItem("campusShareRatings", JSON.stringify(ratings));
    renderMyRentals();
    alert("Thank you! Your demo rating has been saved.");
  }));
}

document.querySelectorAll("[data-filter]").forEach(button => button.addEventListener("click", () => {
  activeRentalFilter = button.dataset.filter || "all";
  document.querySelectorAll("[data-filter]").forEach(tab => tab.classList.toggle("active", tab === button));
  renderMyRentals();
}));

const rentalModalElement = document.getElementById("rentalModal");
const closeRentalModal = document.getElementById("closeModal");
if (closeRentalModal) closeRentalModal.addEventListener("click", () => {
  rentalModalElement?.classList.remove("show");
  rentalModalElement?.classList.add("hidden");
});
if (rentalModalElement) rentalModalElement.addEventListener("click", event => {
  if (event.target === rentalModalElement) {
    rentalModalElement.classList.remove("show");
    rentalModalElement.classList.add("hidden");
  }
});

// Refresh when another page/tab changes the shared localStorage rental records.
window.addEventListener("storage", event => {
  if (event.key === "campusShareRentals") renderMyRentals();
});

/* =========================
   INITIALIZE
========================= */

updateStudentInfo();
renderMyRentals();
renderCurrentRental();
renderRecentRental();
renderRecentNotifications();
updateNotificationBadge();
