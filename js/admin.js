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

  fetch('/api/admin/partnerships/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ applications: partnerships })
  }).then(async response => {
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.error || 'Could not sync partnership records to the server.');
    }
  }).catch(error => console.warn('Partnership data remains saved in this browser; server sync failed.', error));

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

  equipment: {
    title: "Equipment Portal",
    subtitle: "Review provider listings and student reports"
  },
  history: {
    title: "Partner History",
    subtitle: "Previous CampusShare partnership records"
  },

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
  if (sectionName === "equipment") {
    renderAdminEquipmentPortal();
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


  const historyCount = document.getElementById("historyCount");
  if (!historyCount) return;
  historyCount.textContent = `${history.length} record${history.length === 1 ? "" : "s"}`;


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


  const equipmentCount = document.getElementById("statEquipmentCount");
  if (equipmentCount) {
    equipmentCount.textContent = readAdminEquipment().length;
  }


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
   ADMIN EQUIPMENT PORTAL — BROWSER PROTOTYPE
========================= */
const ADMIN_EQUIPMENT_KEY = "campusShareProviderEquipment";
const ADMIN_REPORTS_KEY = "campusShareEquipmentReports";
const ADMIN_EQUIPMENT_AUDIT_KEY = "campusShareAdminEquipmentAudit";
let activeEquipmentPortalFilter = "All";

function readAdminEquipment() {
  try { const value = JSON.parse(localStorage.getItem(ADMIN_EQUIPMENT_KEY) || "[]"); return Array.isArray(value) ? value : []; }
  catch { return []; }
}
function writeAdminEquipment(items) { localStorage.setItem(ADMIN_EQUIPMENT_KEY, JSON.stringify(items)); }
function readEquipmentReports() {
  try { const value = JSON.parse(localStorage.getItem(ADMIN_REPORTS_KEY) || "[]"); return Array.isArray(value) ? value : []; }
  catch { return []; }
}
function writeEquipmentReports(items) { localStorage.setItem(ADMIN_REPORTS_KEY, JSON.stringify(items)); }
function readEquipmentAudit() {
  try { const value = JSON.parse(localStorage.getItem(ADMIN_EQUIPMENT_AUDIT_KEY) || "[]"); return Array.isArray(value) ? value : []; }
  catch { return []; }
}
function escapeAdminEquipment(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function equipmentStatus(item) {
  return String(item.listingStatus || item.status || (item.isListed === false ? "Unlisted" : "Available"));
}
function addEquipmentAudit(action, item, note = "") {
  const logs = readEquipmentAudit();
  logs.unshift({ id: `EA-${Date.now()}`, action, equipmentId: String(item?.id || ""), equipment: String(item?.name || "Equipment"), provider: String(item?.providerName || item?.provider || item?.campusName || "Provider"), note, createdAt: new Date().toISOString() });
  localStorage.setItem(ADMIN_EQUIPMENT_AUDIT_KEY, JSON.stringify(logs.slice(0, 100)));
}
function renderAdminEquipmentPortal() {
  const list = document.getElementById("adminEquipmentList");
  const reportsNode = document.getElementById("adminEquipmentReports");
  const count = document.getElementById("equipmentPortalCount");
  const reportCount = document.getElementById("equipmentReportCount");
  const auditNode = document.getElementById("adminEquipmentAudit");
  if (!list || !reportsNode || !count || !reportCount || !auditNode) return;

  const items = readAdminEquipment();
  const reports = readEquipmentReports();
  const reportedIds = new Set(reports.filter(r => !["Dismissed", "Action Taken"].includes(String(r.status || "Pending Review"))).map(r => String(r.equipmentId || "")));
  const filtered = items.filter(item => {
    const status = equipmentStatus(item);
    if (activeEquipmentPortalFilter === "All") return true;
    if (activeEquipmentPortalFilter === "Reported") return reportedIds.has(String(item.id));
    if (activeEquipmentPortalFilter === "Available") return status === "Available" && item.isListed !== false;
    return status === activeEquipmentPortalFilter;
  });
  count.textContent = `${filtered.length} listing${filtered.length === 1 ? "" : "s"}`;

  if (!filtered.length) {
    list.innerHTML = '<div class="empty"><strong>No equipment listings in this view.</strong><p>Provider-submitted equipment will appear here when present in this browser.</p></div>';
  } else {
    list.innerHTML = filtered.map(item => {
      const id = escapeAdminEquipment(item.id);
      const status = equipmentStatus(item);
      const related = reports.filter(r => String(r.equipmentId || "") === String(item.id));
      const pendingReports = related.filter(r => !["Dismissed", "Action Taken"].includes(String(r.status || "Pending Review"))).length;
      const name = escapeAdminEquipment(item.name || "Untitled equipment");
      const provider = escapeAdminEquipment(item.providerName || item.provider || item.campusName || "Provider not specified");
      const category = escapeAdminEquipment(item.category || "Other");
      const description = escapeAdminEquipment(item.description || "No description provided.");
      const image = String(item.image || "");
      const safeImage = /^data:image\/(png|jpeg|jpg|webp);base64,/i.test(image) || /^https?:\/\//i.test(image) ? image : "";
      return `<article class="cs-admin-equipment-card">
        <div class="cs-admin-equipment-main">
          ${safeImage ? `<img src="${escapeAdminEquipment(safeImage)}" alt="${name}" loading="lazy">` : `<div class="cs-admin-equipment-placeholder">▣</div>`}
          <div class="cs-admin-equipment-copy"><div class="cs-admin-equipment-title"><strong>${name}</strong><span class="cs-admin-status cs-status-${status.toLowerCase().replace(/[^a-z]+/g,"-")}">${escapeAdminEquipment(status)}</span></div>
          <p>${category} · ${provider}</p><p>${description}</p><small>₱${Number(item.pricePerHour ?? item.price ?? 0).toLocaleString()}/hour · ${Number(item.quantity || 0)} unit(s) · ${pendingReports} open report(s)</small></div>
        </div>
        <div class="cs-admin-equipment-actions">
          ${status !== "Removed" && status !== "Unlisted" ? `<button type="button" class="partner-action reject" data-admin-unlist="${id}">Unlist</button>` : ""}
          ${status === "Unlisted" ? `<button type="button" class="partner-action approve" data-admin-relist="${id}">Relist</button>` : ""}
          ${status !== "Removed" ? `<button type="button" class="partner-action reject" data-admin-remove="${id}">Remove from catalog</button>` : "<span class=\"cs-admin-muted\">Removed from catalog</span>"}
          ${status !== "Under Review" && status !== "Removed" ? `<button type="button" class="partner-action" data-admin-review="${id}">Mark under review</button>` : ""}
        </div>
      </article>`;
    }).join("");
  }

  reportCount.textContent = `${reports.length} report${reports.length === 1 ? "" : "s"}`;
  if (!reports.length) {
    reportsNode.innerHTML = '<div class="empty"><strong>No student listing reports.</strong><p>Reports submitted in this browser will appear here.</p></div>';
  } else {
    reportsNode.innerHTML = reports.slice().sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).map(report => {
      const item = items.find(row => String(row.id) === String(report.equipmentId));
      const status = String(report.status || "Pending Review");
      return `<article class="cs-admin-report-card"><div><strong>${escapeAdminEquipment(report.equipment || item?.name || "Equipment listing")}</strong><span class="cs-admin-status">${escapeAdminEquipment(status)}</span><p>Provider: ${escapeAdminEquipment(report.provider || item?.providerName || item?.provider || "Unknown")}</p><p>Reported by: ${escapeAdminEquipment(report.studentName || "Student")} · ${escapeAdminEquipment(report.reason || "No reason supplied")}</p><small>${escapeAdminEquipment(report.createdAt ? formatDateTime(report.createdAt) : "Date not recorded")}</small></div><div class="cs-admin-equipment-actions">${!['Dismissed','Action Taken'].includes(status) ? `<button type="button" class="partner-action" data-report-review="${escapeAdminEquipment(report.id)}">Under review</button><button type="button" class="partner-action approve" data-report-dismiss="${escapeAdminEquipment(report.id)}">Dismiss report</button>` : ""}${item && !["Removed", "Unlisted"].includes(equipmentStatus(item)) ? `<button type="button" class="partner-action reject" data-report-unlist="${escapeAdminEquipment(report.id)}">Unlist item</button>` : ""}</div></article>`;
    }).join("");
  }

  const logs = readEquipmentAudit();
  auditNode.innerHTML = logs.length ? logs.slice(0, 12).map(log => `<article class="cs-admin-audit-row"><strong>${escapeAdminEquipment(log.action)}</strong><span>${escapeAdminEquipment(log.equipment)} · ${escapeAdminEquipment(log.provider)}</span><small>${escapeAdminEquipment(log.createdAt ? formatDateTime(log.createdAt) : "Date not recorded")}${log.note ? ` · ${escapeAdminEquipment(log.note)}` : ""}</small></article>`).join("") : '<div class="empty"><strong>No moderation activity yet.</strong><p>Admin actions will be listed here.</p></div>';

  list.querySelectorAll("[data-admin-unlist]").forEach(button => button.addEventListener("click", () => adminSetEquipmentStatus(button.dataset.adminUnlist, "Unlisted")));
  list.querySelectorAll("[data-admin-relist]").forEach(button => button.addEventListener("click", () => adminSetEquipmentStatus(button.dataset.adminRelist, "Available")));
  list.querySelectorAll("[data-admin-review]").forEach(button => button.addEventListener("click", () => adminSetEquipmentStatus(button.dataset.adminReview, "Under Review")));
  list.querySelectorAll("[data-admin-remove]").forEach(button => button.addEventListener("click", () => adminSetEquipmentStatus(button.dataset.adminRemove, "Removed")));
  reportsNode.querySelectorAll("[data-report-review]").forEach(button => button.addEventListener("click", () => updateEquipmentReport(button.dataset.reportReview, "Under Review")));
  reportsNode.querySelectorAll("[data-report-dismiss]").forEach(button => button.addEventListener("click", () => updateEquipmentReport(button.dataset.reportDismiss, "Dismissed")));
  reportsNode.querySelectorAll("[data-report-unlist]").forEach(button => button.addEventListener("click", () => {
    const report = readEquipmentReports().find(r => String(r.id) === String(button.dataset.reportUnlist));
    if (!report) return;
    adminSetEquipmentStatus(report.equipmentId, "Unlisted");
    updateEquipmentReport(report.id, "Action Taken");
  }));
}
function adminSetEquipmentStatus(equipmentId, nextStatus) {
  const items = readAdminEquipment();
  const item = items.find(row => String(row.id) === String(equipmentId));
  if (!item) { alert("Equipment listing not found in this browser."); return; }
  const actionLabel = nextStatus === "Removed" ? "remove from the public catalog" : nextStatus === "Unlisted" ? "unlist" : nextStatus === "Under Review" ? "mark as under review" : "relist";
  if (!confirm(`Are you sure you want to ${actionLabel} "${item.name || "this item"}"?\n\nExisting rental history and reviews will be preserved.`)) return;
  item.moderationPreviousStatus = item.moderationPreviousStatus || item.status || "Available";
  item.listingStatus = nextStatus;
  item.isListed = nextStatus === "Available";
  item.status = nextStatus;
  if (nextStatus === "Available") item.moderationPreviousStatus = "Available";
  writeAdminEquipment(items);
  addEquipmentAudit(`equipment.${nextStatus.toLowerCase().replace(/\s+/g,"_")}`, item);
  renderAdminEquipmentPortal();
  updateDashboardStats();
  alert(`Equipment listing status updated: ${nextStatus}.`);
}
function updateEquipmentReport(reportId, nextStatus) {
  const reports = readEquipmentReports();
  const report = reports.find(row => String(row.id) === String(reportId));
  if (!report) return;
  report.status = nextStatus;
  report.reviewedAt = new Date().toISOString();
  writeEquipmentReports(reports);
  const item = readAdminEquipment().find(row => String(row.id) === String(report.equipmentId));
  addEquipmentAudit(`report.${nextStatus.toLowerCase().replace(/\s+/g,"_")}`, item || { id: report.equipmentId, name: report.equipment, provider: report.provider }, report.reason || "");
  renderAdminEquipmentPortal();
}
document.querySelectorAll("[data-equipment-filter]").forEach(button => button.addEventListener("click", () => {
  activeEquipmentPortalFilter = button.dataset.equipmentFilter || "All";
  document.querySelectorAll("[data-equipment-filter]").forEach(tab => tab.classList.toggle("active", tab === button));
  renderAdminEquipmentPortal();
}));

/* =========================
   INITIAL LOAD
========================= */

async function initializeAdminPortal() {
  try {
    const response = await fetch('/api/admin/partnerships', { cache: 'no-store' });
    if (!response.ok) throw new Error('Could not load shared partnership records.');
    const result = await response.json();
    if (Array.isArray(result.applications)) {
      const local = getPartnerships();
      const remoteIds = new Set(result.applications.map(item => String(item.id)));
      const localOnly = local.filter(item => !remoteIds.has(String(item.id)));
      const merged = [...result.applications, ...localOnly];
      if (localOnly.length) {
        const syncResponse = await fetch('/api/admin/partnerships/sync', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ applications: localOnly })
        });
        if (!syncResponse.ok) throw new Error('Could not migrate locally saved partnership records.');
      }
      localStorage.setItem(PARTNER_KEY, JSON.stringify(merged));
    }
  } catch (error) {
    console.warn('Showing partnership records cached in this browser.', error);
  }
  try {
    const response = await fetch('/api/admin/rentals', { cache: 'no-store' });
    if (!response.ok) throw new Error('Could not load shared rental requests.');
    let result = await response.json();
    const local = getRentals();
    const remoteIds = new Set((result.rentals || []).map(item => String(item.ref)));
    const localOnly = local.filter(item => !remoteIds.has(String(item.ref)) && item.providerId);
    localOnly.forEach(item => { if (!item.studentAccessToken) item.studentAccessToken = crypto.randomUUID() + crypto.randomUUID(); });
    if (localOnly.length) {
      localStorage.setItem(RENTAL_KEY, JSON.stringify(local));
      await fetch('/api/admin/rentals/sync', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rentals: localOnly })
      });
      const refreshed = await fetch('/api/admin/rentals', { cache: 'no-store' });
      if (refreshed.ok) result = await refreshed.json();
    }
    const shared = Array.isArray(result.rentals) ? result.rentals : [];
    const mergedIds = new Set(shared.map(item => String(item.ref)));
    localStorage.setItem(RENTAL_KEY, JSON.stringify([...shared, ...local.filter(item => !mergedIds.has(String(item.ref)))]));
  } catch (error) {
    console.warn('Showing rental requests cached in this browser.', error);
  }
  renderRentals();
  renderPartnerships();
  renderPartners();
  renderHistory();
  renderAdminEquipmentPortal();
  updateDashboardStats();
}

initializeAdminPortal();
setInterval(async () => {
  try {
    const response = await fetch('/api/admin/rentals', { cache: 'no-store' });
    if (!response.ok) return;
    const result = await response.json();
    if (Array.isArray(result.rentals)) {
      const sharedIds = new Set(result.rentals.map(item => String(item.ref)));
      const localOnly = getRentals().filter(item => !sharedIds.has(String(item.ref)));
      localStorage.setItem(RENTAL_KEY, JSON.stringify([...result.rentals, ...localOnly]));
      renderRentals();
      updateDashboardStats();
    }
  } catch (error) {
    console.warn('Shared rental refresh failed.', error);
  }
}, 15000);
