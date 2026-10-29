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

// Rental approval belongs to the equipment provider. Admin only reviews disputes/settlement holds.
const transitions = {};


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
  },

  disputes: {
    title: "Disputes & Holds",
    subtitle: "Review reported issues and settlement holds — demo only"
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

  if (sectionName === "disputes") {
    renderDisputes();
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

      const transition = transitions[rental.status] || null;
      const canApprove = false;


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
            <span><b>Student:</b> ${rental.studentName || rental.studentId || rental.studentEmail || "Student account"}</span>
            <span><b>Pickup / use location:</b> ${rental.pickup || rental.pickupLocation || "Location not specified"}</span>

            <span>
              <b>Current:</b>
              ${rental.status || "Pending"}
            </span>

          </div>


          <p class="admin-status-note">${rental.status === "Pending" ? "Awaiting provider review. Admin does not approve normal rental requests." : rental.status === "Approved" ? "Approved by provider — provider manages pickup and return tracking." : "Rental lifecycle is managed by the provider."}</p>

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
                ${partner.campusName || "Unnamed Institution"}
              </div>

              <div class="partnership-campus">
                ${partner.providerName || "Provider not specified"}
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
                ${partner.officialEmail || "—"}
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


  let decisionNote = "";
  if (status === "Rejected") {
    decisionNote = prompt(
      "Reason / next steps for the applicant (shown in their status tracker):",
      "Please contact CampusShare administration for clarification."
    );
    if (decisionNote === null) return;
    decisionNote = decisionNote.trim();
    if (!decisionNote) {
      alert("Please enter a short decision note so the applicant knows what to do next.");
      return;
    }
  }

  partner.status = status;
  partner.statusNote = decisionNote;
  partner.statusUpdatedAt = new Date().toISOString();
  partner.statusUpdatedBy = "CampusShare Admin";

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


  const decisionNote = prompt(
    "Optional approval note for the applicant:",
    "Your partnership request has been approved. You may activate your provider account."
  );
  if (decisionNote === null) return;

  partner.status = "Approved";
  partner.statusNote = decisionNote.trim();
  partner.statusUpdatedAt = new Date().toISOString();
  partner.statusUpdatedBy = "CampusShare Admin";

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
   VERIFICATION DOCUMENT DISPLAY
========================= */
function escapeDocumentText(value) {
  return String(value || "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#39;"}[char]));
}
function renderVerificationDocument(file, label) {
  if (!file || !file.dataUrl) return `<p><strong>${label}:</strong> Not provided</p>`;
  const safeName = escapeDocumentText(file.name || label);
  const safeType = String(file.type || "");
  const safeDataUrl = String(file.dataUrl || "");
  if (!safeDataUrl.startsWith("data:") || !(safeType.startsWith("image/") || safeType === "application/pdf")) {
    return `<p><strong>${label}:</strong> File record unavailable or invalid.</p>`;
  }
  const size = Number(file.size || 0);
  if (safeType.startsWith("image/")) {
    return `<div class="admin-document"><strong>${label}</strong><p>${safeName} · ${(size / 1024).toFixed(0)} KB</p><img src="${safeDataUrl}" alt="${escapeDocumentText(label)} preview" loading="lazy"></div>`;
  }
  return `<div class="admin-document"><strong>${label}</strong><p>${safeName} · ${(size / 1024).toFixed(0)} KB</p><a href="${safeDataUrl}" target="_blank" rel="noopener noreferrer">Open PDF (prototype)</a></div>`;
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
        ${partner.campusName || partner.institutionName || partner.institution || "Unnamed Institution"}
      </h2>

      <div class="modal-subtitle">
        ${partner.providerName || partner.organizationName || "Provider not specified"}
        ${partner.campusAddress ? ` · ${partner.campusAddress}` : ""}
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
          ${partner.officialEmail || partner.email || "—"}
        </strong>

      </div>


      <div class="modal-info">

        <small>
          Contact Number
        </small>

        <strong>
          ${partner.contactNumber || partner.phone || "—"}
        </strong>

      </div>


      <div class="modal-info">

        <small>
          Equipment Category
        </small>

        <strong>
          ${partner.equipmentCategory || partner.institutionType || "—"}
        </strong>

      </div>


      <div class="modal-info">

        <small>
          Estimated Equipment
        </small>

        <strong>
          ${partner.equipmentCount != null ? `${partner.equipmentCount} item(s)` : (partner.equipment || "—")}
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
          ${partner.campusAddress || partner.address || "—"}
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
      <strong>Verification Documents</strong>
      <br><br>
      ${renderVerificationDocument(partner.verificationDocuments?.representativeId, "Authorized Representative ID")}
      ${renderVerificationDocument(partner.verificationDocuments?.authorizationDocument, "Organization Authorization Document")}
      ${!partner.verificationDocuments ? "No verification documents attached to this application." : ""}
      <p class="document-security-note">Prototype storage only. Do not use real identity documents until secure backend storage and access controls are implemented.</p>
    </div>

    <div class="modal-description">

      <strong>
        Partnership Description
      </strong>

      <br><br>

      ${partner.description || "No description provided."}

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
        partner.status === "Pending"
          ? `
            <button
              class="modal-action verify"
              data-modal-verify="${partner.id}"
            >
              Start Verification
            </button>

            <button
              class="modal-action remove"
              data-modal-remove="${partner.id}"
            >
            Remove Record
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
        partner.status === "Pending" ||
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
              ${partner.campusName || partner.institutionName || partner.institution || "Unnamed Institution"}
            </strong>

            <p>
              ${partner.campusAddress || partner.campus || "Campus not specified"}
              ·
              ${partner.officialEmail || partner.email || "No email"}
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
              ${partner.campusName || partner.institutionName || partner.institution || "Unnamed Institution"}
            </strong>

            <p>
              ${partner.campusAddress || partner.campus || "Campus not specified"}
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
          partner.status === "Pending" ||
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
        partner.status === "Pending" ||
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
   DISPUTES & SETTLEMENT HOLDS (DEMO)
========================= */

function renderDisputes() {
  const all = getRentals();
  const cases = all.filter(r => r.disputeStatus && r.disputeStatus !== "None");
  const count = document.getElementById("disputeCount");
  const list = document.getElementById("disputeList");
  if (!count || !list) return;
  count.textContent = `${cases.length} case${cases.length === 1 ? "" : "s"}`;

  if (!cases.length) {
    list.innerHTML = '<div class="empty"><strong>No reported issues.</strong><p>When a student reports an issue from Payments, the case will appear here (same browser only).</p></div>';
    return;
  }

  list.innerHTML = cases.map(r => {
    const pending = r.disputeStatus === "Pending admin review";
    const paymentSucceeded = r.demoPaymentStatus === "SUCCESS";
    const returnConfirmed = ["Completed", "Returned"].includes(r.status) && Boolean(r.returnConfirmedAt);
    const canRelease = paymentSucceeded && returnConfirmed;
    const caseBlockedReason = !paymentSucceeded
      ? "Cannot resolve financially: no successful demo payment is recorded."
      : !returnConfirmed
        ? "Settlement release is blocked until the provider confirms a successful return."
        : "";
    return `<article class="request" style="margin:14px 0;padding:16px;border:1px solid #e7e7e7;border-radius:12px">
      <div class="request-main">
        <div>
          <strong>${r.equipment || "Equipment"} <small>#${r.ref || "—"}</small></strong>
          <p style="margin:8px 0">Student: ${r.studentName || r.studentEmail || "Student"} · Provider: ${r.provider || "Provider"}</p>
          <p style="margin:8px 0">Rental total: ₱${Number(r.total || 0).toLocaleString()} · Commission (10%): ₱${Number(r.commissionAmount ?? Number((Number(r.total || 0)*.1).toFixed(2))).toLocaleString()} · Provider share (90%): ₱${Number(r.providerShare ?? Number((Number(r.total || 0)*.9).toFixed(2))).toLocaleString()}</p>
          <p style="margin:8px 0"><strong>Issue:</strong> ${String(r.disputeReason || "No reason supplied").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}</p>
          <p style="margin:8px 0"><strong>Status:</strong> ${r.disputeStatus} · <strong>Settlement:</strong> ${r.settlementStatus || "On hold — admin review"}</p>
        </div>
        ${pending && caseBlockedReason ? `<p style="margin:10px 0;color:#9a5b00;font-size:13px"><strong>Financial action blocked:</strong> ${caseBlockedReason}</p>` : ""}
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          ${pending ? `${canRelease
            ? `<button class="partner-action approve" data-resolve-dispute="${String(r.ref || "").replace(/"/g,"&quot;")}" data-resolution="release">Resolve &amp; release settlement (demo)</button>`
            : `<button class="partner-action approve" disabled title="Requires successful demo payment and confirmed return">Resolve &amp; release settlement (demo)</button>`}
          ${paymentSucceeded
            ? `<button class="partner-action reject" data-resolve-dispute="${String(r.ref || "").replace(/"/g,"&quot;")}" data-resolution="refund">Resolve as refund (demo)</button>`
            : `<button class="partner-action reject" disabled title="Cannot refund a rental with no successful demo payment">Resolve as refund (demo)</button>`}` : `<span class="status">${r.disputeResolution || "Resolved"}</span>`}
        </div>
      </div>
    </article>`;
  }).join("");

  list.querySelectorAll("[data-resolve-dispute]").forEach(button => {
    button.addEventListener("click", () => {
      const rentals = getRentals();
      const rental = rentals.find(item => String(item.ref || "") === String(button.dataset.resolveDispute));
      if (!rental || rental.disputeStatus !== "Pending admin review") return;
      const resolution = button.dataset.resolution;
      const paymentSucceeded = rental.demoPaymentStatus === "SUCCESS";
      const returnConfirmed = ["Completed", "Returned"].includes(rental.status) && Boolean(rental.returnConfirmedAt);
      if (!paymentSucceeded) {
        window.alert("Blocked: this rental has no successful demo payment. No refund or settlement release can be recorded.");
        return;
      }
      if (resolution === "release" && !returnConfirmed) {
        window.alert("Blocked: provider must confirm successful return before settlement can become eligible.");
        return;
      }
      const note = window.prompt("Admin decision note (required for demo audit trail):");
      if (!note || !note.trim()) return;
      rental.disputeStatus = "Resolved";
      rental.disputeResolution = resolution === "refund" ? "Refund decision recorded — no real refund issued" : "Issue reviewed — settlement may proceed";
      rental.disputeDecisionNote = note.trim().slice(0, 1000);
      rental.disputeReviewedAt = new Date().toISOString();
      rental.disputeReviewedBy = "Campus Admin (demo)";
      rental.disputeAuditHistory = Array.isArray(rental.disputeAuditHistory) ? rental.disputeAuditHistory : [];
      rental.disputeAuditHistory.push({
        status: "Resolved",
        resolution: rental.disputeResolution,
        note: rental.disputeDecisionNote,
        reviewedAt: rental.disputeReviewedAt,
        reviewedBy: rental.disputeReviewedBy
      });
      if (resolution === "refund") {
        rental.settlementStatus = "Closed after refund decision — demo only";
        rental.payoutStatus = "Not eligible — refund decision (demo only)";
        rental.refundStatus = "Decision recorded — no real refund issued";
      } else if (returnConfirmed) {
        rental.settlementStatus = "Eligible after admin review — demo only";
        rental.payoutStatus = "Eligible — not paid (demo only)";
      } else {
        rental.settlementStatus = "Pending successful return";
        rental.payoutStatus = "Pending return — demo only";
      }
      localStorage.setItem("campusShareRentals", JSON.stringify(rentals));
      renderDisputes();
      window.alert("Admin decision saved to this browser's demo records. No real refund or payout occurred.");
    });
  });
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
renderDisputes();
updateDashboardStats();