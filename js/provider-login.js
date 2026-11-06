const PROVIDER_SESSION_KEY = "campusShareProviderSession";
const loginView = document.getElementById("loginView");
const activationView = document.getElementById("activationView");
const loginForm = document.getElementById("loginForm");
const activationForm = document.getElementById("activationForm");
const activateBtn = document.getElementById("activateBtn");
const backToLogin = document.getElementById("backToLogin");
const loginMessage = document.getElementById("loginMessage");
const activationMessage = document.getElementById("activationMessage");
const applicationGateNotice = document.getElementById("applicationGateNotice");
let trackedApplicationId = "";

function showMessage(element, message, type) {
  element.textContent = message;
  element.className = `message show ${type}`;
}
function clearMessage(element) {
  element.textContent = "";
  element.className = "message";
}
function setApplicationGate(locked, message = "") {
  loginForm.classList.toggle("gated", locked);
  [...loginForm.elements].forEach(element => { element.disabled = locked; });
  activateBtn.disabled = locked;
  activateBtn.classList.toggle("gated", locked);
  if (applicationGateNotice) {
    applicationGateNotice.hidden = !message;
    applicationGateNotice.textContent = message;
  }
}

activateBtn.disabled = false;
activateBtn.addEventListener("click", () => {
  clearMessage(loginMessage);
  loginView.classList.add("hidden");
  activationView.classList.remove("hidden");
});
backToLogin.addEventListener("click", () => {
  clearMessage(activationMessage);
  activationView.classList.add("hidden");
  loginView.classList.remove("hidden");
});

activationForm.addEventListener("submit", async event => {
  event.preventDefault();
  clearMessage(activationMessage);
  const email = document.getElementById("activationEmail").value.trim().toLowerCase();
  const password = document.getElementById("activationPassword").value;
  const confirmPassword = document.getElementById("activationConfirm").value;
  if (password.length < 12) return showMessage(activationMessage, "Password must be at least 12 characters.", "error");
  if (password !== confirmPassword) return showMessage(activationMessage, "Passwords do not match.", "error");
  try {
    const response = await fetch("/api/provider/activate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Could not activate provider account.");
    showMessage(activationMessage, "Provider account activated. You can now log in.", "success");
    activationForm.reset();
    setTimeout(() => {
      document.getElementById("loginEmail").value = email;
      activationView.classList.add("hidden");
      loginView.classList.remove("hidden");
      clearMessage(activationMessage);
    }, 700);
  } catch (error) {
    showMessage(activationMessage, error.message, "error");
  }
});

loginForm.addEventListener("submit", async event => {
  event.preventDefault();
  clearMessage(loginMessage);
  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;
  try {
    const response = await fetch("/api/provider/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Unable to sign in.");
    const session = { partnershipId: result.provider.id, providerName: result.provider.providerName,
      campusName: result.provider.campusName, officialEmail: result.provider.officialEmail,
      loggedInAt: new Date().toISOString() };
    localStorage.setItem(PROVIDER_SESSION_KEY, JSON.stringify(session));
    showMessage(loginMessage, "Login successful. Opening your provider portal...", "success");
    setTimeout(() => { window.location.href = "provider-dashboard.html"; }, 500);
  } catch (error) {
    showMessage(loginMessage, error.message, "error");
  }
});

(function initPartnershipTracker() {
  const openButton = document.getElementById("openTrackingBtn");
  const closeButton = document.getElementById("closeTrackingBtn");
  const panel = document.getElementById("trackingPanel");
  const form = document.getElementById("trackingForm");
  const result = document.getElementById("trackingResult");
  if (!openButton || !closeButton || !panel || !form || !result) return;
  const params = new URLSearchParams(window.location.search);
  const requestedReference = (params.get("track") || "").trim().toUpperCase();
  if (requestedReference) {
    trackedApplicationId = requestedReference;
    setApplicationGate(true, "Provider access is locked until CampusShare administration approves the application.");
    panel.hidden = false;
    document.getElementById("trackingReference").value = requestedReference;
  }
  openButton.addEventListener("click", () => { panel.hidden = false; result.replaceChildren(); document.getElementById("trackingReference").focus(); });
  closeButton.addEventListener("click", () => { panel.hidden = true; });
  panel.addEventListener("click", event => { if (event.target === panel) panel.hidden = true; });
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const reference = document.getElementById("trackingReference").value.trim().toUpperCase();
    const email = document.getElementById("trackingEmail").value.trim().toLowerCase();
    result.textContent = "Checking application status…";
    try {
      const query = new URLSearchParams({ reference, email });
      const response = await fetch(`/api/partnerships/track?${query}`, { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Application not found.");
      const application = data.application;
      const status = application.status || "Pending Review";
      trackedApplicationId = reference;
      setApplicationGate(status !== "Approved", status === "Approved"
        ? "This partnership is approved. Provider Login and Activate Account are available."
        : "This application is not approved yet. Provider Login and Activate Account remain locked.");
      const card = document.createElement("div"); card.className = "tracking-status-card";
      const pill = document.createElement("span"); pill.className = `status-pill ${status === "Approved" ? "status-approved" : status === "Rejected" ? "status-rejected" : ""}`; pill.textContent = status;
      const title = document.createElement("strong"); title.textContent = application.campusName || application.providerName || "Partnership application";
      const ref = document.createElement("p"); ref.textContent = `Reference: ${application.reference || reference}`;
      const note = document.createElement("p"); note.textContent = application.statusNote || (status === "Approved" ? "Your partnership has been approved." : status === "Rejected" ? "Your application was not approved." : "Your application is waiting for administrative review.");
      card.append(pill, title, ref, note);
      result.replaceChildren(card);
    } catch (error) {
      const card = document.createElement("div"); card.className = "tracking-status-card";
      const message = document.createElement("p"); message.textContent = error.message;
      card.append(message); result.replaceChildren(card);
    }
  });
})();
