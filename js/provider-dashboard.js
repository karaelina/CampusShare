const PROVIDER_SESSION_KEY = "campusShareProviderSession";
const EQUIPMENT_KEY = "campusShareProviderEquipment";
const RENTALS_KEY = "campusShareRentals";


/* =========================
   SESSION
========================= */

function getSession(){
  return JSON.parse(
    localStorage.getItem(PROVIDER_SESSION_KEY) || "null"
  );
}

const session = getSession();


if(!session){

  window.location.href = "provider-login.html";

}


/* =========================
   PARTNERSHIP DATA
========================= */

function getPartnership(){
  let partnerships = [];
  try {
    const parsed = JSON.parse(localStorage.getItem("campusSharePartnerships") || "[]");
    partnerships = Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Could not read CampusShare partnership records.", error);
  }

  const sessionId = String(session?.partnershipId || session?.id || "");
  const sessionEmail = String(session?.officialEmail || session?.email || "").trim().toLowerCase();
  return partnerships.find(item => sessionId && String(item.id || "") === sessionId)
    || partnerships.find(item => sessionEmail && String(item.officialEmail || "").trim().toLowerCase() === sessionEmail)
    || partnerships.find(item => item.status === "Approved"
      && String(item.providerName || "").trim().toLowerCase() === String(session?.providerName || "").trim().toLowerCase()
      && String(item.campusName || "").trim().toLowerCase() === String(session?.campusName || "").trim().toLowerCase())
    || null;
}

const partnership = getPartnership();


/* =========================
   EQUIPMENT
========================= */

function getEquipment(){

  return JSON.parse(
    localStorage.getItem(EQUIPMENT_KEY) || "[]"
  );

}

function saveEquipment(data){

  localStorage.setItem(
    EQUIPMENT_KEY,
    JSON.stringify(data)
  );

}


/* =========================
   RENTALS
========================= */

function getRentals(){

  return JSON.parse(
    localStorage.getItem(RENTALS_KEY) || "[]"
  );

}


/* =========================
   BASIC INFO
========================= */

const providerName =
  partnership?.providerName || session?.providerName || "Provider";

const campusName =
  partnership?.campusName || session?.campusName || "Campus";


document.getElementById("providerName").textContent =
  providerName;

document.getElementById("campusName").textContent =
  campusName;

document.getElementById("welcomeName").textContent =
  providerName;


/* =========================
   PROFILE
========================= */

// Read approved partnership details first, then provider session; support earlier form field names.
function firstAvailable(source, keys) {
  for (const key of keys) {
    const value = source && source[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return String(value).trim();
  }
  return "";
}

const profileValues = {
  profileCampus: firstAvailable(partnership, ["campusName", "campus", "institutionName", "institution", "schoolName"]) || firstAvailable(session, ["campusName", "campus", "institutionName", "institution", "schoolName"]) || "—",
  profileProvider: firstAvailable(partnership, ["providerName", "organizationName", "providerOrganization", "organization", "businessName"]) || firstAvailable(session, ["providerName", "organizationName", "providerOrganization", "organization", "businessName"]) || "—",
  profileEmail: firstAvailable(partnership, ["officialEmail", "email", "contactEmail", "providerEmail"]) || firstAvailable(session, ["officialEmail", "email", "contactEmail", "providerEmail"]) || "—",
  profileContact: firstAvailable(partnership, ["contactPerson", "contactName", "representativeName", "authorizedPerson", "fullName", "applicantName"]) || firstAvailable(session, ["contactPerson", "contactName", "representativeName", "authorizedPerson", "fullName", "applicantName"]) || "—",
  profileNumber: firstAvailable(partnership, ["contactNumber", "phoneNumber", "mobileNumber", "contactPhone", "phone"]) || firstAvailable(session, ["contactNumber", "phoneNumber", "mobileNumber", "contactPhone", "phone"]) || "—"
};
Object.entries(profileValues).forEach(([id, value]) => {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
});

const providerTopAvatar = document.getElementById("providerTopAvatar");
if (providerTopAvatar) {
  const avatarSource = String(providerName || campusName || "P").trim();
  providerTopAvatar.textContent = avatarSource.charAt(0).toUpperCase() || "P";
  providerTopAvatar.title = avatarSource;
}

const equipmentImageInput = document.getElementById("equipmentImage");
const equipmentImagePreview = document.getElementById("equipmentImagePreview");
const equipmentPreviewImg = document.getElementById("equipmentPreviewImg");
let selectedEquipmentImage = "";

if (equipmentImageInput) {
  equipmentImageInput.addEventListener("change", () => {
    const file = equipmentImageInput.files && equipmentImageInput.files[0];
    selectedEquipmentImage = "";
    if (!file) {
      equipmentImagePreview?.classList.add("hidden");
      if (equipmentPreviewImg) equipmentPreviewImg.removeAttribute("src");
      return;
    }
    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file.");
      equipmentImageInput.value = "";
      equipmentImagePreview?.classList.add("hidden");
      return;
    }

    // Crop to the same landscape ratio used by Browse Equipment cards,
    // then compress so the image fits the localStorage-based prototype.
    const reader = new FileReader();
    reader.onload = () => {
      const sourceImage = new Image();
      sourceImage.onload = () => {
        const targetWidth = 1200;
        const targetHeight = 720;
        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const context = canvas.getContext("2d");
        if (!context) {
          alert("Could not process this image. Please try another photo.");
          return;
        }
        const scale = Math.max(targetWidth / sourceImage.width, targetHeight / sourceImage.height);
        const cropWidth = targetWidth / scale;
        const cropHeight = targetHeight / scale;
        const sourceX = (sourceImage.width - cropWidth) / 2;
        const sourceY = (sourceImage.height - cropHeight) / 2;
        context.drawImage(sourceImage, sourceX, sourceY, cropWidth, cropHeight, 0, 0, targetWidth, targetHeight);
        selectedEquipmentImage = canvas.toDataURL("image/jpeg", 0.82);
        if (equipmentPreviewImg) equipmentPreviewImg.src = selectedEquipmentImage;
        equipmentImagePreview?.classList.remove("hidden");
      };
      sourceImage.onerror = () => alert("Could not read that image. Please try another file.");
      sourceImage.src = String(reader.result || "");
    };
    reader.onerror = () => alert("Could not read that image. Please try another file.");
    reader.readAsDataURL(file);
  });
}


/* =========================
   NAVIGATION
========================= */

const sections = {
  dashboard: "dashboardSection",
  equipment: "equipmentSection",
  requests: "requestsSection",
  active: "activeSection",
  returns: "returnsSection",
  messages: "messagesSection",
  profile: "profileSection"
};

const titles = {
  dashboard: "Dashboard",
  equipment: "My Equipment",
  requests: "Rental Requests",
  active: "Active Rentals",
  returns: "Returns",
  messages: "Messages",
  profile: "Partnership Profile"
};


function showSection(section){

  Object.values(sections).forEach(id => {

    document
      .getElementById(id)
      .classList.add("hidden");

  });


  document
    .getElementById(sections[section])
    .classList.remove("hidden");


  document.getElementById("pageTitle").textContent =
    titles[section];

  if (section === "messages") renderProviderMessages();

  document.querySelectorAll(".nav-item").forEach(btn => {

    btn.classList.toggle(
      "active",
      btn.dataset.section === section
    );

  });

}


document.querySelectorAll(".nav-item").forEach(btn => {

  btn.addEventListener("click", () => {

    showSection(btn.dataset.section);

  });

});


document.querySelectorAll(".quick-card").forEach(btn => {

  btn.addEventListener("click", () => {

    showSection(btn.dataset.section);

  });

});


/* =========================
   EQUIPMENT MODAL
========================= */

const equipmentModal =
  document.getElementById("equipmentModal");

const addEquipmentBtn =
  document.getElementById("addEquipmentBtn");

const closeEquipmentModal =
  document.getElementById("closeEquipmentModal");

const cancelEquipmentBtn =
  document.getElementById("cancelEquipmentBtn");


function openEquipmentModal(){

  equipmentModal.classList.remove("hidden");

}


function closeEquipment(){

  equipmentModal.classList.add("hidden");

}


addEquipmentBtn.addEventListener(
  "click",
  openEquipmentModal
);

closeEquipmentModal.addEventListener(
  "click",
  closeEquipment
);

cancelEquipmentBtn.addEventListener(
  "click",
  closeEquipment
);


/* =========================
   ADD EQUIPMENT
========================= */

document
  .getElementById("equipmentForm")
  .addEventListener("submit", event => {

    event.preventDefault();

    if (!selectedEquipmentImage) {
      alert("Please upload a photo of the equipment before adding it.");
      return;
    }

    const equipment = {

      id:
        "EQ-" +
        Date.now().toString().slice(-6),

      providerId:
        session.partnershipId,

      providerName:
        providerName,

      campusName:
        campusName,

      pickupLocation:
        document.getElementById("equipmentLocation").value.trim(),

      name:
        document
          .getElementById("equipmentName")
          .value
          .trim(),

      category:
        document
          .getElementById("equipmentCategory")
          .value,

      pricePerHour:
        Number(document.getElementById("equipmentPrice").value),

      // Keep price as a compatibility alias for older equipment records.
      price:
        Number(document.getElementById("equipmentPrice").value),

      quantity:
        Number(
          document
            .getElementById("equipmentQuantity")
            .value
        ),

      description:
        document
          .getElementById("equipmentDetails")
          .value
          .trim(),

      image: selectedEquipmentImage,

      status:
        "Available",

      createdAt:
        new Date().toISOString()

    };


    const equipmentList =
      getEquipment();

    equipmentList.push(equipment);

    saveEquipment(equipmentList);


    event.target.reset();
    selectedEquipmentImage = "";
    equipmentImagePreview?.classList.add("hidden");
    if (equipmentPreviewImg) equipmentPreviewImg.removeAttribute("src");

    closeEquipment();


    render();


    alert(
      "Equipment added successfully!"
    );

  });


/* =========================
   RENDER EQUIPMENT
========================= */

function renderEquipment(){

  const list =
    document.getElementById("equipmentList");


  const equipment =
    getEquipment().filter(
      item =>
        item.providerId === session.partnershipId
    );


  if(!equipment.length){

    list.innerHTML = `
      <div class="empty">

        <strong>No equipment listed yet.</strong>

        Add your first equipment item so students
        can eventually discover it through CampusShare.

      </div>
    `;

    return;

  }


  list.innerHTML =
    equipment.map(item => {

      return `
        <div class="equipment-item">

          ${item.image ? `<img class="provider-equipment-thumb" src="${item.image}" alt="${item.name}" loading="lazy">` : ""}

          <div class="equipment-item-main">

            <div class="item-title">
              ${item.name}
            </div>

            <div class="item-meta">
              ${item.category}
              · ${item.quantity} item(s)
              <br>
              ${item.description}
            </div>

          </div>

          <div>

            <div class="item-price">
              ₱${Number(item.pricePerHour ?? item.price ?? 0).toLocaleString()}/hour
            </div>

            <span class="status available">
              ${item.status}
            </span>

          </div>

        </div>
      `;

    }).join("");

}


/* =========================
   RENTAL REQUESTS
========================= */

function renderRequests(){
  const list = document.getElementById("requestList");
  const matchesProvider = rental => {
    const providerId = String(rental.providerId || "");
    const sessionId = String(session?.partnershipId || "");
    const provider = String(rental.provider || "").trim().toLowerCase();
    const campus = String(rental.campusName || "").trim().toLowerCase();
    return (providerId && sessionId && providerId === sessionId) ||
      (provider && [providerName, campusName].some(name => provider === String(name || "").trim().toLowerCase())) ||
      (campus && campus === String(campusName || "").trim().toLowerCase());
  };
  const requests = getRentals().filter(rental =>
    ["Pending", "Approved"].includes(rental.status) && matchesProvider(rental)
  );

  if (!requests.length) {
    list.innerHTML = `<div class="empty"><strong>No rental requests yet.</strong><br>New student requests for your equipment will appear here.</div>`;
    return;
  }

  list.innerHTML = requests.map(item => {
    const status = item.status || "Pending";
    let action = "";
    const paymentComplete = item.demoPaymentStatus === "SUCCESS";
    if (status === "Pending" && paymentComplete) action = `<button class="primary-btn" data-provider-rental-action="Approved" data-rental-ref="${item.ref}">Approve Request</button>`;
    if (status === "Pending" && !paymentComplete) action = `<button class="primary-btn" disabled title="Student must complete demo checkout first" style="opacity:.55;cursor:not-allowed">Awaiting demo payment</button>`;
    if (status === "Approved") action = `<button class="primary-btn" data-provider-rental-action="Active" data-rental-ref="${item.ref}">Mark Picked Up</button>`;
    return `<div class="rental-item">
      <div class="item-title">${item.equipment || "Equipment"} <small>#${item.ref || "—"}</small></div>
      <div class="item-meta">Student: ${item.studentName || item.studentId || item.studentEmail || "Student account"}<br>Rental: ${item.start || "—"} → ${item.end || "—"}<br>Pickup / use location: ${item.pickup || item.pickupLocation || "Location not specified"}<br>Payment: ${item.payment || "—"} · Estimated total: ₱${Number(item.total || 0).toLocaleString()}<br>Demo payment status: ${item.paymentStatus || "Demo — awaiting payment"}<br>Request submitted: ${item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"}</div>
      <div class="provider-rental-actions"><span class="status ${status.toLowerCase()}">${status}</span>${action}</div>
    </div>`;
  }).join("");

  list.querySelectorAll("[data-provider-rental-action]").forEach(button => {
    button.addEventListener("click", () => {
      const rentals = getRentals();
      const rental = rentals.find(item => item.ref === button.dataset.rentalRef);
      if (!rental || !matchesProvider(rental)) return;
      const nextStatus = button.dataset.providerRentalAction;
      if (nextStatus === "Approved" && rental.status !== "Pending") return;
      if (nextStatus === "Approved" && rental.demoPaymentStatus !== "SUCCESS") {
        window.alert("Student must complete the CampusShare demo checkout before the provider can approve this request.");
        return;
      }
      if (nextStatus === "Active" && rental.status !== "Approved") return;
      rental.status = nextStatus;
      rental.statusUpdatedAt = new Date().toISOString();
      rental.statusUpdatedBy = providerName;

      // Payment/settlement simulation only. No real payment or payout occurs.
      const rentalTotal = Number(rental.total || 0);
      rental.commissionRate = 0.10;
      rental.commissionAmount = Number((rentalTotal * 0.10).toFixed(2));
      rental.providerShare = Number((rentalTotal * 0.90).toFixed(2));
      rental.paymentMode = rental.paymentMode || "SIMULATED";
      rental.paymentProvider = rental.paymentProvider || "Not connected";
      rental.paymentStatus = rental.paymentStatus || "Demo — awaiting payment";

      if (nextStatus === "Completed") {
        rental.returnConfirmedAt = new Date().toISOString();
        if (rental.disputeStatus && rental.disputeStatus !== "None") {
          rental.settlementStatus = "On hold — admin review";
          rental.payoutStatus = "On hold — demo only";
        } else {
          rental.settlementStatus = "Eligible after return — demo only";
          rental.payoutStatus = "Eligible — not paid (demo only)";
        }
      } else if (nextStatus === "Active") {
        rental.settlementStatus = "Pending return";
      }

      localStorage.setItem(RENTALS_KEY, JSON.stringify(rentals));
      render();
    });
  });
}

/* =========================
   ACTIVE RENTALS
========================= */

function renderActive(){

  const list =
    document.getElementById("activeList");


  const active =
    getRentals().filter(
      rental =>
        ((rental.providerId && rental.providerId === session.partnershipId) || rental.provider === providerName || rental.provider === campusName) &&
        rental.status === "Active"
    );


  if(!active.length){

    list.innerHTML = `
      <div class="empty">

        <strong>No active rentals.</strong>

        Currently rented equipment will appear here.

      </div>
    `;

    return;

  }


  list.innerHTML =
    active.map(item => {

      return `
        <div class="rental-item">

          <div>

            <div class="item-title">
              ${item.equipment}
            </div>

            <div class="item-meta">
              ${item.start}
              →
              ${item.end}
              <br>
              <br>Student: ${item.studentName || item.studentId || item.studentEmail || "Student account"}
              <br>Pickup / use location: ${item.pickup || item.pickupLocation || "Location not specified"}
              <br>Reference: ${item.ref}
            </div>

          </div>

          <div class="provider-rental-actions">
            <span class="status active">Active</span>
            <button type="button" class="primary-btn" data-confirm-return="${String(item.ref || "").replace(/"/g, "&quot;")}">Confirm Successful Return</button>
          </div>

        </div>
      `;

    }).join("");

  list.querySelectorAll("[data-confirm-return]").forEach(button => {
    button.addEventListener("click", () => {
      const rentals = getRentals();
      const rental = rentals.find(item => String(item.ref || "") === String(button.dataset.confirmReturn));
      if (!rental || rental.status !== "Active") return;
      const confirmed = window.confirm("Confirm that the equipment was successfully returned? This updates demo settlement status only; no payout will occur.");
      if (!confirmed) return;
      rental.status = "Completed";
      rental.statusUpdatedAt = new Date().toISOString();
      rental.statusUpdatedBy = providerName;
      rental.returnConfirmedAt = new Date().toISOString();
      const total = Number(rental.total || 0);
      rental.commissionRate = 0.10;
      rental.commissionAmount = Number((total * 0.10).toFixed(2));
      rental.providerShare = Number((total * 0.90).toFixed(2));
      if (rental.disputeStatus && rental.disputeStatus !== "None") {
        rental.settlementStatus = "On hold — admin review";
        rental.payoutStatus = "On hold — demo only";
      } else {
        rental.settlementStatus = "Eligible after return — demo only";
        rental.payoutStatus = "Eligible — not paid (demo only)";
      }
      localStorage.setItem(RENTALS_KEY, JSON.stringify(rentals));
      render();
    });
  });

}


/* =========================
   RETURNS
========================= */

function renderReturns(){

  const list =
    document.getElementById("returnList");


  const completed =
    getRentals().filter(
      rental =>
        ((rental.providerId && rental.providerId === session.partnershipId) || rental.provider === providerName || rental.provider === campusName) &&
        rental.status === "Completed"
    );


  if(!completed.length){

    list.innerHTML = `
      <div class="empty">

        <strong>No completed returns yet.</strong>

        Returned equipment will appear here.

      </div>
    `;

    return;

  }


  list.innerHTML =
    completed.map(item => {

      return `
        <div class="rental-item">

          <div>

            <div class="item-title">
              ${item.equipment}
            </div>

            <div class="item-meta">
              ${item.start}
              →
              ${item.end}
              <br>
              <br>Student: ${item.studentName || item.studentId || item.studentEmail || "Student account"}
              <br>Pickup / use location: ${item.pickup || item.pickupLocation || "Location not specified"}
              <br>Reference: ${item.ref}
            </div>

          </div>

          <div class="provider-rental-actions" style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
            <span class="status completed">Completed</span>
            <small>Rental total: ₱${Number(item.total || 0).toLocaleString()}</small>
            <small>CampusShare commission (10%): ₱${Number(item.commissionAmount ?? (Number(item.total || 0) * .10)).toLocaleString()}</small>
            <small>Provider share (90%): ₱${Number(item.providerShare ?? (Number(item.total || 0) * .90)).toLocaleString()}</small>
            <small><strong>Settlement:</strong> ${item.settlementStatus || "Pending return"}</small>
            <small><strong>Payout:</strong> ${item.payoutStatus || "Not paid — demo only"}</small>
          </div>

        </div>
      `;

    }).join("");

}


/* =========================
   STATS
========================= */

function renderStats(){

  const equipment =
    getEquipment().filter(
      item =>
        item.providerId === session.partnershipId
    );


  const rentals =
    getRentals().filter(
      item =>
        item.provider === providerName
    );


  document.getElementById("equipmentStat")
    .textContent = equipment.length;


  document.getElementById("requestStat")
    .textContent =
      rentals.filter(
        item => item.status === "Pending" || item.status === "Approved"
      ).length;


  document.getElementById("activeStat")
    .textContent =
      rentals.filter(
        item => item.status === "Active"
      ).length;


  document.getElementById("completedStat")
    .textContent =
      rentals.filter(
        item => item.status === "Completed"
      ).length;

}


/* =========================
   RENDER EVERYTHING
========================= */

function render(){

  renderEquipment();
  renderRequests();
  renderActive();
  renderReturns();
  renderStats();

}


render();


/* =========================
   PROVIDER INBOX — LOCAL DEMO
========================= */
const PROVIDER_MESSAGES_KEY = "campusShareMessages";
function readProviderMessages() {
  try { const rows = JSON.parse(localStorage.getItem(PROVIDER_MESSAGES_KEY) || "[]"); return Array.isArray(rows) ? rows : []; }
  catch { return []; }
}
function escapeProviderMessage(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]));
}
let selectedProviderThreadKey = "";

function providerThreadKey(message) {
  return [message.studentId || message.studentEmail || message.studentName,
    message.provider, message.equipment || "General inquiry"].join("::");
}

function renderProviderMessages(preferredKey = selectedProviderThreadKey) {
  const container = document.getElementById("providerMessagesList");
  if (!container) return;

  const all = readProviderMessages();
  const providerLabels = [providerName, campusName, partnership?.providerName, partnership?.campusName]
    .filter(Boolean).map(value => String(value).trim().toLowerCase());
  const messages = all.filter(message =>
    providerLabels.includes(String(message.provider || "").trim().toLowerCase()) ||
    (message.providerId && String(message.providerId) === String(partnership?.id || session?.partnershipId || ""))
  );

  if (!messages.length) {
    selectedProviderThreadKey = "";
    container.innerHTML = `<div class="empty-state"><strong>No student messages yet</strong><p>Messages sent from Browse Equipment will appear here when the provider matches this account.</p></div>`;
    return;
  }

  const threads = new Map();
  messages.forEach(message => {
    const key = providerThreadKey(message);
    if (!threads.has(key)) threads.set(key, []);
    threads.get(key).push(message);
  });

  const threadRows = [...threads.entries()].map(([key, rows]) => {
    rows.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    const latest = rows[rows.length - 1];
    const lastProviderIndex = rows.reduce((last, row, index) => row.senderRole === "provider" ? index : last, -1);
    const unread = rows.slice(lastProviderIndex + 1).some(row => row.senderRole !== "provider");
    return { key, rows, latest, unread };
  }).sort((a, b) => new Date(b.latest.createdAt || 0) - new Date(a.latest.createdAt || 0));

  const selected = threadRows.find(thread => thread.key === preferredKey) || threadRows[0];
  selectedProviderThreadKey = selected.key;

  container.innerHTML = `
    <div class="provider-inbox-layout">
      <aside class="provider-inbox-list" aria-label="Student conversations">
        <div class="provider-inbox-list-head"><strong>Inquiries</strong><span>${threadRows.length}</span></div>
        ${threadRows.map(thread => {
          const latest = thread.latest;
          const preview = `${latest.senderRole === "provider" ? "You: " : ""}${latest.message || ""}`;
          return `<button type="button" class="provider-inbox-item ${thread.key === selected.key ? "is-selected" : ""}" data-provider-thread="${encodeURIComponent(thread.key)}" aria-pressed="${thread.key === selected.key}">
            <span class="provider-inbox-avatar">${escapeProviderMessage(String(latest.studentName || "S").trim().charAt(0).toUpperCase())}</span>
            <span class="provider-inbox-item-main">
              <span class="provider-inbox-item-top"><strong>${escapeProviderMessage(latest.studentName || "Student")}</strong>${thread.unread ? '<i class="provider-inbox-unread" title="New student message"></i>' : ""}</span>
              <span class="provider-inbox-equipment">${escapeProviderMessage(latest.equipment || "General inquiry")} · ${escapeProviderMessage(latest.provider || campusName)}</span>
              <span class="provider-inbox-preview">${escapeProviderMessage(preview)}</span>
            </span>
            <time>${escapeProviderMessage(new Date(latest.createdAt || Date.now()).toLocaleDateString([], {month:"short",day:"numeric"}))}</time>
          </button>`;
        }).join("")}
      </aside>
      <section class="provider-inbox-detail" aria-label="Selected conversation">
        <header class="provider-inbox-detail-head">
          <div><strong>${escapeProviderMessage(selected.latest.studentName || "Student")}</strong><p>${escapeProviderMessage(selected.latest.equipment || "General inquiry")} · ${escapeProviderMessage(selected.latest.provider || campusName)}</p></div>
          <span class="provider-inbox-demo-label">DEMO INBOX</span>
        </header>
        <div class="provider-message-conversation provider-message-conversation-selected">
          ${selected.rows.map(row => `<div class="provider-message-bubble ${row.senderRole === "provider" ? "provider-own-message" : ""}">
            <small>${row.senderRole === "provider" ? "You · Provider" : "Student"} · ${escapeProviderMessage(new Date(row.createdAt || Date.now()).toLocaleString())}</small>
            <p>${escapeProviderMessage(row.message)}</p>
          </div>`).join("")}
        </div>
        <form class="provider-message-reply" data-thread-key="${escapeProviderMessage(selected.key)}">
          <textarea rows="2" name="reply" placeholder="Reply to ${escapeProviderMessage(selected.latest.studentName || "the student")} about ${escapeProviderMessage(selected.latest.equipment || "this inquiry")}..." aria-label="Reply to selected conversation" required></textarea>
          <button type="submit" class="primary-btn">Send Reply</button>
        </form>
      </section>
    </div>`;

  container.querySelectorAll("[data-provider-thread]").forEach(button => {
    button.addEventListener("click", () => {
      selectedProviderThreadKey = decodeURIComponent(button.dataset.providerThread || "");
      renderProviderMessages(selectedProviderThreadKey);
    });
  });

  const form = container.querySelector(".provider-message-reply");
  form?.addEventListener("submit", event => {
    event.preventDefault();
    const text = String(form.elements.reply.value || "").trim();
    if (!text) return;

    const key = form.dataset.threadKey;
    const rows = readProviderMessages();
    const matching = rows.filter(message => providerThreadKey(message) === key &&
      (providerLabels.includes(String(message.provider || "").trim().toLowerCase()) ||
       (message.providerId && String(message.providerId) === String(partnership?.id || session?.partnershipId || ""))));
    const latestStudentMessage = [...matching].reverse().find(message => message.senderRole !== "provider");
    if (!latestStudentMessage) {
      window.alert("This conversation has no student message to reply to yet.");
      return;
    }

    rows.push({
      id: "MSG-" + Date.now(),
      provider: latestStudentMessage.provider,
      providerId: latestStudentMessage.providerId || partnership?.id || "",
      equipment: latestStudentMessage.equipment || "",
      studentName: latestStudentMessage.studentName || "Student",
      studentId: latestStudentMessage.studentId || "",
      studentEmail: latestStudentMessage.studentEmail || "",
      message: text,
      createdAt: new Date().toISOString(),
      senderRole: "provider",
      senderName: providerName,
      status: "Unread"
    });
    localStorage.setItem(PROVIDER_MESSAGES_KEY, JSON.stringify(rows));
    selectedProviderThreadKey = key;
    renderProviderMessages(key);
  });
}

/* =========================
   LOGOUT
========================= */

document
  .getElementById("logoutBtn")
  .addEventListener("click", () => {

    localStorage.removeItem(
      PROVIDER_SESSION_KEY
    );

    window.location.href =
      "provider-login.html";

  });