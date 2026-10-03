/* =========================
   CAMPUSSHARE ADMIN
========================= */

const RENTAL_KEY = "campusShareRentals";
const PARTNER_KEY = "campusSharePartnerships";

let currentPartnerFilter = "All";


/* =========================
   RENTAL STORAGE
========================= */

function getRentals() {

  return JSON.parse(
    localStorage.getItem(RENTAL_KEY) || "[]"
  );

}


function saveRentals(rentals) {

  localStorage.setItem(
    RENTAL_KEY,
    JSON.stringify(rentals)
  );

}


function money(value) {

  return "₱" +
    Number(value || 0).toLocaleString();

}


/* =========================
   PARTNERSHIP STORAGE
========================= */

function getPartnerships() {

  return JSON.parse(
    localStorage.getItem(PARTNER_KEY) || "[]"
  );

}

function removePartnership(id) {

  const partnerships = getPartnerships();

  const partner = partnerships.find(
    item => item.id === id
  );

  if (!partner) {
    return;
  }

  const name =
    partner.campusName ||
    partner.providerName ||
    "this partnership record";

  const confirmed = confirm(
    `Remove "${name}"?\n\n` +
    `This will permanently remove this partnership record ` +
    `from the prototype's local storage.`
  );

  if (!confirmed) {
    return;
  }

  const updated =
    partnerships.filter(
      item => item.id !== id
    );

  savePartnerships(updated);

  closeModal();

  renderPartnerships();
  renderPartners();
  renderHistory();
  updateDashboardStats();

}

function savePartnerships(partnerships) {

  localStorage.setItem(
    PARTNER_KEY,
    JSON.stringify(partnerships)
  );

}


/* =========================
   RENTAL TRANSITIONS
========================= */

const transitions = {

  Pending: {
    next: "Approved",
    label: "Approve Rental",
    tone: "approve"
  },

  Approved: {
    next: "Active",
    label: "Mark Picked Up",
    tone: "active"
  },

  Active: {
    next: "Completed",
    label: "Mark Returned",
    tone: "complete"
  },

  Completed: {
    next: "Completed",
    label: "Completed",
    tone: "done"
  }

};


/* =========================
   NAVIGATION
========================= */

const sectionConfig = {

  dashboard: {
    title: "Admin Dashboard",
    subtitle: "CampusShare administration portal"
  },

  rentals: {
    title: "Rental Requests",
    subtitle: "Manage the student rental lifecycle"
  },

  partnerships: {
    title: "Partnership Requests",
    subtitle: "Review and verify CampusShare partner applications"
  },

  partners: {
    title: "Partner Campuses",
    subtitle: "Verified CampusShare partner institutions"
  },

  history: {
    title: "Partner History",
    subtitle: "Previous CampusShare partnership records"
  }

};


function showSection(sectionName) {

  document
    .querySelectorAll(".admin-section")
    .forEach(section => {

      section.classList.remove(
        "active-section"
      );

    });


  const target =
    document.getElementById(
      `${sectionName}Section`
    );


  if (target) {

    target.classList.add(
      "active-section"
    );

  }


  document
    .querySelectorAll(".nav-link")
    .forEach(link => {

      link.classList.toggle(
        "active",
        link.dataset.section === sectionName
      );

    });


  const config =
    sectionConfig[sectionName];


  if (config) {

    document.getElementById(
      "pageTitle"
    ).textContent = config.title;


    document.getElementById(
      "pageSubtitle"
    ).textContent = config.subtitle;

  }


  if (sectionName === "rentals") {
    renderRentals();
  }


  if (sectionName === "partnerships") {
    renderPartnerships();
  }


  if (sectionName === "partners") {
    renderPartners();
  }


  if (sectionName === "history") {
    renderHistory();
  }


  updateDashboardStats();

}


/* Sidebar navigation */

document
  .querySelectorAll(".nav-link")
  .forEach(link => {

    link.addEventListener(
      "click",
      event => {

        event.preventDefault();

        showSection(
          link.dataset.section
        );

      }
    );

  });


/* Quick action buttons */

document
  .querySelectorAll("[data-open-section]")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        showSection(
          button.dataset.openSection
        );

      }
    );

  });


/* =========================
   RENTAL REQUESTS
========================= */

function renderRentals() {

  const rentals =
    getRentals();


  const count =
    document.getElementById("count");


  count.textContent =
    `${rentals.length} request${rentals.length === 1 ? "" : "s"}`;


  const element =
    document.getElementById("requests");


  if (!rentals.length) {

    element.innerHTML = `
      <div class="empty">
        <strong>No rental requests yet.</strong>
        Submit one from Browse Equipment first.
      </div>
    `;

    return;

  }


  element.innerHTML =
    rentals.map((rental, index) => {

      const transition =
        transitions[
          rental.status
        ] || transitions.Pending;


      const disabled =
        rental.status === "Completed";


      return `

        <article class="request">

          <div class="request-main">

            <div>

              <strong>
                ${rental.equipment || "Equipment"}

                <small>
                  #${rental.ref || "—"}
                </small>
              </strong>

              <p>
                ${rental.provider || "Partner campus"}
                ·
                ${rental.payment || "Payment"}
                ·
                ${money(rental.total)}
              </p>

            </div>


            <span
              class="status ${String(
                rental.status || "Pending"
              ).toLowerCase()}"
            >
              ${rental.status || "Pending"}
            </span>

          </div>


          <div class="details">

            <span>
              <b>Rental:</b>
              ${rental.start || "—"}
              →
              ${rental.end || "—"}
            </span>

            <span>
              <b>Current:</b>
              ${rental.status || "Pending"}
            </span>

          </div>


          <button
            class="action ${transition.tone}"
            data-rental-index="${index}"
            ${disabled ? "disabled" : ""}
          >
            ${transition.label}
          </button>

        </article>

      `;

    }).join("");


  document
    .querySelectorAll("[data-rental-index]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const index =
            Number(
              button.dataset.rentalIndex
            );


          const rentals =
            getRentals();


          const current =
            rentals[index]?.status ||
            "Pending";


          const next =
            transitions[current]?.next;


          if (
            !next ||
            next === current
          ) {

            return;

          }


          rentals[index].status =
            next;


          rentals[index].statusUpdatedAt =
            new Date().toISOString();


          saveRentals(
            rentals
          );


          renderRentals();
          updateDashboardStats();

        }
      );

    });

}


/* =========================
   PARTNERSHIP DISPLAY HELPERS
========================= */

function getCampusName(partner) {

  return (
    partner.campusName ||
    partner.campus ||
    partner.institutionName ||
    partner.schoolName ||
    "Unnamed Institution"
  );

}

function getProviderName(partner) {

  return (
    partner.providerName ||
    partner.provider ||
    partner.organizationName ||
    "Provider not specified"
  );

}

function getOfficialEmail(partner) {

  return (
    partner.officialEmail ||
    partner.email ||
    "—"
  );

}

function getContactNumber(partner) {

  return (
    partner.contactNumber ||
    partner.phone ||
    partner.contactNo ||
    "—"
  );

}

function getCampusAddress(partner) {

  return (
    partner.campusAddress ||
    partner.address ||
    "—"
  );

}

function getEquipmentCategory(partner) {

  return (
    partner.equipmentCategory ||
    partner.institutionType ||
    partner.category ||
    "—"
  );

}

function getEquipmentCount(partner) {

  const count =
    partner.equipmentCount ??
    partner.estimatedEquipmentCount ??
    partner.quantity;

  return count !== undefined && count !== null && count !== ""
    ? `${count} item${Number(count) === 1 ? "" : "s"}`
    : "—";

}

function getPartnershipDescription(partner) {

  return (
    partner.partnershipReason ||
    partner.description ||
    partner.equipmentDescription ||
    "No description provided."
  );

}


/* =========================
   PARTNERSHIP STATUS
========================= */

function partnerStatusClass(status) {

  return String(
    status || "Pending"
  )
    .toLowerCase()
    .replace(/\s+/g, "-");

}


/* =========================
   PARTNERSHIP REQUESTS
========================= */

function renderPartnerships() {

  const all = getPartnerships();

  const filtered = currentPartnerFilter === "All"
    ? all
    : all.filter(partner => {

        if (currentPartnerFilter === "Pending") {
          return partner.status === "Pending Review";
        }

        return partner.status === currentPartnerFilter;
      });


  document.getElementById("partnershipCount").textContent =
    `${filtered.length} request${filtered.length === 1 ? "" : "s"}`;


  const element =
    document.getElementById("partnershipRequests");


  if (!filtered.length) {

    element.innerHTML = `

      <div class="empty">

        <strong>
          No partnership requests in this section.
        </strong>

        ${
          all.length
            ? "Try another status filter."
            : "Provider applications will appear here after they are submitted."
        }

      </div>

    `;

    updatePartnershipBadge();

    return;
  }


  element.innerHTML =

    filtered.map(partner => {

      const status =
        partner.status || "Pending Review";


      const displayStatus =
        status === "Pending"
          ? "Pending Review"
          : status;


      return `

        <article class="partnership-card">

          <div class="partnership-head">

            <div>

              <div class="partnership-title">
                ${getCampusName(partner)}
              </div>

              <div class="partnership-campus">
                ${getProviderName(partner)}
              </div>

            </div>


            <span
              class="partner-status ${partnerStatusClass(displayStatus)}"
            >
              ${displayStatus}
            </span>

          </div>


          <div class="partnership-info">

            <div class="info-box">

              <small>
                CONTACT PERSON
              </small>

              <strong>
                ${partner.contactPerson || "—"}
              </strong>

            </div>


            <div class="info-box">

              <small>
                OFFICIAL EMAIL
              </small>

              <strong>
                ${getOfficialEmail(partner)}
              </strong>

            </div>


            <div class="info-box">

              <small>
                SUBMITTED
              </small>

              <strong>
                ${formatDateTime(partner.createdAt)}
              </strong>

            </div>

          </div>


          <div class="partnership-actions">

            <button
              class="partner-action primary"
              data-view-partner="${partner.id}"
            >
              View Application
            </button>

            <button
              class="partner-action remove"
              data-remove-partner="${partner.id}"
            >
              Remove
            </button>

            ${
              status === "Pending Review"
                ? `
                  <button
                    class="partner-action verify"
                    data-verify-partner="${partner.id}"
                  >
                    Start Verification
                  </button>
                `
                : ""
            }


            ${
              status === "Verification"
                ? `
                  <button
                    class="partner-action verify"
                    data-complete-verification="${partner.id}"
                  >
                    Complete Verification
                  </button>
                `
                : ""
            }


            ${
              status === "Verification" &&
              partner.verificationStatus === "Completed"
                ? `
                  <button
                    class="partner-action approve"
                    data-approve-partner="${partner.id}"
                  >
                    Approve Partnership
                  </button>
                `
                : ""
            }


            ${
              status === "Pending Review" ||
              status === "Verification"
                ? `
                  <button
                    class="partner-action reject"
                    data-reject-partner="${partner.id}"
                  >
                    Reject
                  </button>
                `
                : ""
            }

          </div>

        </article>

      `;

    }).join("");


  attachPartnershipActions();

  updatePartnershipBadge();

}


/* =========================
   PARTNERSHIP ACTIONS
========================= */

function attachPartnershipActions() {


  document
    .querySelectorAll("[data-view-partner]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          openPartnerDetails(
            button.dataset.viewPartner
          );

        }
      );

    });

  document
  .querySelectorAll("[data-remove-partner]")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        removePartnership(
          button.dataset.removePartner
        );

      }
    );

  });


  document
    .querySelectorAll("[data-verify-partner]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          updatePartnerStatus(
            button.dataset.verifyPartner,
            "Verification"
          );

        }
      );

    });


  document
    .querySelectorAll(
      "[data-complete-verification]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          completeVerification(
            button.dataset.completeVerification
          );

        }
      );

    });


  document
    .querySelectorAll("[data-approve-partner]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          approvePartner(
            button.dataset.approvePartner
          );

        }
      );

    });


  document
    .querySelectorAll("[data-reject-partner]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          updatePartnerStatus(
            button.dataset.rejectPartner,
            "Rejected"
          );

        }
      );

    });

}


/* =========================
   UPDATE PARTNER STATUS
========================= */

function updatePartnerStatus(
  id,
  status
) {

  const partnerships =
    getPartnerships();


  const partner =
    partnerships.find(
      item =>
        item.id === id
    );


  if (!partner) {
    return;
  }


  partner.status =
    status;


  partner.updatedAt =
    new Date().toISOString();


  savePartnerships(
    partnerships
  );


  renderPartnerships();
  updateDashboardStats();

}


/* =========================
   COMPLETE VERIFICATION
========================= */

function completeVerification(id) {

  const partnerships =
    getPartnerships();


  const partner =
    partnerships.find(
      item =>
        item.id === id
    );


  if (!partner) {
    return;
  }


  partner.status =
    "Verification";


  partner.verificationStatus =
    "Completed";


  partner.verifiedAt =
    new Date().toISOString();


  partner.verifiedBy =
    "CampusShare Admin";


  partner.updatedAt =
    new Date().toISOString();


  savePartnerships(
    partnerships
  );


  openPartnerDetails(
    id
  );

}


/* =========================
   APPROVE PARTNER
========================= */

function approvePartner(id) {

  const partnerships =
    getPartnerships();


  const partner =
    partnerships.find(
      item =>
        item.id === id
    );


  if (!partner) {
    return;
  }


  /*
    Safety rule:
    Partnership must be verified
    before approval.
  */

  if (
    partner.verificationStatus !==
    "Completed"
  ) {

    alert(
      "Complete partner verification before approving this partnership."
    );

    return;

  }


  partner.status =
    "Approved";


  partner.approvedAt =
    new Date().toISOString();


  partner.approvedBy =
    "CampusShare Admin";


  partner.providerAccountStatus =
    "Not Activated";


  partner.updatedAt =
    new Date().toISOString();


  savePartnerships(
    partnerships
  );


  renderPartnerships();
  renderPartners();
  renderHistory();
  updateDashboardStats();

}


/* =========================
   PARTNER DETAILS
========================= */

function openPartnerDetails(id) {

  const partner =
    getPartnerships()
      .find(
        item =>
          item.id === id
      );


  if (!partner) {
    return;
  }


  const verification =
    partner.verificationStatus ||
    "Not Completed";


  document.getElementById(
    "partnerModalContent"
  ).innerHTML = `

    <div class="modal-header">

      <div class="modal-label">
        PARTNERSHIP APPLICATION
      </div>

      <h2 class="modal-title">
        ${getCampusName(partner)}
      </h2>

      <div class="modal-subtitle">
        ${getProviderName(partner)}
      </div>

    </div>


    <div class="modal-grid">

      <div class="modal-info">

        <small>
          Contact Person
        </small>

        <strong>
          ${partner.contactPerson || "—"}
        </strong>

      </div>


      <div class="modal-info">

        <small>
          Official Email
        </small>

        <strong>
          ${getOfficialEmail(partner)}
        </strong>

      </div>


      <div class="modal-info">

        <small>
          Contact Number
        </small>

        <strong>
          ${getContactNumber(partner)}
        </strong>

      </div>


      <div class="modal-info">

        <small>
          Equipment Category
        </small>

        <strong>
          ${getEquipmentCategory(partner)}
        </strong>

      </div>


      <div class="modal-info">

        <small>
          Estimated Equipment
        </small>

        <strong>
          ${getEquipmentCount(partner)}
        </strong>

      </div>


      <div class="modal-info">

        <small>
          Verification
        </small>

        <strong>
          ${verification}
        </strong>

      </div>


      <div class="modal-info">

        <small>
          Address
        </small>

        <strong>
          ${getCampusAddress(partner)}
        </strong>

      </div>


      <div class="modal-info">

        <small>
          Application Status
        </small>

        <strong>
          ${partner.status || "Pending"}
        </strong>

      </div>

    </div>


    <div class="modal-description">

      <strong>
        Partnership Description
      </strong>

      <br><br>

      ${getPartnershipDescription(partner)}

    </div>


    ${
      partner.verifiedAt
        ? `
          <div class="modal-description">

            <strong>
              Verification Record
            </strong>

            <br><br>

            Verified by:
            ${partner.verifiedBy || "CampusShare Admin"}

            <br>

            Date:
            ${formatDateTime(
              partner.verifiedAt
            )}

          </div>
        `
        : ""
    }


    <div class="modal-actions">

      ${
        partner.status === "Pending Review"
          ? `
            <button
              class="modal-action verify"
              data-modal-verify="${partner.id}"
            >
              Start Verification
            </button>
          `
          : ""
      }

      ${
        partner.status === "Verification" &&
        partner.verificationStatus !== "Completed"
          ? `
            <button
              class="modal-action verify"
              data-modal-complete="${partner.id}"
            >
              Complete Verification
            </button>
          `
          : ""
      }

      ${
        partner.status === "Verification" &&
        partner.verificationStatus === "Completed"
          ? `
            <button
              class="modal-action approve"
              data-modal-approve="${partner.id}"
            >
              Approve Partnership
            </button>
          `
          : ""
      }

      ${
        partner.status === "Pending Review" ||
        partner.status === "Verification"
          ? `
            <button
              class="modal-action reject"
              data-modal-reject="${partner.id}"
            >
              Reject
            </button>
          `
          : ""
      }

      <button
        class="modal-action remove"
        data-modal-remove="${partner.id}"
      >
        Remove Record
      </button>

    </div>

  `;


  document
    .getElementById("partnerModal")
    .classList.remove("hidden");


  attachModalActions();

}


/* =========================
   MODAL ACTIONS
========================= */

function attachModalActions() {

  const verify =
    document.querySelector(
      "[data-modal-verify]"
    );


  if (verify) {

    verify.addEventListener(
      "click",
      () => {

        updatePartnerStatus(
          verify.dataset.modalVerify,
          "Verification"
        );

        openPartnerDetails(
          verify.dataset.modalVerify
        );

      }
    );

  }


  const complete =
    document.querySelector(
      "[data-modal-complete]"
    );


  if (complete) {

    complete.addEventListener(
      "click",
      () => {

        completeVerification(
          complete.dataset.modalComplete
        );

      }
    );

  }


  const approve =
    document.querySelector(
      "[data-modal-approve]"
    );


  if (approve) {

    approve.addEventListener(
      "click",
      () => {

        approvePartner(
          approve.dataset.modalApprove
        );

        closeModal();

      }
    );

  }


  const reject =
    document.querySelector(
      "[data-modal-reject]"
    );


  if (reject) {

    reject.addEventListener(
      "click",
      () => {

        updatePartnerStatus(
          reject.dataset.modalReject,
          "Rejected"
        );

        closeModal();

      }
    );

  }

  const remove =
  document.querySelector(
    "[data-modal-remove]"
  );

if (remove) {

  remove.addEventListener(
    "click",
    () => {

      removePartnership(
        remove.dataset.modalRemove
      );

    }
  );

}

}


/* =========================
   PARTNER LIST
========================= */

function renderPartners() {

  const partnerships =
    getPartnerships();


  const partners =
    partnerships.filter(
      partner =>
        partner.status === "Approved"
    );


  document.getElementById(
    "partnerCount"
  ).textContent =
    `${partners.length} partner${partners.length === 1 ? "" : "s"}`;


  const element =
    document.getElementById(
      "partnerList"
    );


  if (!partners.length) {

    element.innerHTML = `

      <div class="empty">

        <strong>
          No active partners yet.
        </strong>

        Approved and verified institutions will appear here.

      </div>

    `;

    return;

  }


  element.innerHTML =
    partners.map(partner => {

      return `

        <article class="partner-card">

          <div>

            <strong>
              ${getCampusName(partner)}
            </strong>

            <p>
              ${getProviderName(partner)}
              ·
              ${partner.officialEmail || "No email"}
            </p>

          </div>


          <div class="partner-meta">

            <small>
              VERIFIED
            </small>

            <strong>
              ${formatDateTime(
                partner.verifiedAt
              )}
            </strong>

          </div>

        </article>

      `;

    }).join("");

}


/* =========================
   PARTNER HISTORY
========================= */

function renderHistory() {

  const partnerships =
    getPartnerships();


  const history =
    partnerships.filter(
      partner =>
        partner.status === "Approved" ||
        partner.status === "Rejected" ||
        partner.status === "Inactive"
    );


  document.getElementById(
    "historyCount"
  ).textContent =
    `${history.length} record${history.length === 1 ? "" : "s"}`;


  const element =
    document.getElementById(
      "historyList"
    );


  if (!history.length) {

    element.innerHTML = `

      <div class="empty">

        <strong>
          No partner history yet.
        </strong>

        Approved or completed partnership records will appear here.

      </div>

    `;

    return;

  }


  element.innerHTML =
    history.map(partner => {

      return `

        <article class="partner-card">

          <div>

            <strong>
              ${getCampusName(partner)}
            </strong>

            <p>
              ${getProviderName(partner)}
              ·
              Status: ${partner.status}
            </p>

          </div>


          <div class="partner-meta">

            <small>
              APPROVED
            </small>

            <strong>
              ${formatDateTime(
                partner.approvedAt ||
                partner.updatedAt
              )}
            </strong>

          </div>

        </article>

      `;

    }).join("");

}


/* =========================
   FILTERS
========================= */

document
  .querySelectorAll("[data-partner-filter]")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        currentPartnerFilter =
          button.dataset.partnerFilter;


        document
          .querySelectorAll(
            "[data-partner-filter]"
          )
          .forEach(filter => {

            filter.classList.remove(
              "active"
            );

          });


        button.classList.add(
          "active"
        );


        renderPartnerships();

      }
    );

  });


/* =========================
   PARTNERSHIP BADGE
========================= */

function updatePartnershipBadge() {

  const pending =
    getPartnerships()
      .filter(
        partner =>
          partner.status === "Pending Review" ||
          partner.status === "Verification"
      )
      .length;


  const badge =
    document.getElementById(
      "partnershipBadge"
    );


  badge.textContent =
    pending;


  badge.classList.toggle(
    "show",
    pending > 0
  );

}


/* =========================
   DASHBOARD STATS
========================= */

function updateDashboardStats() {

  const rentals =
    getRentals();


  const partnerships =
    getPartnerships();


  document.getElementById(
    "statRentals"
  ).textContent =
    rentals.length;


  document.getElementById(
    "statPendingPartners"
  ).textContent =
    partnerships.filter(
      partner =>
        partner.status === "Pending Review" ||
        partner.status === "Verification"
    ).length;


  document.getElementById(
    "statActivePartners"
  ).textContent =
    partnerships.filter(
      partner =>
        partner.status === "Approved"
    ).length;


  document.getElementById(
    "statPartnerHistory"
  ).textContent =
    partnerships.filter(
      partner =>
        partner.status === "Approved" ||
        partner.status === "Rejected" ||
        partner.status === "Inactive"
    ).length;


  updatePartnershipBadge();

}


/* =========================
   MODAL CLOSE
========================= */

function closeModal() {

  document
    .getElementById("partnerModal")
    .classList.add("hidden");

}


document
  .querySelectorAll("[data-close-modal]")
  .forEach(element => {

    element.addEventListener(
      "click",
      closeModal
    );

  });


document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape"
    ) {

      closeModal();

    }

  }
);


/* =========================
   DATE / TIME
========================= */

function formatDateTime(value) {

  if (!value) {
    return "—";
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "—";

  }


  return date.toLocaleDateString(
    "en-PH",
    {
      month: "short",
      day: "numeric",
      year: "numeric"
    }
  );

}


/* =========================
   INITIAL LOAD
========================= */

renderRentals();
renderPartnerships();
renderPartners();
renderHistory();
updateDashboardStats();