/* =========================
   CAMPUSSHARE EQUIPMENT
========================= */

const demoEquipment = [
  {
    id: "EQ001",
    name: "MacBook Air M2",
    category: "Laptops",
    provider: "PNU Main Campus",
    price: 150,
    available: true,
    icon: "💻",
    desc: "Apple MacBook Air M2, 8GB RAM, 256GB SSD. Ideal for presentations, coding, and document work."
  },

  {
    id: "EQ002",
    name: "Lenovo ThinkPad E14",
    category: "Laptops",
    provider: "WCC Campus",
    price: 130,
    available: true,
    icon: "💻",
    desc: "Reliable laptop for academic tasks, presentations, research, and everyday school work."
  },

  {
    id: "EQ003",
    name: "Sony A7III Camera",
    category: "Cameras",
    provider: "PSAU Main Campus",
    price: 700,
    available: true,
    icon: "📷",
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
    price: Number(item.price || 0),
    quantity: Number(item.quantity || 0),
    available: item.status === "Available" && Number(item.quantity || 0) > 0,
    icon: getEquipmentIcon(item.category),
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

            ${item.icon}

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


            <div class="equipment-description">
              ${item.desc}
            </div>


            <div class="equipment-meta">

              <div class="equipment-price">
                ₱${item.price.toLocaleString()}
                <small>/ day</small>
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

            </div>

          </div>

        </article>
      `;

    }).join("");

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
          ₱${item.price.toLocaleString()} / day
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
        ₱${item.price.toLocaleString()}/day
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
          type="date"
          min="${min}"
          required
        >

      </div>


      <div class="form-group">

        <label>
          Rental End
        </label>

        <input
          id="endDate"
          type="date"
          min="${min}"
          required
        >

      </div>


      <div class="form-group">

        <label>
          Pickup Location
        </label>

        <select
          id="pickup"
          required
        >

          <option value="">
            Select pickup location
          </option>

          <option>
            ${item.provider} — Equipment Office
          </option>

          <option>
            ${item.provider} — Main Building
          </option>

          <option>
            ${item.provider} — Library
          </option>

        </select>

      </div>


      <div class="form-group">

        <label>
          Payment Method
        </label>

        <select
          id="payment"
          required
        >

          <option value="">
            Select payment method
          </option>

          <option>
            GCash
          </option>

          <option>
            Maya
          </option>

          <option>
            Cash on Pickup
          </option>

        </select>

      </div>


      <div class="rental-summary">

        <div class="rental-summary-row">

          <span>
            Daily rate
          </span>

          <strong>
            ₱${item.price.toLocaleString()}
          </strong>

        </div>


        <div class="rental-summary-row">

          <span>
            Rental days
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


    const startDate =
      new Date(
        start.value + "T00:00:00"
      );


    const endDate =
      new Date(
        end.value + "T00:00:00"
      );


    const days =
      Math.floor(
        (endDate - startDate) /
        86400000
      ) + 1;


    if (days > 0) {

      document.getElementById("days")
        .textContent =
        `${days} day${days > 1 ? "s" : ""}`;


      document.getElementById("total")
        .textContent =
        "₱" +
        (days * item.price)
          .toLocaleString();

    } else {

      document.getElementById("days")
        .textContent =
        "Invalid";


      document.getElementById("total")
        .textContent =
        "₱0";

    }

  }


  start.addEventListener(
    "change",
    () => {

      end.min =
        start.value;

      updateTotal();

    }
  );


  end.addEventListener(
    "change",
    updateTotal
  );


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


    const startDate =
      new Date(
        start.value + "T00:00:00"
      );


    const endDate =
      new Date(
        end.value + "T00:00:00"
      );


    const days =
      Math.floor(
        (endDate - startDate) /
        86400000
      ) + 1;


    if (
      !start.value ||
      !end.value ||
      days < 1
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

      start:
        start.value,

      end:
        end.value,

      days:

        days,

      pickup:
        document.getElementById(
          "pickup"
        ).value,

      payment:
        document.getElementById(
          "payment"
        ).value,

      total:
        days * item.price,

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


    modal.classList.add(
      "hidden"
    );


    showToast(
      "Rental request submitted successfully!"
    );


    setTimeout(
      () => {
        location.href =
          "rentals.html";
      },
      700
    );

  }

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
   INITIAL RENDER
========================= */

render();