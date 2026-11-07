/* =========================
   CAMPUSSHARE EQUIPMENT
========================= */

const demoEquipment = [];

/* =========================
   PROVIDER EQUIPMENT BRIDGE
========================= */

const PROVIDER_EQUIPMENT_KEY = "campusShareProviderEquipment";

function getProviderEquipment() {
  try {
    return JSON.parse(
      localStorage.getItem(PROVIDER_EQUIPMENT_KEY) || "[]"
    );
  } catch {
    return [];
  }
}

let sharedProviderEquipmentCache = null;

function isVerifiedHtuListing(item) {
  const verifiedCampusNames = new Set([
    "HTU CAMPUS",
    "HOLY TRINITY UNIVERSITY",
    "HOLY TRINITY UNIVERSITY (HTU)"
  ]);
  return [item.campusName, item.providerName, item.provider]
    .some(name => verifiedCampusNames.has(String(name || "").trim().toUpperCase()));
}

const CAMPUSSHARE_CATEGORIES = [
  "Laptop", "Tablet", "Camera", "Projector", "Microphone", "Speaker",
  "Extension Cord / Power Strip", "Printer", "PC / Desktop Computer", "Other"
];

function normalizeEquipmentCategory(category) {
  const value = String(category || "").trim().toLowerCase();
  const aliases = {
    "laptops": "Laptop", "laptop": "Laptop",
    "tablets": "Tablet", "tablet": "Tablet",
    "cameras": "Camera", "camera": "Camera", "camera & photography": "Camera",
    "projectors": "Projector", "projector": "Projector", "projectors & presentation": "Projector",
    "microphones": "Microphone", "microphone": "Microphone", "audio equipment": "Microphone",
    "speakers": "Speaker", "speaker": "Speaker", "audio": "Speaker",
    "printers": "Printer", "printer": "Printer",
    "computers & technology": "PC / Desktop Computer", "pc": "PC / Desktop Computer",
    "pc / desktop computer": "PC / Desktop Computer",
    "extension cord / power strip": "Extension Cord / Power Strip",
    "lighting equipment": "Other", "sports equipment": "Other", "event equipment": "Other",
    "tripods & stands": "Other", "lighting": "Other"
  };
  return aliases[value] || (CAMPUSSHARE_CATEGORIES.includes(category) ? category : "Other");
}

function getAllEquipment() {
  const providerEquipment = Array.isArray(sharedProviderEquipmentCache) ? sharedProviderEquipmentCache : [];

  const normalizedProviderEquipment = providerEquipment.filter(item =>
    item.providerApproved === true
      && item.isListed !== false
      && !["Unlisted", "Under Review", "Removed"].includes(String(item.listingStatus || item.status || ""))
  ).map(item => ({
    id: item.id,
    name: item.name || "Provider Equipment",
    category: normalizeEquipmentCategory(item.category || "Other"),
    provider: item.providerName || item.provider || item.campusName || "CampusShare Partner",
    campusName: item.campusName || item.providerName || "CampusShare Partner",
    providerId: item.providerId || "",
    pickupLocation: item.pickupLocation || item.campusName || item.providerName || item.provider || "Contact provider for designated location",
    price: Number(item.price || 0),
    quantity: Number(item.quantity || 0),
    available: item.status === "Available" && item.isListed !== false && item.listingStatus !== "Unlisted" && Number(item.quantity || 0) > 0,
    isListed: item.isListed !== false && item.listingStatus !== "Unlisted",
    icon: getEquipmentIcon(item.category),
    image: item.image || "",
    desc: item.description || "Provider-listed equipment available for student rental.",
    source: "provider"
  }));

  return [
    ...demoEquipment,
    ...normalizedProviderEquipment
  ];
}

async function refreshSharedProviderEquipment() {
  try {
    const response = await fetch("/api/equipment", { cache: "no-store" });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Shared equipment is unavailable.");
    sharedProviderEquipmentCache = Array.isArray(result.items) ? result.items : [];
    render();
  } catch (error) {
    console.warn("Shared equipment could not be loaded from the server.", error);
  }
}

function getEquipmentIcon(category) {
  const icons = {
    Laptop: "💻",
    Camera: "📷",
    Microphone: "🎙️",
    Projector: "📽️",
    Speaker: "🔊",
    Printer: "🖨️",
    Tablet: "📱",
    "Extension Cord / Power Strip": "🔌",
    "PC / Desktop Computer": "🖥️",
    Other: "🧰"
  };

  return icons[category] || "🧰";
}

/* Category-based photo fallback for equipment added by partners.
   Demo photos are remote image URLs; provider listings can use these
   category images until a provider-upload feature is implemented. */
function getEquipmentImage(item) {
  if (item.image) return item.image;

  const categoryImages = {
    Laptop: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=85",
    Camera: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=85",
    Microphone: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1000&q=85",
    Projector: "https://images.unsplash.com/photo-1535016120720-40c646be5580?auto=format&fit=crop&w=1000&q=85",
    Speaker: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1000&q=85",
    Printer: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=1000&q=85",
    Tablet: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=1000&q=85",
    Other: ""
  };

  return categoryImages[item.category] || "";
}

let equipment = getAllEquipment();

let selectedCategory = "All";


const search =
  document.getElementById("equipmentSearch");

const provider =
  document.getElementById("providerFilter");

const grid =
  document.getElementById("equipmentGrid");

const found =
  document.getElementById("itemsFound");

const modal =
  document.getElementById("rentalModal");

const modalContent =
  document.getElementById("modalContent");

const toast =
  document.getElementById("toast");


/* =========================
   RENTAL DATA
========================= */

function getRentals() {

  return JSON.parse(
    localStorage.getItem("campusShareRentals") || "[]"
  );

}


/* =========================
   CHECK REAL AVAILABILITY
========================= */

function isEquipmentAvailable(item) {

  if (!item.available) {
    return false;
  }


  const rentals =
    getRentals();


  const activeRentals =
    rentals.filter(rental =>
      rental.equipmentId === item.id &&
      rental.status === "Active"
    ).length;


  const quantity =
    Number(item.quantity || 1);


  return activeRentals < quantity;
}


/* =========================
   CATEGORIES
========================= */

const categories = [
  "All",
  ...CAMPUSSHARE_CATEGORIES
];


document.getElementById(
  "categoryFilters"
).innerHTML = categories.map(category => {

  return `
    <button
      class="filter ${category === "All" ? "active" : ""}"
      data-category="${category}"
    >
      ${category}
    </button>
  `;

}).join("");


document
  .querySelectorAll(".filter")
  .forEach(button => {

    button.addEventListener("click", () => {

      selectedCategory =
        button.dataset.category;


      document
        .querySelectorAll(".filter")
        .forEach(item =>
          item.classList.remove("active")
        );


      button.classList.add("active");

      syncStudentIdentity();
      render();

    });

  });


/* =========================
   PROVIDER FILTER
========================= */

function updateProviderFilter() {

  const currentValue = provider.value;

  const providers = ["All", ...new Set(getAllEquipment().map(item => item.campusName).filter(Boolean))];

  provider.innerHTML = providers.map(name => `
    <option value="${name.replace(/"/g, "&quot;")}">
      ${name}
    </option>
  `).join("");

  if (providers.includes(currentValue)) {
    provider.value = currentValue;
  } else {
    provider.value = "All";
  }
}


/* =========================
   RENDER EQUIPMENT
========================= */

function render() {

  // Refresh the combined list so newly added provider equipment
  // appears immediately without changing the student page.
  equipment = getAllEquipment();
  updateProviderFilter();

  const query =
    search.value.trim().toLowerCase();

  const selectedProvider =
    provider.value;


  const list =
    equipment.filter(item => {

      if (item.isListed === false || item.listingStatus === "Unlisted" || item.status === "Unlisted") return false;

      const categoryMatch =
        selectedCategory === "All" ||
        item.category === selectedCategory;


      const providerMatch =
        selectedProvider === "All" ||
        item.campusName === selectedProvider;


      const searchMatch =
        !query ||
        `${item.name} ${item.provider} ${item.category}`
          .toLowerCase()
          .includes(query);


      return (
        categoryMatch &&
        providerMatch &&
        searchMatch
      );

    });


  found.textContent =
    `${list.length} item${list.length === 1 ? "" : "s"} found`;


  if (!list.length) {

    grid.innerHTML = `
      <div class="empty">

        <strong>
          No equipment found.
        </strong>

        Try changing your search or filters.

      </div>
    `;

    return;
  }


  grid.innerHTML =
    list.map(item => {

      const available =
        isEquipmentAvailable(item);


      return `
        <article class="equipment-card">

          <div class="equipment-image">

            ${getEquipmentImage(item) ? `
              <img
                src="${getEquipmentImage(item)}"
                alt="${item.name}"
                loading="lazy"
                onerror="this.style.display='none'; this.nextElementSibling.style.display='grid';"
              >
            ` : ""}

            <span class="equipment-fallback" ${getEquipmentImage(item) ? 'style="display:none"' : ""} aria-hidden="true">
              ${item.icon}
            </span>

            <span
              class="equipment-status ${available ? "" : "unavailable"}"
            >
              ${available ? "Available" : "Borrowed"}
            </span>

          </div>


          <div class="equipment-body">

            <div class="equipment-category">
              ${item.category}
            </div>


            <div class="equipment-name">
              ${item.name}
            </div>

            <div class="equipment-provider">
              ${item.provider}
            </div>
            <div class="cs-equipment-rating" data-rating-equipment="${escapeChatText(item.id)}"></div>


            <div class="equipment-description">
              ${item.desc}
            </div>


            <div class="equipment-meta">

              <div class="equipment-price">
                ₱${item.price.toLocaleString()}
                <small>/ hour</small>
              </div>

              ${item.source === "provider" && item.quantity > 0 ? `
                <div class="equipment-quantity">
                  <small>${item.quantity} unit${item.quantity === 1 ? "" : "s"}</small>
                </div>
              ` : ""}

            </div>


            <div class="equipment-actions">

              <button
                class="btn-details"
                onclick="openDetails('${item.id}')"
              >
                View Details
              </button>


              <button
                class="btn-rent"
                ${available ? "" : "disabled"}
                onclick="openRental('${item.id}')"
              >
                ${available ? "Rent Now" : "Currently Borrowed"}
              </button>
              <button class="btn-details message-provider-btn" onclick="openMessenger('${item.id}')" aria-label="Message provider about ${item.name}">Message</button>

            </div>

          </div>

        </article>
      `;

    }).join("");

}


/* =========================
   STUDENT RATINGS — DEMO SUMMARY
========================= */
let sharedEquipmentReviews = [];
let sharedRatingSummaries = {};

async function loadSharedRatingSummaries() {
  try {
    const response = await fetch('/api/reviews/summary', { cache: 'no-store' });
    if (!response.ok) return;
    const data = await response.json();
    sharedRatingSummaries = Object.fromEntries((data.summaries || []).map(row => [String(row.equipmentId), row]));
    renderEquipmentRatingSummaries();
  } catch (error) { console.warn('Shared review summaries could not be loaded.', error); }
}

async function loadSharedReviewsForEquipment(equipmentId) {
  try {
    const response = await fetch(`/api/reviews?equipmentId=${encodeURIComponent(equipmentId)}`, { cache: 'no-store' });
    if (!response.ok) return null;
    const data = await response.json();
    const rows = Array.isArray(data.reviews) ? data.reviews : [];
    sharedEquipmentReviews = [
      ...sharedEquipmentReviews.filter(row => String(row.equipmentId) !== String(equipmentId)),
      ...rows
    ];
    return rows;
  } catch (error) { console.warn('Shared equipment reviews could not be loaded.', error); return null; }
}

function getCampusRatings() {
  try { const rows = JSON.parse(localStorage.getItem(CS_RATINGS_KEY) || "[]"); return Array.isArray(rows) ? rows : []; }
  catch { return []; }
}

// A review belongs to one equipment listing. Prefer the stored equipment ID;
// for older records, resolve through the rental reference before using a strict
// name+provider fallback. This prevents a review from leaking onto unrelated items.
function getRatingsForEquipment(item) {
  const localRatings = getCampusRatings();
  const sharedByRental = new Map(sharedEquipmentReviews.map(row => [String(row.rentalRef || ''), row]));
  const ratings = [...localRatings.filter(row => !sharedByRental.has(String(row.rentalRef || ''))), ...sharedEquipmentReviews];
  let rentals = [];
  try { const parsed = JSON.parse(localStorage.getItem("campusShareRentals") || "[]"); rentals = Array.isArray(parsed) ? parsed : []; } catch {}
  const itemId = String(item?.id ?? "");
  const itemName = String(item?.name ?? "").trim().toLowerCase();
  const provider = String(item?.provider ?? "").trim().toLowerCase();
  return ratings.filter(row => {
    const storedId = String(row.equipmentId ?? row.itemId ?? "").trim();
    const rentalRef = String(row.rentalRef ?? "");
    if (storedId) return storedId === itemId;
    if (rentalRef) {
      const rental = rentals.find(r => String(r.ref ?? "") === rentalRef);
      if (!rental) return false;
      const rentalItemId = String(rental.equipmentId ?? rental.itemId ?? "").trim();
      if (rentalItemId) return rentalItemId === itemId;
      const rentalName = String(rental.equipment ?? "").trim().toLowerCase();
      const rentalProvider = String(rental.provider ?? rental.campusName ?? "").trim().toLowerCase();
      return rentalName === itemName && rentalProvider === provider;
    }
    // Legacy records without IDs can only match by exact equipment and provider labels.
    return String(row.equipment ?? "").trim().toLowerCase() === itemName &&
      String(row.provider ?? "").trim().toLowerCase() === provider;
  });
}

function renderEquipmentRatingSummaries() {
  document.querySelectorAll("[data-rating-equipment]").forEach(node => {
    const item = equipment.find(row => String(row.id) === String(node.dataset.ratingEquipment));
    if (!item) return;
    const shared = sharedRatingSummaries[String(item.id)];
    const rows = getRatingsForEquipment(item);
    if (shared && Number(shared.count) > 0) {
      node.innerHTML = `<span class="cs-rating-stars">★</span> <strong>${Number(shared.average).toFixed(1)}</strong> <span>(${Number(shared.count)} review${Number(shared.count) === 1 ? "" : "s"})</span>`;
      return;
    }
    if (!rows.length) { node.innerHTML = `<span class="cs-rating-empty">☆ New · No ratings yet</span>`; return; }
    const average = rows.reduce((sum,row) => sum + Number(row.rating || 0), 0) / rows.length;
    node.innerHTML = `<span class="cs-rating-stars">★</span> <strong>${average.toFixed(1)}</strong> <span>(${rows.length} review${rows.length === 1 ? "" : "s"})</span>`;
  });
}

/* =========================
   EQUIPMENT DETAILS
========================= */

function openDetails(id) {

  const item =
    equipment.find(
      equipmentItem =>
        equipmentItem.id === id
    );


  if (!item) return;


  const available =
    isEquipmentAvailable(item);
  const itemRatings = getRatingsForEquipment(item);
  const avgRating = itemRatings.length
    ? (itemRatings.reduce((sum, row) => sum + Number(row.rating || 0), 0) / itemRatings.length).toFixed(1)
    : null;
  const safeDetail = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const reviewMarkup = itemRatings.length
    ? itemRatings.slice().sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).map(row => `
        <article class="cs-detail-review">
          <div class="cs-detail-review-top"><strong>${safeDetail(row.studentName || "Student")}</strong><span class="cs-detail-review-stars" aria-label="${Number(row.rating || 0)} out of 5 stars">${"★".repeat(Math.max(0,Math.min(5,Number(row.rating||0))))}${"☆".repeat(5-Math.max(0,Math.min(5,Number(row.rating||0))))}</span></div>
          <p>${safeDetail(row.review || "No written comment provided.")}</p>
          <small>${row.createdAt ? safeDetail(new Date(row.createdAt).toLocaleDateString()) : ""}</small>
        </article>`).join("")
    : '<p class="cs-detail-no-reviews">No student reviews yet. Be the first to share your experience after a completed rental.</p>';

  modalContent.innerHTML = `

    <div class="modal-header">

      <span class="modal-label">
        EQUIPMENT DETAILS
      </span>

      <h2 class="modal-title">
        ${item.name}
      </h2>

      <div class="modal-provider">
        ${item.provider}
      </div>

    </div>


    <div class="modal-item-photo">
      <img src="${getEquipmentImage(item)}" alt="Photo of ${item.name}" loading="lazy">
      <span>Item photo</span>
    </div>

    <div class="modal-grid">

      <div class="modal-info">

        <small>Category</small>

        <strong>
          ${item.category}
        </strong>

      </div>


      <div class="modal-info">

        <small>Availability</small>

        <strong>
          ${available ? "Available" : "Currently Borrowed"}
        </strong>

      </div>


      <div class="modal-info">

        <small>Daily Rate</small>

        <strong>
          ₱${Number(item.pricePerHour ?? item.price ?? 0).toLocaleString()} / hour
        </strong>

      </div>


      <div class="modal-info">

        <small>Provider</small>

        <strong>
          ${item.provider}
        </strong>

      </div>

      ${item.source === "provider" ? `
        <div class="modal-info">

          <small>Available Units</small>

          <strong>
            ${item.quantity || 0}
          </strong>

        </div>
      ` : ""}

    </div>


    <div class="modal-description">
      ${safeDetail(item.desc || "No description provided.")}
    </div>

    <section class="cs-detail-reviews" aria-labelledby="csReviewsHeading">
      <div class="cs-detail-reviews-heading">
        <div><span class="modal-label">STUDENT FEEDBACK</span><h3 id="csReviewsHeading">Ratings &amp; Reviews</h3></div>
      <div class="cs-detail-average" data-detail-rating-summary>${avgRating ? `<strong>★ ${avgRating}</strong><small>${itemRatings.length} review${itemRatings.length === 1 ? "" : "s"}</small>` : '<strong>☆ New</strong><small>No ratings yet</small>'}</div>
      </div>
      <div class="cs-detail-review-list" data-equipment-reviews="${safeDetail(item.id)}">${reviewMarkup}</div>
      <button type="button" class="cs-report-listing-btn" id="csReportListing">⚑ Report this listing</button>
      <p class="cs-report-note">Report concerns such as poor condition, inaccurate photos, or an item that does not work. Reports are saved in this browser prototype for now.</p>
    </section>

    <div class="modal-actions">

      <button
        class="modal-secondary"
        data-close
      >
        Close
      </button>


      <button
        class="modal-primary"
        ${available ? "" : "disabled"}
        onclick="openRental('${item.id}')"
      >
        ${available ? "Rent This Equipment" : "Currently Borrowed"}
      </button>

    </div>

  `;


  modal.classList.remove("hidden");

  loadSharedReviewsForEquipment(item.id).then(rows => {
    const list = modalContent.querySelector('[data-equipment-reviews]');
    if (!rows || !list || String(list.dataset.equipmentReviews) !== String(item.id)) return;
    const currentItem = equipment.find(row => String(row.id) === String(item.id));
    if (!currentItem) return;
    const serverRentalRefs = new Set(rows.map(row => String(row.rentalRef || '')).filter(Boolean));
    const visibleRows = [
      ...rows,
      ...getRatingsForEquipment(currentItem).filter(row => !row.rentalRef || !serverRentalRefs.has(String(row.rentalRef)))
    ];
    const summary = modalContent.querySelector('[data-detail-rating-summary]');
    if (visibleRows.length) {
      const average = visibleRows.reduce((sum, row) => sum + Number(row.rating || 0), 0) / visibleRows.length;
      summary.innerHTML = `<strong>★ ${average.toFixed(1)}</strong><small>${visibleRows.length} review${visibleRows.length === 1 ? '' : 's'}</small>`;
      list.innerHTML = visibleRows.slice().sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).map(row => `
        <article class="cs-detail-review"><div class="cs-detail-review-top"><strong>${safeDetail(row.studentName || 'Student')}</strong><span class="cs-detail-review-stars" aria-label="${Number(row.rating || 0)} out of 5 stars">${'★'.repeat(Math.max(0,Math.min(5,Number(row.rating||0))))}${'☆'.repeat(5-Math.max(0,Math.min(5,Number(row.rating||0))))}</span></div><p>${safeDetail(row.review)}</p><small>${row.createdAt ? safeDetail(new Date(row.createdAt).toLocaleDateString()) : ''}</small></article>`).join('');
    } else {
      summary.innerHTML = '<strong>☆ New</strong><small>No ratings yet</small>';
      list.innerHTML = '<p class="cs-detail-no-reviews">No student reviews yet. Be the first to share your experience after a completed rental.</p>';
    }
    renderEquipmentRatingSummaries();
  });

  modalContent.querySelector("#csReportListing")?.addEventListener("click", () => {
    const student = typeof getCurrentStudent === "function" ? getCurrentStudent() : null;
    if (!student) { showToast("Please sign in before reporting a listing."); return; }
    const reason = window.prompt("Why are you reporting this equipment? (poor quality, inaccurate listing, not working, or other)");
    if (!reason || !reason.trim()) return;
    let reports = [];
    try { reports = JSON.parse(localStorage.getItem("campusShareEquipmentReports") || "[]"); if (!Array.isArray(reports)) reports = []; } catch {}
    reports.push({
      id: "REPORT-" + Date.now(), equipmentId: String(item.id), equipment: String(item.name),
      provider: String(item.provider), studentId: String(student.studentId || student.id || ""),
      studentName: String(student.name || [student.firstName, student.lastName].filter(Boolean).join(" ") || "Student"),
      reason: reason.trim().slice(0, 1000), status: "Pending Review", createdAt: new Date().toISOString()
    });
    localStorage.setItem("campusShareEquipmentReports", JSON.stringify(reports));
    showToast("Report saved in this browser prototype.");
  });

  modalContent
    .querySelector("[data-close]")
    .addEventListener(
      "click",
      closeModal
    );

}


/* =========================
   RENTAL FORM
========================= */

function openRental(id) {

  const item =
    equipment.find(
      equipmentItem =>
        equipmentItem.id === id
    );


  if (!item) return;


  if (!isEquipmentAvailable(item)) {

    showToast(
      "This equipment is currently unavailable."
    );

    return;
  }


  const today =
    new Date();


  const tomorrow =
    new Date(today);


  tomorrow.setDate(
    today.getDate() + 1
  );


  const min =
    tomorrow
      .toISOString()
      .split("T")[0];


  modalContent.innerHTML = `

    <div class="modal-header">

      <span class="modal-label">
        RENTAL REQUEST
      </span>

      <h2 class="modal-title">
        ${item.name}
      </h2>

      <div class="modal-provider">
        ${item.provider}
        ·
        ₱${Number(item.pricePerHour ?? item.price ?? 0).toLocaleString()}/hour
      </div>

    </div>


    <form
      id="rentalForm"
      class="rental-form"
    >

      <input
        type="hidden"
        id="equipmentId"
        value="${item.id}"
      >


      <div class="form-group">

        <label>
          Rental Start
        </label>

        <input
          id="startDate"
          type="datetime-local"
          min="${new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,16)}"
          required
        >

      </div>


      <div class="form-group">

        <label>
          Rental End
        </label>

        <input
          id="endDate"
          type="datetime-local"
          min="${new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,16)}"
          required
        >

      </div>


      <div class="form-group">
        <label for="pickup">Provider-designated pickup / use location</label>
        <input id="pickup" type="text" value="${item.pickupLocation || (item.provider + ' — Equipment Office')}" readonly required>
        <small>The provider sets this location when listing the equipment. Students cannot change it.</small>
      </div>


      <div class="form-group">

        <label>
          Payment Method
        </label>
        <small style="display:block;color:#777;margin:0 0 8px;">Prototype only — you'll see a simulated checkout. No real payment is made.</small>

        <select
          id="payment"
          required
        >

          <option value="">
            Select payment method
          </option>

          <option value="GCash">GCash (Demo)</option>

          <option value="Maya">Maya (Demo)</option>

          <option value="Cash on Pickup">Cash on Pickup (Demo)</option>

        </select>

      </div>


      <div class="rental-summary">

        <div class="rental-summary-row">

          <span>
            Hourly rate
          </span>

          <strong>
            ₱${Number(item.pricePerHour ?? item.price ?? 0).toLocaleString()} / hour
          </strong>

        </div>


        <div class="rental-summary-row">

          <span>
            Rental duration
          </span>

          <strong id="days">
            —
          </strong>

        </div>


        <div class="rental-summary-row">

          <span>
            Estimated total
          </span>

          <strong id="total">
            ₱0
          </strong>

        </div>

      </div>


      <div class="modal-actions">

        <button
          type="button"
          class="modal-secondary"
          data-close
        >
          Cancel
        </button>

        <button
          type="submit"
          class="modal-primary"
        >
          Submit Rental Request
        </button>

      </div>

    </form>

  `;


  modal.classList.remove("hidden");


  const start =
    document.getElementById("startDate");

  const end =
    document.getElementById("endDate");


  function updateTotal() {

    if (
      !start.value ||
      !end.value
    ) {

      document.getElementById("days")
        .textContent = "—";

      document.getElementById("total")
        .textContent = "₱0";

      return;
    }


    const startDate = new Date(start.value);
    const endDate = new Date(end.value);
    const durationMs = endDate.getTime() - startDate.getTime();
    const hours = Math.ceil(durationMs / 3600000);
    const rate = Math.max(0, Number(item.pricePerHour ?? item.price ?? 0));

    if (Number.isFinite(durationMs) && durationMs > 0 && hours > 0) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      const duration = [days ? `${days} day${days !== 1 ? "s" : ""}` : "", remainingHours ? `${remainingHours} hour${remainingHours !== 1 ? "s" : ""}` : ""]
        .filter(Boolean).join(", ") || `${hours} hours`;
      document.getElementById("days").textContent = `${duration} · ${hours} billable hour${hours !== 1 ? "s" : ""}`;
      document.getElementById("total").textContent = "₱" + (hours * rate).toLocaleString();
    } else {

      document.getElementById("days")
        .textContent =
        "Invalid";


      document.getElementById("total")
        .textContent =
        "₱0";

    }

  }


  // Recalculate immediately while the user edits either date/time field.
  const refreshRentalEstimate = () => {
    if (start.value) end.min = start.value;
    updateTotal();
  };
  ["input", "change"].forEach(eventName => {
    start.addEventListener(eventName, refreshRentalEstimate);
    end.addEventListener(eventName, refreshRentalEstimate);
  });


  document
    .getElementById("rentalForm")
    .addEventListener(
      "submit",
      submitRental
    );


  modalContent
    .querySelector("[data-close]")
    .addEventListener(
      "click",
      closeModal
    );


  async function submitRental(event) {

    event.preventDefault();


    const startDate = new Date(start.value);
    const endDate = new Date(end.value);
    const hours = Math.ceil((endDate - startDate) / 3600000);
    const hourlyRate = Number(item.pricePerHour ?? item.price ?? 0);

    if (
      !start.value ||
      !end.value ||
      !Number.isFinite(hours) ||
      hours < 1
    ) {

      showToast(
        "Please select a valid rental period."
      );

      return;
    }


    if (
      !document.getElementById("pickup").value
    ) {

      showToast(
        "Please select a pickup location."
      );

      return;
    }


    if (
      !document.getElementById("payment").value
    ) {

      showToast(
        "Please select a payment method."
      );

      return;
    }


    const request = {

      ref:
        "CS-" +
        Date.now()
          .toString()
          .slice(-6),

      studentAccessToken: crypto.randomUUID() + crypto.randomUUID(),

      equipmentId:
        item.id,

      equipment:
        item.name,

      equipmentSource:
        item.source || "demo",

      provider:
        item.provider,

      providerId:
        item.providerId || "",

      campusName:
        item.campusName || "",

      start: start.value,
      end: end.value,
      hours: hours,
      days: Math.ceil(hours / 24),
      hourlyRate: hourlyRate,

      pickup:
        document.getElementById(
          "pickup"
        ).value,

      payment:
        document.getElementById(
          "payment"
        ).value,

      total:
        hours * hourlyRate,

      studentAccountId:
        getCurrentStudent()?.id || "",

      studentId:
        getCurrentStudent()?.studentId || "",

      studentEmail:
        getCurrentStudent()?.email || "",

      studentName:
        [
          getCurrentStudent()?.firstName,
          getCurrentStudent()?.lastName
        ]
          .filter(Boolean)
          .join(" ")
          .trim(),

      status:
        "Pending",

      paymentStatus: "Demo — awaiting payment",
      paymentProvider: "Not connected",
      paymentMode: "SIMULATED",
      commissionRate: 0.10,
      commissionAmount: Number((hours * hourlyRate * 0.10).toFixed(2)),
      providerShare: Number((hours * hourlyRate * 0.90).toFixed(2)),
      settlementStatus: "Pending return",
      disputeStatus: "None",
      payoutStatus: "Not paid — demo only",

      createdAt:
        new Date().toISOString()

    };


    try {
      const response = await fetch('/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rental: request })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Could not send the rental request to the provider.');
      Object.assign(request, result.rental || {});
    } catch (error) {
      showToast(error.message || 'Could not sync this rental request. Please try again.');
      return;
    }

    const rentals =
      getRentals();


    rentals.unshift(request);


    localStorage.setItem(
      "campusShareRentals",
      JSON.stringify(rentals)
    );

    modal.classList.add("hidden");
    openDemoCheckout(request);

  }

}


/* =========================
   DEMO CHECKOUT — NO REAL PAYMENT
========================= */
function openDemoCheckout(request) {
  const existing = document.getElementById("campusShareDemoCheckout");
  if (existing) existing.remove();

  const checkout = document.createElement("div");
  checkout.id = "campusShareDemoCheckout";
  checkout.style.cssText = "position:fixed;inset:0;z-index:99999;background:rgba(10,10,10,.62);display:flex;align-items:center;justify-content:center;padding:18px;font-family:inherit;";
  checkout.innerHTML = `
    <section role="dialog" aria-modal="true" aria-labelledby="csDemoCheckoutTitle" style="width:min(100%,460px);background:#fff;color:#171717;border-radius:20px;padding:26px;box-shadow:0 24px 80px rgba(0,0,0,.28);">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:18px;">
        <div><small style="display:block;font-size:11px;letter-spacing:1.5px;color:#777;font-weight:700;margin-bottom:5px;">CAMPUSSHARE</small><h2 id="csDemoCheckoutTitle" style="margin:0;font-size:25px;">Demo Checkout</h2></div>
        <span style="font-size:11px;font-weight:800;background:#fff1cc;color:#785000;padding:7px 10px;border-radius:999px;white-space:nowrap;">TEST MODE</span>
      </div>
      <p style="color:#555;margin:0 0 18px;line-height:1.5;">You're simulating a payment for this rental. No GCash, Maya, bank account, or real money is used.</p>
      <div style="border:1px solid #e5e5e5;border-radius:14px;padding:16px;margin-bottom:18px;">
        <div style="font-weight:700;font-size:16px;margin-bottom:5px;">${escapeDemoText(request.equipment)}</div>
        <div style="font-size:13px;color:#777;margin-bottom:16px;">Request #${escapeDemoText(request.ref)} · ${escapeDemoText(request.payment)} (simulated)</div>
        <div style="display:flex;justify-content:space-between;gap:12px;margin:8px 0;color:#555;font-size:14px;"><span>${Number(request.hours)} billable hour${Number(request.hours)===1?'':'s'} × ₱${Number(request.hourlyRate).toLocaleString()}</span><strong>₱${Number(request.total).toLocaleString()}</strong></div>
        <div style="border-top:1px solid #e5e5e5;margin-top:12px;padding-top:14px;display:flex;justify-content:space-between;align-items:center;gap:12px;"><strong>Total to simulate</strong><strong style="font-size:27px;">₱${Number(request.total).toLocaleString()}</strong></div>
      </div>
      <div style="background:#f5f5f5;border-radius:10px;padding:12px 14px;font-size:12px;color:#555;line-height:1.5;margin-bottom:18px;">Demo transaction only. A successful simulation records a test payment status; it does not confirm a real payment or guarantee the provider's rental approval.</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button type="button" id="csCancelDemoPayment" style="flex:1;min-width:120px;border:1px solid #d7d7d7;background:#fff;border-radius:10px;padding:13px 12px;font-weight:700;cursor:pointer;">Cancel</button>
        <button type="button" id="csPayDemoPayment" style="flex:1.4;min-width:160px;border:0;background:#151515;color:#fff;border-radius:10px;padding:13px 12px;font-weight:700;cursor:pointer;">Simulate payment · ₱${Number(request.total).toLocaleString()}</button>
      </div>
    </section>`;
  document.body.appendChild(checkout);

  document.getElementById("csPayDemoPayment").addEventListener("click", async () => {
    const all = getRentals();
    const target = all.find(r => String(r.ref) === String(request.ref));
    if (!target) {
      checkout.remove();
      showToast("Could not find the demo rental request. Please try again.");
      return;
    }
    const payButton = document.getElementById("csPayDemoPayment");
    payButton.disabled = true;
    try {
      const response = await fetch(`/api/rentals/${encodeURIComponent(target.ref)}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentAccessToken: target.studentAccessToken })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Demo checkout could not be synced.');
      Object.assign(target, result.rental || {});
    } catch (error) {
      payButton.disabled = false;
      showToast(error.message || 'Could not sync demo checkout. Please try again.');
      return;
    }
    localStorage.setItem("campusShareRentals", JSON.stringify(all));
    checkout.remove();
    showToast("Demo payment successful! No real money was charged.");
    setTimeout(() => { location.href = "rentals.html"; }, 700);
  });

  document.getElementById("csCancelDemoPayment").addEventListener("click", async () => {
    const target = getRentals().find(r => String(r.ref) === String(request.ref));
    if (target?.studentAccessToken) {
      await fetch(`/api/rentals/${encodeURIComponent(target.ref)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentAccessToken: target.studentAccessToken })
      }).catch(() => {});
    }
    const all = getRentals().filter(r => String(r.ref) !== String(request.ref));
    localStorage.setItem("campusShareRentals", JSON.stringify(all));
    checkout.remove();
    showToast("Demo checkout cancelled. No rental request or payment was kept.");
  });
}

function escapeDemoText(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}


/* =========================
   CLOSE MODAL
========================= */

function closeModal() {

  modal.classList.add(
    "hidden"
  );

}


document
  .querySelectorAll("[data-close]")
  .forEach(element => {

    element.addEventListener(
      "click",
      closeModal
    );

  });


modal.addEventListener(
  "click",
  event => {

    if (
      event.target === modal
    ) {

      closeModal();

    }

  }
);


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
   SEARCH
========================= */

search.addEventListener(
  "input",
  render
);


provider.addEventListener(
  "change",
  render
);


/* =========================
   GLOBAL SEARCH
========================= */

document
  .getElementById("globalSearch")
  .addEventListener(
    "input",
    event => {

      search.value =
        event.target.value;

      render();

    }
  );


/* =========================
   URL SEARCH
========================= */

const urlParams =
  new URLSearchParams(
    window.location.search
  );


const initialSearch =
  urlParams.get("search");


if (initialSearch) {

  search.value =
    initialSearch;

}


/* =========================
   NOTIFICATIONS BUTTON
========================= */

const notificationButton =
  document.getElementById(
    "notificationButton"
  );


if (notificationButton) {

  notificationButton.addEventListener(
    "click",
    () => {

      window.location.href =
        "notifications.html";

    }
  );

}


/* =========================
   TOAST
========================= */

function showToast(message) {

  toast.textContent =
    message;


  toast.classList.add(
    "show"
  );


  setTimeout(
    () => {

      toast.classList.remove(
        "show"
      );

    },
    2200
  );

}



/* =========================
   STUDENT IDENTITY SYNC
========================= */

function getCurrentStudent() {

  try {
    return JSON.parse(
      localStorage.getItem("campusShareCurrentUser") || "null"
    );
  } catch {
    return null;
  }

}


function syncStudentIdentity() {

  const student = getCurrentStudent();

  if (!student) {
    return;
  }


  const name =
    [
      student.firstName,
      student.lastName
    ]
      .filter(Boolean)
      .join(" ")
      .trim() ||

    student.name ||

    "Student";


  const studentId =
    student.studentId ||

    "";


  const school =
    student.school ||

    "";


  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .map(word => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();


  const replacements = {
    "Juan dela Cruz": name,
    "2024-00123 · PSAU":
      `${studentId}${school ? " · " + school : ""}`,
    "2024-00123":
      studentId
  };


  document
    .querySelectorAll("*")
    .forEach(element => {

      if (
        element.children.length > 0
      ) {
        return;
      }


      const value =
        element.textContent.trim();


      if (
        replacements[value] !== undefined
      ) {

        element.textContent =
          replacements[value];

      }

    });


  document
    .querySelectorAll(
      "input, textarea"
    )
    .forEach(field => {

      if (
        field.value ===
        "Juan dela Cruz"
      ) {

        field.value =
          name;

      }

      if (
        field.value ===
        "2024-00123"
      ) {

        field.value =
          studentId;

      }

    });


  const sidebarName =
    document.getElementById(
      "sidebarName"
    );

  const sidebarStudentId =
    document.getElementById(
      "sidebarStudentId"
    );

  const sidebarAvatar =
    document.getElementById(
      "sidebarAvatar"
    );

  const profileButton =
    document.getElementById(
      "profileButton"
    );


  if (sidebarName) {
    sidebarName.textContent =
      name;
  }


  if (sidebarStudentId) {
    sidebarStudentId.textContent =
      `${studentId}${school ? " · " + school : ""}`;
  }


  if (sidebarAvatar) {
    sidebarAvatar.textContent =
      initials.charAt(0);
  }


  if (profileButton) {
    profileButton.textContent =
      initials.charAt(0);
  }

}



/* =========================
   CAMPUSSHARE SHARED STUDENT INBOX
========================= */
const CS_RATINGS_KEY = "campusShareRatings";
function studentInboxAccessToken(studentInfo) {
  const identity = String(studentInfo.id || studentInfo.email || '').trim().toLowerCase();
  if (!identity) return '';
  const key = `campusShareInboxToken:${identity}`;
  let token = localStorage.getItem(key) || '';
  if (!token) {
    token = crypto.randomUUID() + crypto.randomUUID();
    localStorage.setItem(key, token);
  }
  return token;
}

async function fetchStudentThreads(token) {
  const response = await fetch('/api/messages/mine', {
    method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentInboxToken: token })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Could not load your messages.');
  return Array.isArray(result.threads) ? result.threads : [];
}

function currentStudentIdentity() {
  const student = typeof getCurrentStudent === "function" ? getCurrentStudent() : null;
  return {
    student,
    name: [student?.firstName, student?.lastName].filter(Boolean).join(" ").trim() || student?.name || "Student",
    id: String(student?.studentId || student?.id || ""),
    email: String(student?.email || "")
  };
}
function escapeChatText(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]));
}
function openMessenger(equipmentId = "") {
  const selectedItem = equipmentId ? equipment.find(item => String(item.id) === String(equipmentId)) : null;
  document.getElementById("campusShareMessenger")?.remove();
  const studentInfo = currentStudentIdentity();
  const providerMap = new Map();
  equipment.filter(item => item.providerId).forEach(item => providerMap.set(String(item.providerId), {
    id: String(item.providerId), name: String(item.providerName || item.provider || 'Provider'), campus: String(item.campusName || item.provider || '')
  }));
  const providers = [...providerMap.values()];
  const inboxToken = studentInboxAccessToken(studentInfo);
  const modal = document.createElement("div");
  modal.id = "campusShareMessenger";
  modal.className = "cs-messenger-overlay";
  modal.innerHTML = `
    <section class="cs-messenger-panel" role="dialog" aria-modal="true" aria-labelledby="csMessengerTitle">
      <header class="cs-messenger-head">
        <div><span class="cs-messenger-eyebrow">CAMPUSSHARE INBOX</span><strong id="csMessengerTitle">Messages</strong><small>${selectedItem ? `Inquiry about ${escapeChatText(selectedItem.name)}` : "Contact a provider before or after renting"}</small></div>
        <button type="button" class="cs-messenger-close" aria-label="Close messages">×</button>
      </header>
      <div class="cs-messenger-content">
        <div class="cs-messenger-form">
          <label for="csMessageProvider">Provider / campus</label>
          <select id="csMessageProvider" required><option value="">Choose provider</option>${providers.map(provider => `<option ${selectedItem && String(selectedItem.providerId) === provider.id ? "selected" : ""} value="${escapeChatText(provider.id)}">${escapeChatText(provider.campus && provider.campus !== provider.name ? `${provider.name} · ${provider.campus}` : provider.name)}</option>`).join("")}</select>
          <label for="csMessageEquipment">Equipment (optional)</label>
          <input id="csMessageEquipment" value="${selectedItem ? escapeChatText(selectedItem.name) : ""}" placeholder="General inquiry">
          <label for="csMessageText">Your message</label>
          <textarea id="csMessageText" rows="3" placeholder="Hi! I'd like to ask about availability, pickup, or rental details..." required></textarea>
          <button type="button" class="cs-messenger-send">Send message</button>
          <p class="cs-messenger-note">Your inquiry is sent to the provider’s shared CampusShare inbox, even before you rent. Replies appear here while signed in on this student browser.</p>
        </div>
        <div class="cs-messenger-thread-wrap"><div class="cs-thread-title">Conversation history</div><div class="cs-messenger-history" id="csMessageHistory"></div></div>
      </div>
    </section>`;
  document.body.appendChild(modal);
  let refreshTimer = null;
  let sharedThreads = [];
  const close = () => { if (refreshTimer) clearInterval(refreshTimer); modal.remove(); };
  modal.querySelector(".cs-messenger-close").addEventListener("click", close);
  modal.addEventListener("click", event => { if (event.target === modal) close(); });
  document.addEventListener("keydown", function esc(event) { if (event.key === "Escape" && document.getElementById("campusShareMessenger") === modal) { close(); document.removeEventListener("keydown", esc); } });
  const providerSelect = modal.querySelector("#csMessageProvider");
  function renderStudentThread() {
    const providerId = providerSelect.value;
    const threads = sharedThreads.filter(thread => !providerId || String(thread.providerId) === providerId);
    const history = modal.querySelector("#csMessageHistory");
    const threadMarkup = threads.map(thread => {
      const messages = (thread.messages || []).slice().sort((a,b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
      if (!messages.length) return "";
      return `<section class="cs-chat-thread"><strong class="cs-chat-thread-title">${escapeChatText(thread.equipment || "General inquiry")} · ${escapeChatText(thread.campusName || thread.provider || "Provider")}</strong>${messages.map(message => `<article class="cs-chat-message ${message.senderRole === 'provider' ? 'from-provider' : 'from-student'}"><small>${message.senderRole === 'provider' ? 'Provider' : 'You'} · ${escapeChatText(new Date(message.createdAt).toLocaleString())}</small><p>${escapeChatText(message.message)}</p></article>`).join("")}</section>`;
    }).join("");
    const hasThreadMessages = threads.some(thread => (thread.messages || []).length > 0);
    history.innerHTML = !inboxToken
      ? `<p class="cs-empty-thread">Sign in to your student account before messaging a provider.</p>`
      : hasThreadMessages ? threadMarkup
      : `<p class="cs-empty-thread">${providerId ? 'No messages in this conversation yet. Send an inquiry to start chatting.' : 'Choose a provider to view messages or send an inquiry.'}</p>`;
    history.scrollTop = history.scrollHeight;
  }
  async function refreshMessages() {
    if (!inboxToken) { renderStudentThread(); return; }
    try { sharedThreads = await fetchStudentThreads(inboxToken); renderStudentThread(); }
    catch (error) { modal.querySelector('#csMessageHistory').innerHTML = `<p class="cs-empty-thread">${escapeChatText(error.message)}</p>`; }
  }
  providerSelect.addEventListener("change", () => { renderStudentThread(); refreshMessages(); });
  modal.querySelector(".cs-messenger-send").addEventListener("click", async () => {
    const providerId = providerSelect.value.trim();
    const message = modal.querySelector("#csMessageText").value.trim();
    const equipmentName = modal.querySelector("#csMessageEquipment").value.trim();
    if (!inboxToken) { showToast("Please sign in before messaging a provider."); return; }
    if (!providerId || !message) { showToast("Choose a provider and enter your message first."); return; }
    const matchingItem = equipment.find(item => String(item.providerId) === providerId && String(item.name || '').trim().toLowerCase() === equipmentName.toLowerCase());
    const sendButton = modal.querySelector(".cs-messenger-send");
    sendButton.disabled = true; sendButton.textContent = 'Sending…';
    try {
      const response = await fetch('/api/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentInboxToken: inboxToken, providerId, equipmentId: matchingItem?.id || '', studentName: studentInfo.name, studentId: studentInfo.id, message })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Message could not be sent.');
      modal.querySelector("#csMessageText").value = "";
      await refreshMessages();
      showToast("Message sent to the provider.");
    } catch (error) { showToast(error.message || 'Message could not be sent. Please try again.'); }
    finally { sendButton.disabled = false; sendButton.textContent = 'Send message'; }
  });
  renderStudentThread();
  refreshMessages();
  refreshTimer = setInterval(refreshMessages, 8000);
  providerSelect.focus();
}

const messageProviderButton = document.getElementById("messageProviderButton");
messageProviderButton?.addEventListener("click", () => openMessenger());

// Keep the equipment-card Message action wired to the same centered inbox.

/* =========================
   INITIAL RENDER
========================= */

const originalEquipmentRenderForRatings = render;
render = function() { originalEquipmentRenderForRatings(); renderEquipmentRatingSummaries(); };
render();
refreshSharedProviderEquipment();
loadSharedRatingSummaries();
setInterval(refreshSharedProviderEquipment, 15000);
setInterval(loadSharedRatingSummaries, 30000);
