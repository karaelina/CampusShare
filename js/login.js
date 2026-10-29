document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const identifier = document.getElementById("identifier");
  const password = document.getElementById("password");
  const message = document.getElementById("formMessage");
  const createAccountBtn = document.getElementById("createAccountBtn");
  const forgotPassword = document.getElementById("forgotPassword");

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

  const demoAccount = {
    id: "STU-DEMO",
    firstName: "Juan",
    lastName: "dela Cruz",
    studentId: "2024-00123",
    email: "juan.delacruz@psau.edu.ph",
    password: "password123",
    school: "PSAU Main Campus",
    createdAt: "2026-01-01T00:00:00.000Z"
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const idOrEmail = identifier.value.trim().toLowerCase();
    const pass = password.value;

    if (!idOrEmail || !pass) {
      showMessage(
        "Please enter your Student ID/email and password.",
        "error"
      );
      return;
    }

    const accounts = getAccounts();

    const allAccounts = [
      demoAccount,
      ...accounts.filter(
        account =>
          account.studentId !== demoAccount.studentId &&
          account.email !== demoAccount.email
      )
    ];

    const account = allAccounts.find(item => {
      const studentId = String(item.studentId || "").trim().toLowerCase();
      const email = String(item.email || "").trim().toLowerCase();

      return studentId === idOrEmail || email === idOrEmail;
    });

    if (!account || account.password !== pass) {
      showMessage(
        "Invalid Student ID/email or password.",
        "error"
      );
      return;
    }

    localStorage.setItem(
      "campusShareCurrentUser",
      JSON.stringify(account)
    );

    showMessage(
      `Welcome back, ${account.firstName}! Opening your student portal...`,
      "success"
    );

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 650);
  });

  createAccountBtn.addEventListener("click", () => {
    window.location.href = "register.html";
  });

  forgotPassword.addEventListener("click", event => {
    event.preventDefault();
    showMessage(
      "Password recovery will be connected when we build the account recovery flow.",
      "error"
    );
  });
});
