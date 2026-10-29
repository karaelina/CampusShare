window.CampusShareStudent = {

  getCurrent() {
    try {
      return JSON.parse(
        localStorage.getItem("campusShareCurrentUser") || "null"
      );
    } catch {
      return null;
    }
  },

  getFullName(student) {
    if (!student) return "Student";

    return [
      student.firstName,
      student.lastName
    ]
      .filter(Boolean)
      .join(" ")
      .trim() || student.name || "Student";
  },

  getInitial(student) {
    const name = this.getFullName(student);

    return name
      .charAt(0)
      .toUpperCase();
  },

  getInitials(student) {
    const name = this.getFullName(student);

    return name
      .split(/\s+/)
      .filter(Boolean)
      .map(word => word.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase();
  },

  requireLogin() {
    const student = this.getCurrent();

    if (!student) {
      window.location.href = "login.html";
      return null;
    }

    return student;
  }

};