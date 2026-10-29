/* =========================
   CAMPUSSHARE EQUIPMENT
========================= */

const demoEquipment = [
  {
    id: "EQ001",
    name: "MacBook Air M2",
    category: "Laptops",
    provider: "PNU Main Campus",
    pickupLocation: "PNU Main Campus — Equipment Office",
    price: 150,
    available: true,
    icon: "💻",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=85",
    desc: "Apple MacBook Air M2, 8GB RAM, 256GB SSD. Ideal for presentations, coding, and document work."
  },

  {
    id: "EQ002",
    name: "Lenovo ThinkPad E14",
    category: "Laptops",
    provider: "WCC Campus",
    pickupLocation: "WCC Campus — Equipment Office",
    price: 130,
    available: true,
    icon: "💻",
    image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1000&q=85",
    desc: "Reliable laptop for academic tasks, presentations, research, and everyday school work."
  },

  {
    id: "EQ003",
    name: "Sony A7III Camera",
    category: "Cameras",
    provider: "PSAU Main Campus",
    pickupLocation: "PSAU Main Campus — Equipment Office",
    price: 700,
    available: true,
    icon: "📷",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=85",
    desc: "Full-frame mirrorless 24.3MP camera. Suitable for shoots, events, and project documentation."
  },

  {
    id: "EQ004",
    name: "Rode PodMic USB",
    category: "Microphones",
    provider: "NORSU Campus",
    price: 80,
    available: true,
    icon: "🎙️",
    image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1000&q=85",
    desc: "Professional USB condenser microphone ideal for podcasting, voice recording, and presentations."
  },

  {
    id: "EQ005",
    name: "Canon EOS 90D",
    category: "Cameras",
    provider: "WCC Campus",
    price: 800,
    available: false,
    icon: "📷",
    image: "https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?auto=format&fit=crop&w=1000&q=85",
    desc: "32.5MP DSLR camera. Excellent for professional photography and video recording."
  },

  {
    id: "EQ006",
    name: "Epson EB-X31 Projector",
    category: "Projectors",
    provider: "PNU Main Campus",
    price: 500,
    available: true,
    icon: "📽️",
    image: "https://images.unsplash.com/photo-1535016120720-40c646be5580?auto=format&fit=crop&w=1000&q=85",
    desc: "3200 lumens XGA projector suitable for classrooms, presentations, and events."
  },

  {
    id: "EQ007",
    name: "BenQ MW560 Projector",
    category: "Projectors",
    provider: "NORSU Campus",
    price: 700,
    available: true,
    icon: "📽️",
    image: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1000&q=85",
    desc: "4000 lumens WXGA projector ideal for large venues and presentations."
  },

  {
    id: "EQ008",
    name: "Shure SM58 Microphone",
    category: "Microphones",
    provider: "WCC Campus",
    price: 100,
    available: true,
    icon: "🎤",
    image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1000&q=85",
    desc: "Industry-standard dynamic vocal microphone for live performances and presentations."
  },

  {
    id: "EQ009",
    name: "Yamaha MG10 Mixer",
    category: "Audio",
    provider: "PNU Main Campus",
    price: 200,
    available: true,
    icon: "🎛️",
    image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1000&q=85",
    desc: "10-channel compact mixer for live audio, events, and studio recording sessions."
  },

  {
    id: "EQ010",
    name: "Epson EcoTank L3250 Printer",
    category: "Printers",
    provider: "PNU Main Campus",
    price: 80,
    available: true,
    icon: "🖨️",
    image: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=1000&q=85",
    desc: "All-in-one Wi-Fi printer for school documents, reports, and learning materials."
  }
];

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

function getAllEquipment() {
  const providerEquipment = getProviderEquipment();

  const normalizedProviderEquipment = providerEquipment.map(item => ({
    id: item.id,
    name: item.name || "Provider Equipment",
    category: item.category || "Other",
    provider: item.providerName || item.provider || item.campusName || "CampusShare Partner",
    campusName: item.campusName || "",
    providerId: item.providerId || "",
    pickupLocation: item.pickupLocation || item.campusName || item.providerName || item.provider || "Contact provider for designated location",
    price: Number(item.price || 0),
    quantity: Number(item.quantity || 0),
    available: item.status === "Available" && Number(item.quantity || 0) > 0,
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

function getEquipmentIcon(category) {
  const icons = {
    Laptops: "💻",
    Cameras: "📷",
    Microphones: "🎙️",
    Projectors: "📽️",
    Audio: "🎛️",
    Printers: "🖨️",
    Tablets: "📱",
    "Tripods & Stands": "📐",
    Lighting: "💡",
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
    Laptops: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=85",
    Cameras: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=85",
    Microphones: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1000&q=85",
    Projectors: "https://images.unsplash.com/photo-1535016120720-40c646be5580?auto=format&fit=crop&w=1000&q=85",
    Audio: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1000&q=85",
    Printers: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=1000&q=85",
    Tablets: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=1000&q=85",
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
  ...new Set(
    getAllEquipment().map(item => item.category)
  )
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

  const providers = [
    "All",
    ...new Set(
      getAllEquipment().map(item => item.provider)
    )
  ];

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

      const categoryMatch =
        selectedCategory === "All" ||
        item.category === selectedCategory;


      const providerMatch =
        selectedProvider === "All" ||
        item.provider === selectedProvider;


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
function getCampusRatings() {
  try { const rows = JSON.parse(localStorage.getItem(CS_RATINGS_KEY) || "[]"); return Array.isArray(rows) ? rows : []; }
  catch { return []; }
}
function renderEquipmentRatingSummaries() {
  document.querySelectorAll("[data-rating-equipment]").forEach(node => {
    const item = equipment.find(row => String(row.id) === String(node.dataset.ratingEquipment));
    if (!item) return;
    const rows = getCampusRatings().filter(row => row.equipmentId === String(item.id) || (row.equipment === item.name && row.provider === item.provider));
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

      ${item.desc}

    </div>


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


  function submitRental(event) {

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

  document.getElementById("csPayDemoPayment").addEventListener("click", () => {
    const all = getRentals();
    const target = all.find(r => String(r.ref) === String(request.ref));
    if (!target) {
      checkout.remove();
      showToast("Could not find the demo rental request. Please try again.");
      return;
    }
    target.paymentStatus = "Demo payment successful — not real money";
    target.paymentMode = "SIMULATED";
    target.paymentProvider = "CampusShare Demo Checkout";
    target.demoPaymentStatus = "SUCCESS";
    target.demoPaymentReference = "DEMO-PAY-" + String(request.ref).replace(/[^a-z0-9]/gi, "");
    target.demoPaidAt = new Date().toISOString();
    target.settlementStatus = "Pending successful return";
    target.payoutStatus = "Not paid — demo only";
    localStorage.setItem("campusShareRentals", JSON.stringify(all));
    checkout.remove();
    showToast("Demo payment successful! No real money was charged.");
    setTimeout(() => { location.href = "rentals.html"; }, 700);
  });

  document.getElementById("csCancelDemoPayment").addEventListener("click", () => {
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
   CAMPUSSHARE MESSENGER — CENTERED DEMO INBOX
   Browser-local prototype; not cross-device messaging.
========================= */
const CS_MESSAGES_KEY = "campusShareMessages";
const CS_RATINGS_KEY = "campusShareRatings";

function readCampusMessages() {
  try { const value = JSON.parse(localStorage.getItem(CS_MESSAGES_KEY) || "[]"); return Array.isArray(value) ? value : []; }
  catch { return []; }
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
  const providers = [...new Set(equipment.map(item => item.provider).filter(Boolean))];
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
          <select id="csMessageProvider" required><option value="">Choose provider</option>${providers.map(name => `<option ${selectedItem && selectedItem.provider === name ? "selected" : ""} value="${escapeChatText(name)}">${escapeChatText(name)}</option>`).join("")}</select>
          <label for="csMessageEquipment">Equipment (optional)</label>
          <input id="csMessageEquipment" value="${selectedItem ? escapeChatText(selectedItem.name) : ""}" placeholder="General inquiry">
          <label for="csMessageText">Your message</label>
          <textarea id="csMessageText" rows="3" placeholder="Hi! I'd like to ask about availability, pickup, or rental details..." required></textarea>
          <button type="button" class="cs-messenger-send">Send message</button>
          <p class="cs-messenger-note">Demo inbox: saved in this browser's localStorage only. It is not real-time or shared across devices.</p>
        </div>
        <div class="cs-messenger-thread-wrap"><div class="cs-thread-title">Conversation history</div><div class="cs-messenger-history" id="csMessageHistory"></div></div>
      </div>
    </section>`;
  document.body.appendChild(modal);
  const close = () => modal.remove();
  modal.querySelector(".cs-messenger-close").addEventListener("click", close);
  modal.addEventListener("click", event => { if (event.target === modal) close(); });
  document.addEventListener("keydown", function esc(event) { if (event.key === "Escape" && document.getElementById("campusShareMessenger") === modal) { close(); document.removeEventListener("keydown", esc); } });
  const providerSelect = modal.querySelector("#csMessageProvider");
  function renderStudentThread() {
    const providerName = providerSelect.value;
    const all = readCampusMessages().filter(message => {
      const sameStudent = String(message.studentId || "") === studentInfo.id || (studentInfo.email && String(message.studentEmail || "").toLowerCase() === studentInfo.email.toLowerCase()) || (message.studentName === studentInfo.name);
      return sameStudent && (!providerName || message.provider === providerName);
    }).sort((a,b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    const history = modal.querySelector("#csMessageHistory");
    history.innerHTML = all.length ? all.map(message => `<article class="cs-chat-message ${message.senderRole === 'provider' ? 'from-provider' : 'from-student'}"><small>${message.senderRole === 'provider' ? 'Provider' : 'You'} · ${escapeChatText(message.equipment || 'General inquiry')} · ${escapeChatText(new Date(message.createdAt).toLocaleString())}</small><p>${escapeChatText(message.message)}</p></article>`).join("") : `<p class="cs-empty-thread">No messages yet. Send your first inquiry to start a conversation.</p>`;
    history.scrollTop = history.scrollHeight;
  }
  providerSelect.addEventListener("change", renderStudentThread);
  modal.querySelector(".cs-messenger-send").addEventListener("click", () => {
    const providerName = providerSelect.value.trim();
    const message = modal.querySelector("#csMessageText").value.trim();
    const equipmentName = modal.querySelector("#csMessageEquipment").value.trim();
    if (!providerName || !message) { alert("Choose a provider and enter your message first."); return; }
    const messages = readCampusMessages();
    messages.push({ id: "MSG-" + Date.now(), provider: providerName, providerId: selectedItem?.providerId || "", equipment: equipmentName, studentName: studentInfo.name, studentId: studentInfo.id, studentEmail: studentInfo.email, message, createdAt: new Date().toISOString(), senderRole: "student", status: "Unread" });
    localStorage.setItem(CS_MESSAGES_KEY, JSON.stringify(messages));
    modal.querySelector("#csMessageText").value = "";
    renderStudentThread();
    showToast("Message saved to demo inbox.");
  });
  renderStudentThread();
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