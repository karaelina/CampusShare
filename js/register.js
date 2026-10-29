document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const firstName = document.getElementById("firstName");
  const lastName = document.getElementById("lastName");
  const studentId = document.getElementById("studentId");
  const email = document.getElementById("email");
  const school = document.getElementById("school");
  const password = document.getElementById("password");
  const confirmPassword = document.getElementById("confirmPassword");
  const message = document.getElementById("formMessage");

  function showMessage(text, type) {
    message.textContent = text;
    message.className = `form-message ${type}`;
  }

  function getAccounts() {
    try {
      return JSON.parse(
        localStorage.getItem("campusShareAccounts")
      ) || [];
    } catch {
      return [];
    }
  }

  function saveAccounts(accounts) {
    localStorage.setItem(
      "campusShareAccounts",
      JSON.stringify(accounts)
    );
  }

  form.addEventListener("submit", event => {
    event.preventDefault();

    message.className = "form-message";
    message.textContent = "";

    const first = firstName.value.trim();
    const last = lastName.value.trim();
    const id = studentId.value.trim();
    const userEmail = email.value.trim().toLowerCase();
    const userSchool = school.value.trim();
    const pass = password.value;
    const confirm = confirmPassword.value;

    if (!first || !last || !id || !userEmail || !userSchool || !pass || !confirm) {
      showMessage("Please complete all required fields.", "error");
      return;
    }

    if (pass.length < 6) {
      showMessage("Password must be at least 6 characters.", "error");
      return;
    }

    if (pass !== confirm) {
      showMessage("Passwords do not match.", "error");
      return;
    }

    const accounts = getAccounts();

    const existingStudentId = accounts.find(
      account =>
        String(account.studentId || "").trim().toLowerCase() ===
        id.toLowerCase()
    );

    if (existingStudentId) {
      showMessage("That Student ID is already registered.", "error");
      return;
    }

    const existingEmail = accounts.find(
      account =>
        String(account.email || "").trim().toLowerCase() === userEmail
    );

    if (existingEmail) {
      showMessage("That email address is already registered.", "error");
      return;
    }

    const account = {
      id: "STU-" + Date.now().toString().slice(-6),
      firstName: first,
      lastName: last,
      studentId: id,
      email: userEmail,
      school: userSchool,
      password: pass,
      createdAt: new Date().toISOString()
    };

    accounts.push(account);
    saveAccounts(accounts);

    showMessage(
      "Student account created successfully! Redirecting to login...",
      "success"
    );

    form.reset();

    setTimeout(() => {
      window.location.href = "login.html";
    }, 900);
  });
});
