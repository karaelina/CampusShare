document.addEventListener("DOMContentLoaded", () => {

  function getCurrentStudent() {
    try {
      const current = JSON.parse(
        localStorage.getItem("campusShareCurrentUser") || "null"
      );

      if (current) return current;

      return JSON.parse(
        localStorage.getItem("campusShareStudent") || "null"
      );
    } catch {
      return null;
    }
  }

  const student = getCurrentStudent();

  if (!student) return;

  const firstName = String(student.firstName || "").trim();
  const lastName = String(student.lastName || "").trim();

  const fullName =
    [firstName, lastName].filter(Boolean).join(" ").trim() ||
    student.name ||
    "Student";

  const studentId =
    String(student.studentId || "").trim() || "—";

  const email =
    String(student.email || "").trim() || "—";

  const school =
    String(student.school || "").trim() || "—";

  const initial =
    fullName.charAt(0).toUpperCase();

  const initials =
    fullName
      .split(/\s+/)
      .filter(Boolean)
      .map(word => word.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase();


  /* =====================================================
     1. UPDATE COMMON ID-BASED PROFILE ELEMENTS
  ===================================================== */

  const textMap = {
    profileName: fullName,
    studentName: fullName,
    profileStudentName: fullName,
    profileStudentId: studentId,
    studentId: studentId,
    profileEmail: email,
    studentEmail: email,
    profileSchool: school,
    studentSchool: school,
    profileInitial: initial,
    studentInitial: initial,
    sidebarName: fullName,
    sidebarStudentId: `${studentId} · ${school}`,
    sidebarAvatar: initial,
    profileButton: initial,
    topAvatar: initial,
    userAvatar: initial,
    avatarInitial: initial
  };

  Object.entries(textMap).forEach(([id, value]) => {
    const element = document.getElementById(id);

    if (element) {
      element.textContent = value;
    }
  });


  /* =====================================================
     2. UPDATE ANY AVATAR ELEMENTS
        This catches the top-right J and sidebar J
        even if their HTML uses different class names.
  ===================================================== */

  const avatarSelectors = [
    ".avatar",
    ".user-avatar",
    ".profile-avatar",
    ".student-avatar",
    ".sidebar-avatar",
    ".top-avatar",
    ".profile-button",
    ".user-button",
    "[class*='avatar']",
    "[id*='avatar']"
  ];

  document
    .querySelectorAll(avatarSelectors.join(","))
    .forEach(element => {

      const currentText =
        element.textContent.trim();

      if (
        currentText === "J" ||
        currentText === "JD" ||
        currentText === "JUAN"
      ) {
        element.textContent = initial;
      }

    });


  /* =====================================================
     3. UPDATE OLD DEMO IDENTITY TEXT
        Only exact matches are changed.
  ===================================================== */

  const oldValues = {
    "Juan dela Cruz": fullName,
    "2024-00123": studentId,
    "juan.delacruz@psau.edu.ph": email
  };

  function replaceTextNode(node) {

    if (node.nodeType !== Node.TEXT_NODE) {
      return;
    }

    const original = node.nodeValue.trim();

    if (!original) return;

    if (oldValues[original]) {
      node.nodeValue =
        node.nodeValue.replace(
          original,
          oldValues[original]
        );
    }

  }

  const walker =
    document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT
    );

  const textNodes = [];

  let node;

  while (node = walker.nextNode()) {
    textNodes.push(node);
  }

  textNodes.forEach(replaceTextNode);


  /* =====================================================
     4. UPDATE INPUTS / TEXTAREAS IF PROFILE USES THEM
  ===================================================== */

  document
    .querySelectorAll("input, textarea")
    .forEach(input => {

      const value =
        String(input.value || "").trim();

      if (value === "Juan dela Cruz") {
        input.value = fullName;
      }

      if (value === "2024-00123") {
        input.value = studentId;
      }

      if (value === "juan.delacruz@psau.edu.ph") {
        input.value = email;
      }

    });

});
