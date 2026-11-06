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