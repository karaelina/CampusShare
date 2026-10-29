const PARTNERSHIP_KEY = "campusSharePartnerships";
const PROVIDER_SESSION_KEY = "campusShareProviderSession";

function getPartnerships(){
  return JSON.parse(
    localStorage.getItem(PARTNERSHIP_KEY) || "[]"
  );
}

function savePartnerships(partnerships){
  localStorage.setItem(
    PARTNERSHIP_KEY,
    JSON.stringify(partnerships)
  );
}


/* =========================
   ELEMENTS
========================= */

const loginView =
  document.getElementById("loginView");

const activationView =
  document.getElementById("activationView");

const loginForm =
  document.getElementById("loginForm");

const activationForm =
  document.getElementById("activationForm");

const activateBtn =
  document.getElementById("activateBtn");

const backToLogin =
  document.getElementById("backToLogin");

const loginMessage =
  document.getElementById("loginMessage");

const activationMessage =
  document.getElementById("activationMessage");
const applicationGateNotice = document.getElementById("applicationGateNotice");
let trackedApplicationId = "";
let trackedApplicationApproved = false;

// Normal provider access remains available unless the visitor arrived from a specific application tracker link.
activateBtn.disabled = false;
function setApplicationGate(locked, message = "") {
  trackedApplicationApproved = !locked;
  loginForm.classList.toggle("gated", locked);
  [...loginForm.elements].forEach(el => { el.disabled = locked; });
  activateBtn.disabled = locked;
  activateBtn.classList.toggle("gated", locked);
  if (applicationGateNotice) { applicationGateNotice.hidden = !message; applicationGateNotice.textContent = message; }
}


/* =========================
   MESSAGE
========================= */

function showMessage(element, message, type){

  element.textContent = message;

  element.className =
    `message show ${type}`;

}

function clearMessage(element){

  element.textContent = "";

  element.className = "message";

}


/* =========================
   SWITCH VIEWS
========================= */

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


/* =========================
   ACCOUNT ACTIVATION
========================= */

activationForm.addEventListener(
  "submit",
  (event) => {

    event.preventDefault();

    clearMessage(activationMessage);

    const email =
      document
        .getElementById("activationEmail")
        .value
        .trim()
        .toLowerCase();

    const password =
      document
        .getElementById("activationPassword")
        .value;

    const confirmPassword =
      document
        .getElementById("activationConfirm")
        .value;


    if(password.length < 6){

      showMessage(
        activationMessage,
        "Password must be at least 6 characters.",
        "error"
      );

      return;
    }


    if(password !== confirmPassword){

      showMessage(
        activationMessage,
        "Passwords do not match.",
        "error"
      );

      return;
    }


    const partnerships =
      getPartnerships();


    const partner =
      partnerships.find(
        item =>
          String(item.officialEmail || "")
            .trim()
            .toLowerCase() === email
      );


    if(!partner){

      showMessage(
        activationMessage,
        "No CampusShare partnership application was found for this email.",
        "error"
      );

      return;
    }


    if(partner.status !== "Approved"){

      showMessage(
        activationMessage,
        "This partnership has not been approved by CampusShare administration yet.",
        "error"
      );

      return;
    }


    if(
      partner.providerAccountStatus === "Activated"
    ){

      showMessage(
        activationMessage,
        "A provider account has already been activated for this partnership. Please log in instead.",
        "error"
      );

      return;
    }


    /* CREATE PROVIDER ACCOUNT */

    partner.providerAccountStatus =
      "Activated";

    partner.providerPassword =
      password;

    partner.accountActivatedAt =
      new Date().toISOString();


    savePartnerships(partnerships);


    showMessage(
      activationMessage,
      "Provider account activated successfully. You can now log in.",
      "success"
    );


    activationForm.reset();


    setTimeout(() => {

      document.getElementById("loginEmail").value =
        email;

      activationView.classList.add("hidden");
      loginView.classList.remove("hidden");

      clearMessage(activationMessage);

      showMessage(
        loginMessage,
        "Your provider account is ready. Log in using your email and new password.",
        "success"
      );

    }, 900);

  }
);


/* =========================
   PROVIDER LOGIN
========================= */

loginForm.addEventListener(
  "submit",
  (event) => {

    event.preventDefault();

    clearMessage(loginMessage);

    const email =
      document
        .getElementById("loginEmail")
        .value
        .trim()
        .toLowerCase();

    const password =
      document
        .getElementById("loginPassword")
        .value;


    const partnerships =
      getPartnerships();


    const partner =
      partnerships.find(
        item =>
          String(item.officialEmail || "")
            .trim()
            .toLowerCase() === email
      );


    if(!partner){

      showMessage(
        loginMessage,
        "No provider account was found for this email.",
        "error"
      );

      return;
    }


    if(partner.status !== "Approved"){

      showMessage(
        loginMessage,
        "Your partnership is not currently approved for provider access.",
        "error"
      );

      return;
    }


    if(
      partner.providerAccountStatus !== "Activated"
    ){

      showMessage(
        loginMessage,
        "Your provider account has not been activated yet. Use Activate Provider Account first.",
        "error"
      );

      return;
    }


    if(
      partner.providerPassword !== password
    ){

      showMessage(
        loginMessage,
        "Incorrect password. Please try again.",
        "error"
      );

      return;
    }


    /* PROVIDER SESSION */

    const session = {

      partnershipId:
        partner.id,

      campusName:
        partner.campusName,

      providerName:
        partner.providerName,

      officialEmail:
        partner.officialEmail,

      loggedInAt:
        new Date().toISOString()

    };


    localStorage.setItem(
      PROVIDER_SESSION_KEY,
      JSON.stringify(session)
    );


    showMessage(
      loginMessage,
      "Login successful. Opening your provider portal...",
      "success"
    );


    setTimeout(() => {

      /*
        Provider portal will be created
        in the next step.
      */

      window.location.href =
  "provider-dashboard.html";
    }, 700);

  }
);

/* =========================
   PARTNERSHIP STATUS TRACKER
   Demo only: records live in this browser's localStorage.
========================= */
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
    setApplicationGate(true, "Your application is not approved yet. Provider Login and Activate Account are locked for this application until Admin approval. Track your request below to check the latest status.");
    panel.hidden = false;
    document.getElementById("trackingReference").value = requestedReference;
  }

  openButton.addEventListener("click", () => {
    panel.hidden = false;
    result.innerHTML = "";
    document.getElementById("trackingReference").focus();
  });

  closeButton.addEventListener("click", () => {
    panel.hidden = true;
  });

  panel.addEventListener("click", (event) => {
    if (event.target === panel) panel.hidden = true;
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const reference = document.getElementById("trackingReference").value.trim().toUpperCase();
    const email = document.getElementById("trackingEmail").value.trim().toLowerCase();
    let applications = [];

    try {
      applications = JSON.parse(localStorage.getItem(PARTNERSHIP_KEY) || "[]");
      if (!Array.isArray(applications)) applications = [];
    } catch (_) {
      applications = [];
    }

    const application = applications.find((item) =>
      String(item.id || "").toUpperCase() === reference &&
      String(item.officialEmail || "").trim().toLowerCase() === email
    );

    if (!application) {
      result.innerHTML = '<div class="tracking-status-card"><strong>Application not found</strong><p>Please check that your reference number and official email match the details used in your application.</p><p class="tracking-help">If this is a different browser/device from where the prototype request was submitted, the record may not be available here.</p></div>';
      return;
    }

    const status = application.status || "Pending Review";
    if (!trackedApplicationId || trackedApplicationId === reference) {
      trackedApplicationId = reference;
      if (status === "Approved") {
        setApplicationGate(false, "This partnership is approved. Provider Login and Activate Account are now available for this application.");
      } else {
        setApplicationGate(true, status === "Rejected" ? "This application was rejected. Provider Login and Activate Account remain locked. Review the Admin decision note for next steps." : "This application is not approved yet. Provider Login and Activate Account remain locked until Admin approval.");
      }
    }
    const statusClass = status === "Approved" ? "status-approved" : status === "Rejected" ? "status-rejected" : "";
    const statusMessage = status === "Approved"
      ? "Your partnership has been approved. Provider Login and Activate Account are now unlocked for this application."
      : status === "Rejected"
        ? "Your application was not approved. Review the decision note below for the next steps."
        : status === "Verification"
          ? "Your application is under verification by CampusShare administration."
          : "Your application has been received and is waiting for administrative review.";

    const safe = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[char]));

    result.innerHTML = `
      <div class="tracking-status-card">
        <span class="status-pill ${statusClass}">${safe(status)}</span>
        <strong>${safe(application.campusName || application.providerName || "Partnership application")}</strong>
        <p><b>Reference:</b> ${safe(application.id)}</p>
        <p><b>Submitted:</b> ${safe(application.createdAt ? new Date(application.createdAt).toLocaleString() : "Date unavailable")}</p>
        <p>${safe(statusMessage)}</p>
        ${application.statusNote ? `<p><b>Admin decision note:</b> ${safe(application.statusNote)}</p>` : ""}
        ${application.updatedAt ? `<p class="tracking-help">Last updated: ${safe(new Date(application.updatedAt).toLocaleString())}</p>` : ""}
        ${status === "Approved" ? `<div class="gate-actions"><a href="provider-login.html">Continue to Provider Login</a><a class="secondary" href="provider-login.html#activationView" id="approvedActivationLink">Activate Provider Account</a></div>` : `<p class="tracking-help">Provider Login and Activate Account remain locked until Admin approval.</p>`}
      </div>`;
      const activationLink = document.getElementById("approvedActivationLink");
      if (activationLink) activationLink.addEventListener("click", (event) => { event.preventDefault(); panel.hidden = true; loginView.classList.add("hidden"); activationView.classList.remove("hidden"); document.getElementById("activationEmail").value = email; });
  });
})();
