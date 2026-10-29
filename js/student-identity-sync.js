/* =========================================
   CAMPUSSHARE — SHARED STUDENT SESSION
   Single source of truth: campusShareCurrentUser
========================================= */

(function () {
  "use strict";

  function getCurrentStudent() {
    try {
      const currentUser = JSON.parse(
        localStorage.getItem("campusShareCurrentUser") || "null"
      );

      if (currentUser && typeof currentUser === "object") {
        return currentUser;
      }

      const legacyUser = JSON.parse(
        localStorage.getItem("campusShareStudent") || "null"
      );

      return legacyUser && typeof legacyUser === "object"
        ? legacyUser
        : null;
    } catch {
      return null;
    }
  }

  function syncStudentIdentity() {
    const student = getCurrentStudent();
    if (!student) return;

    const name =
      [student.firstName, student.lastName]
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

    const firstInitial =
      name.charAt(0).toUpperCase();

    const fullStudentLabel =
      `${studentId}${school ? " · " + school : ""}`;

    /* ---- Preferred IDs ---- */
    const sidebarName =
      document.getElementById("sidebarName");

    const sidebarStudentId =
      document.getElementById("sidebarStudentId");

    const sidebarAvatar =
      document.getElementById("sidebarAvatar");

    const profileButton =
      document.getElementById("profileButton");

    if (sidebarName) {
      sidebarName.textContent = name;
    }

    if (sidebarStudentId) {
      sidebarStudentId.textContent = fullStudentLabel;
    }

    if (sidebarAvatar) {
      sidebarAvatar.textContent = firstInitial;
    }

    if (profileButton) {
      profileButton.textContent = firstInitial;
    }

    /* ---- Generic sidebar fallback ----
       Handles older pages that still have
       hard-coded Juan/demo text and no IDs.
    */
    document.querySelectorAll(".student-card").forEach(card => {
      const nameNode = card.querySelector("strong");
      const infoNode = card.querySelector("small");
      const avatar = card.querySelector(".avatar");

      if (nameNode) {
        nameNode.textContent = name;
      }

      if (infoNode) {
        infoNode.textContent = fullStudentLabel;
      }

      if (avatar) {
        avatar.textContent = firstInitial;
      }
    });

    /* ---- Replace old demo text anywhere ---- */
    document.querySelectorAll("*").forEach(element => {
      if (element.children.length > 0) return;

      const value = element.textContent.trim();

      if (value === "Juan dela Cruz") {
        element.textContent = name;
      }

      if (value === "2024-00123 · PSAU") {
        element.textContent = fullStudentLabel;
      }

      if (value === "2024-00123") {
        element.textContent = studentId;
      }
    });

    /* ---- Top-right profile/avatar buttons ---- */
    document
      .querySelectorAll(
        ".top-avatar, [title='Profile'], #profileButton"
      )
      .forEach(button => {
        if (button) {
          button.textContent = firstInitial;
        }
      });

    /* ---- Common welcome name ---- */
    const welcomeName =
      document.getElementById("welcomeName");

    if (welcomeName) {
      welcomeName.textContent =
        name.split(/\s+/)[0];
    }
  }

  function run() {
    syncStudentIdentity();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }

  /* Run once more after page scripts finish their own rendering. */
  setTimeout(run, 50);
  setTimeout(run, 250);

  /* Keep the UI synced if another page script changes it. */
  window.addEventListener("storage", event => {
    if (
      event.key === "campusShareCurrentUser" ||
      event.key === "campusShareStudent"
    ) {
      run();
    }
  });

  window.CampusShareStudentSession = {
    getCurrentStudent,
    syncStudentIdentity
  };
})();
