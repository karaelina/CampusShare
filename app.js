document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("loginBtn").addEventListener("click", () => {
    window.location.href = "login.html";
  });

  document.getElementById("registerBtn").addEventListener("click", () => {
    window.location.href = "register.html";
  });

  document.getElementById("partnerBtn").addEventListener("click", () => {
    window.location.href = "provider-login.html";
  });
});
