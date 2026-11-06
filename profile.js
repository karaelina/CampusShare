/* =========================
   CAMPUSSHARE PROFILE
========================= */

const USER_KEY = "campusShareCurrentUser";
const RENTAL_KEY = "campusShareRentals";

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
    return JSON.parse(
      localStorage.getItem(RENTAL_KEY) || "[]"
    );
  } catch {
    return [];
  }
}

function getRentals() {
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

/* =========================
   UPDATE PROFILE IDENTITY
========================= */

function updateProfileIdentity() {
  const user = getCurrentUser();

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const fullName = [
    user.firstName,
    user.lastName
  ]
    .filter(Boolean)
    .join(" ")
    .trim() || user.name || "Student";

  const studentId = user.studentId || "Student";
  const school = user.school || "CampusShare Student";
  const email = user.email || "No email provided";

  const initial =
    fullName.trim().charAt(0).toUpperCase() || "S";

  /* SIDEBAR */
  const sidebarAvatar = document.querySelector(".student-card .avatar");
  const sidebarName = document.querySelector(".student-card strong");
  const sidebarMeta = document.querySelector(".student-card small");

  if (sidebarAvatar) {
    sidebarAvatar.textContent = initial;
  }

  if (sidebarName) {
    sidebarName.textContent = fullName;
  }

  if (sidebarMeta) {
    sidebarMeta.textContent = `${studentId} · ${school}`;
  }

  /* TOP AVATAR */
  const topAvatar = document.querySelector(".top-avatar");

  if (topAvatar) {
    topAvatar.textContent = initial;
  }

  /* PROFILE HERO */
  const profileAvatar = document.querySelector(".profile-avatar");
  const profileName = document.querySelector(".profile-main-info h2");
  const profileStudentId = document.querySelector(".profile-main-info p");

  if (profileAvatar) {
    profileAvatar.textContent = initial;
  }

  if (profileName) {
    profileName.textContent = fullName;
  }

  if (profileStudentId) {
    profileStudentId.textContent = `Student ID: ${studentId}`;
  }

  /* PERSONAL INFORMATION */
  const infoItems = document.querySelectorAll(".profile-card .info-item");

  infoItems.forEach(item => {
    const label = item.querySelector("small");
    const value = item.querySelector("strong");

    if (!label || !value) return;

    const labelText = label.textContent.trim().toLowerCase();

    if (labelText === "full name") {
      value.textContent = fullName;
    }

    if (labelText === "student id") {
      value.textContent = studentId;
    }

    if (labelText === "university") {
      value.textContent = school;
    }

    if (labelText === "email address") {
      value.textContent = email;
    }
  });
}

/* =========================
   UPDATE RENTAL SUMMARY
========================= */

function updateRentalSummary() {
  const rentals = getRentals();

  const total = rentals.length;

  const pending = rentals.filter(
    rental => rental.status === "Pending"
  ).length;

  const active = rentals.filter(
    rental => rental.status === "Active"
  ).length;

  const completed = rentals.filter(
    rental =>
      rental.status === "Completed" ||
      rental.status === "Returned"
  ).length;

  const totalEl = document.getElementById("totalRentals");
  const pendingEl = document.getElementById("pendingRentals");
  const activeEl = document.getElementById("activeRentals");
  const completedEl = document.getElementById("completedRentals");

  if (totalEl) totalEl.textContent = total;
  if (pendingEl) pendingEl.textContent = pending;
  if (activeEl) activeEl.textContent = active;
  if (completedEl) completedEl.textContent = completed;
}

/* =========================
   INITIAL LOAD
========================= */

document.addEventListener("DOMContentLoaded", () => {
  updateProfileIdentity();
  updateRentalSummary();
});
