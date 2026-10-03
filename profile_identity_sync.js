/* =========================
   CAMPUSSHARE PROFILE
   STUDENT IDENTITY SYNC
========================= */

document.addEventListener("DOMContentLoaded", () => {

  function getCurrentStudent() {

    try {
      return JSON.parse(
        localStorage.getItem("campusShareCurrentUser") || "null"
      ) || JSON.parse(
        localStorage.getItem("campusShareStudent") || "null"
      );
    } catch {
      return null;
    }

  }


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
    student.studentId || "";


  const email =
    student.email || "";


  const school =
    student.school || "";


  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .map(word => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();


  /*
     First handle common IDs if the existing
     profile page uses them.
  */

  const idMap = {

    profileName: name,
    studentName: name,

    profileStudentId: studentId,
    studentId: studentId,

    profileEmail: email,
    studentEmail: email,

    profileSchool: school,
    studentSchool: school,

    profileInitial: initials.charAt(0),
    studentInitial: initials.charAt(0),

    sidebarName: name,
    sidebarStudentId:
      `${studentId}${school ? " · " + school : ""}`,
    sidebarAvatar: initials.charAt(0),
    profileButton: initials.charAt(0)

  };


  Object.entries(idMap)
    .forEach(([id, value]) => {

      const element =
        document.getElementById(id);

      if (element && value !== "") {
        element.textContent = value;
      }

    });


  /*
     Fallback for existing static profile content.
     This catches the old demo identity without
     changing the page layout.
  */

  const replacements = {

    "Juan dela Cruz": name,

    "2024-00123":
      studentId,

    "juan.delacruz@psau.edu.ph":
      email,

    "PSAU":
      school

  };


  document
    .querySelectorAll("*")
    .forEach(element => {

      if (
        element.children.length > 0
      ) {
        return;
      }


      const value =
        element.textContent.trim();


      if (
        replacements[value] !== undefined &&
        replacements[value] !== ""
      ) {

        element.textContent =
          replacements[value];

      }

    });


  document
    .querySelectorAll(
      "input, textarea"
    )
    .forEach(field => {

      if (
        field.value ===
        "Juan dela Cruz"
      ) {
        field.value = name;
      }

      if (
        field.value ===
        "2024-00123"
      ) {
        field.value = studentId;
      }

      if (
        field.value ===
        "juan.delacruz@psau.edu.ph"
      ) {
        field.value = email;
      }

    });

});
