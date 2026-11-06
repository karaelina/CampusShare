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

  const partnerships = JSON.parse(
    localStorage.getItem("campusSharePartnerships") || "[]"
  );

  return partnerships.find(
    item => item.id === session.partnershipId
  );

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
  session?.providerName ||
  partnership?.providerName ||
  "Provider";

const campusName =
  session?.campusName ||
  partnership?.campusName ||
  "Campus";


document.getElementById("providerName").textContent =
  providerName;

document.getElementById("campusName").textContent =
  campusName;

document.getElementById("welcomeName").textContent =
  providerName;


/* =========================
   PROFILE
========================= */

document.getElementById("profileCampus").textContent =
  partnership?.campusName || "—";

document.getElementById("profileProvider").textContent =
  partnership?.providerName || "—";

document.getElementById("profileEmail").textContent =
  partnership?.officialEmail || "—";

document.getElementById("profileContact").textContent =
  partnership?.contactPerson || "—";

document.getElementById("profileNumber").textContent =
  partnership?.contactNumber || "—";


/* =========================
   NAVIGATION
========================= */

const sections = {
  dashboard: "dashboardSection",
  equipment: "equipmentSection",
  requests: "requestsSection",
  active: "activeSection",
  returns: "returnsSection",
  profile: "profileSection"
};

const titles = {
  dashboard: "Dashboard",
  equipment: "My Equipment",
  requests: "Rental Requests",
  active: "Active Rentals",
  returns: "Returns",
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

      name:
        document
          .getElementById("equipmentName")
          .value
          .trim(),

      category:
        document
          .getElementById("equipmentCategory")
          .value,

      price:
        Number(
          document
            .getElementById("equipmentPrice")
            .value
        ),

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

          <div>

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
              ₱${Number(item.price).toLocaleString()}/day
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

  const list =
    document.getElementById("requestList");


  const requests =
    getRentals().filter(
      rental =>
        rental.provider === providerName
    );


  if(!requests.length){

    list.innerHTML = `
      <div class="empty">

        <strong>No rental requests yet.</strong>

        Student rental requests will appear here.

      </div>
    `;

    return;

  }


  list.innerHTML =
    requests.map(item => {

      return `
        <div class="rental-item">

          <div>

            <div class="item-title">
              ${item.equipment || "Equipment"}
            </div>

            <div class="item-meta">
              Rental:
              ${item.start || "—"}
              →
              ${item.end || "—"}

              <br>

              Reference:
              ${item.ref || "—"}

            </div>

          </div>

          <span class="status ${
            String(item.status || "")
              .toLowerCase()
          }">

            ${item.status || "Pending"}

          </span>

        </div>
      `;

    }).join("");

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
        rental.provider === providerName &&
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
              Reference: ${item.ref}
            </div>

          </div>

          <span class="status active">
            Active
          </span>

        </div>
      `;

    }).join("");

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
        rental.provider === providerName &&
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
              Reference: ${item.ref}
            </div>

          </div>

          <span class="status completed">
            Completed
          </span>

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
        item => item.status === "Pending"
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