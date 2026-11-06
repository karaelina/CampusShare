function getCurrentStudent() {

  try {
    return JSON.parse(
      localStorage.getItem("campusShareCurrentUser") || "null"
    );
  } catch {
    return null;
  }

}


function getRentals() {

  const allRentals = (() => {

    try {
      return JSON.parse(
        localStorage.getItem("campusShareRentals") || "[]"
      );
    } catch {
      return [];
    }

  })();


  const student = getCurrentStudent();

  if (!student) {
    return [];
  }


  const studentId =
    String(student.studentId || "")
      .trim()
      .toLowerCase();

  const studentEmail =
    String(student.email || "")
      .trim()
      .toLowerCase();

  const studentAccountId =
    String(student.id || "")
      .trim()
      .toLowerCase();


  return allRentals.filter(rental => {

    const rentalStudentId =
      String(rental.studentId || "")
        .trim()
        .toLowerCase();

    const rentalEmail =
      String(rental.studentEmail || "")
        .trim()
        .toLowerCase();

    const rentalAccountId =
      String(rental.studentAccountId || "")
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
        rentalEmail &&
        rentalEmail === studentEmail
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
  return new Date(date + "T00:00:00")
    .toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
}


/* =========================
   UPDATE STUDENT INFO
========================= */

function updateStudentInfo() {

  const student = getCurrentStudent();

  if (!student) {
    return;
  }


  const name =
    [
      student.firstName,
      student.lastName
    ]
      .filter(Boolean)
      .join(" ")
      .trim() ||

    student.name ||

    "Student";


  const studentId =
    student.studentId ||

    "Student";


  const school =
    student.school ||

    "CampusShare Student";


  const initials =
    name
      .split(" ")
      .map(word => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();


  const sidebarName =
    document.getElementById("sidebarName");

  const sidebarStudentId =
    document.getElementById("sidebarStudentId");

  const welcomeName =
    document.getElementById("welcomeName");

  const sidebarAvatar =
    document.getElementById("sidebarAvatar");

  const profileButton =
    document.getElementById("profileButton");


  if (sidebarName) {
    sidebarName.textContent = name;
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

  const rentals = getRentals();


  const total =
    rentals.length;


  const active =
    rentals.filter(
      rental => rental.status === "Active"
    ).length;


  const pending =
    rentals.filter(
      rental => rental.status === "Pending"
    ).length;


  const completed =
    rentals.filter(
      rental =>
        rental.status === "Completed" ||
        rental.status === "Returned"
    ).length;


  document.getElementById("totalRentals").textContent =
    total;

  document.getElementById("activeRentals").textContent =
    active;

  document.getElementById("pendingRentals").textContent =
    pending;

  document.getElementById("completedRentals").textContent =
    completed;


  updateWelcomeMessage(active, pending);
}


/* =========================
   WELCOME MESSAGE
========================= */

function updateWelcomeMessage(active, pending) {

  const message =
    document.getElementById("welcomeMessage");


  if (active > 0 && pending > 0) {

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
    document.getElementById("currentRental");


  const rentals =
    getRentals();


  const activeRental =
    rentals.find(
      rental => rental.status === "Active"
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
    document.getElementById("recentRental");


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
        new Date(b.createdAt || b.start) -
        new Date(a.createdAt || a.start)
    );


  const rental =
    sorted[0];


  const statusClass =
    rental.status.toLowerCase();


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
          ₱${Number(rental.total).toLocaleString()}
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
    document.getElementById("recentNotifications");


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
        new Date(b.createdAt || b.start) -
        new Date(a.createdAt || a.start)
    );


  const latest =
    sorted.slice(0, 3);


  container.innerHTML =
    latest.map(rental => {

      let title = "";
      let message = "";
      let icon = "✓";
      let iconClass = "success-icon";


      if (rental.status === "Pending") {

        title =
          "Rental Request Submitted";

        message =
          `Your request for ${rental.equipment} is waiting for administrator approval.`;

        icon = "◷";
        iconClass = "reminder-icon";

      }

      else if (rental.status === "Approved") {

        title =
          "Rental Approved";

        message =
          `Your rental of ${rental.equipment} has been approved.`;

        icon = "✓";
        iconClass = "success-icon";

      }

      else if (rental.status === "Active") {

        title =
          "Equipment Checked Out";

        message =
          `${rental.equipment} is currently checked out to you.`;

        icon = "▣";
        iconClass = "success-icon";

      }

      else {

        title =
          "Rental Completed";

        message =
          `Your rental of ${rental.equipment} has been completed and returned.`;

        icon = "✓";
        iconClass = "success-icon";

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
      rental => rental.status === "Pending"
    ).length;


  const sidebarBadge =
    document.getElementById("notificationBadge");

  const buttonBadge =
    document.getElementById("notificationButtonBadge");


  sidebarBadge.textContent =
    unread;

  buttonBadge.textContent =
    unread;


  if (unread === 0) {

    sidebarBadge.style.display =
      "none";

    buttonBadge.style.display =
      "none";

  } else {

    sidebarBadge.style.display =
      "inline-flex";

    buttonBadge.style.display =
      "inline-flex";

  }
}


/* =========================
   BUTTON NAVIGATION
========================= */

document
  .getElementById("profileButton")
  .addEventListener("click", () => {

    window.location.href =
      "profile.html";

  });


document
  .getElementById("notificationButton")
  .addEventListener("click", () => {

    window.location.href =
      "notifications.html";

  });


/* =========================
   GLOBAL SEARCH
========================= */

document
  .getElementById("globalSearch")
  .addEventListener("keydown", event => {

    if (event.key !== "Enter") return;


    const query =
      event.target.value.trim();


    if (!query) return;


    window.location.href =
      `equipment.html?search=${encodeURIComponent(query)}`;

  });


/* =========================
   INITIALIZE DASHBOARD
========================= */

updateStudentInfo();
updateStats();
renderCurrentRental();
renderRecentRental();
renderRecentNotifications();
updateNotificationBadge();