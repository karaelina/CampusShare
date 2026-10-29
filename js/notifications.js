/* FIXED: student-owned notifications only; no global rental migration. */
/* =========================
   CAMPUSSHARE
   NOTIFICATIONS 2.0
========================= */

const KEY = "campusShareRentals";
const READ_KEY = "campusShareReadNotifications";


let currentFilter = "All";

const USER_KEY = "campusShareCurrentUser";

function getCurrentUser() {
  try {
    return JSON.parse(
      localStorage.getItem(USER_KEY) || "null"
    );
  } catch {
    return null;
  }
}

function getStudentRentals() {
  const user = getCurrentUser();
  const all = getRentals();

  if (!user) return [];

  const studentId = String(user.studentId || "").trim().toLowerCase();
  const email = String(user.email || "").trim().toLowerCase();
  const accountId = String(user.id || "").trim().toLowerCase();

  /*
     IMPORTANT:
     Never migrate or claim unowned rentals for the
     currently logged-in student. Older demo records
     without ownership metadata stay excluded.
  */

  return all.filter(rental => {
    const rentalStudentId =
      String(rental.studentId || "").trim().toLowerCase();

    const rentalEmail =
      String(rental.studentEmail || "").trim().toLowerCase();

    const rentalAccountId =
      String(rental.studentAccountId || "").trim().toLowerCase();

    return (
      (studentId && rentalStudentId === studentId) ||
      (email && rentalEmail === email) ||
      (accountId && rentalAccountId === accountId)
    );
  });
}



/* =========================
   STORAGE
========================= */

function getRentals() {
  return JSON.parse(
    localStorage.getItem(KEY) || "[]"
  );
}


function getRead() {
  const user = getCurrentUser();
  const studentKey = user
    ? String(user.id || user.studentId || user.email || "guest")
    : "guest";

  try {
    const allRead = JSON.parse(
      localStorage.getItem(READ_KEY) || "{}"
    );

    return allRead[studentKey] || {};
  } catch {
    return {};
  }
}


function saveRead(data) {
  const user = getCurrentUser();
  const studentKey = user
    ? String(user.id || user.studentId || user.email || "guest")
    : "guest";

  let allRead = {};

  try {
    allRead = JSON.parse(
      localStorage.getItem(READ_KEY) || "{}"
    );
  } catch {
    allRead = {};
  }

  allRead[studentKey] = data;

  localStorage.setItem(
    READ_KEY,
    JSON.stringify(allRead)
  );
}


/* =========================
   NOTIFICATION GENERATOR
========================= */

function notificationFor(rental) {

  const status =
    rental.status || "Pending";


  const equipment =
    rental.equipment || "Equipment";


  const provider =
    rental.provider || "Partner Campus";


  const total =
    Number(rental.total || 0)
      .toLocaleString();


  const ref =
    rental.ref || "—";


  const createdAt =
    rental.createdAt || null;


  /*
     PENDING
  */

  if (status === "Pending") {

    return [

      {
        key: `${ref}-request`,
        type: "Approval",
        title: "Rental Request Submitted",

        text:
          `Your request for ${equipment} has been sent to ${provider} for review.`,

        createdAt
      },


      {
        key: `${ref}-payment`,
        type: "Payment",
        title: "Payment Pending Review",

        text:
          `Your payment of ₱${total} for ${ref} (${equipment}) is under review.`,

        createdAt
      }

    ];

  }


  /*
     APPROVED
  */

  if (status === "Approved") {

    return [

      {
        key: `${ref}-approved`,
        type: "Approval",
        title: "Rental Approved",

        text:
          `Your rental of ${equipment} has been approved by ${provider}. Pick it up during your scheduled rental period.`,

        createdAt
      },


      {
        key: `${ref}-payment`,
        type: "Payment",
        title: "Payment Verified",

        text:
          `Your payment of ₱${total} for ${ref} has been verified.`,

        createdAt
      },


      {
        key: `${ref}-pickup`,
        type: "Pickup / Use",
        title: "Pickup Instructions",

        text:
          `Pickup instructions for ${equipment} are now available.`,

        createdAt
      }

    ];

  }


  /*
     ACTIVE
  */

  if (status === "Active") {

    return [

      {
        key: `${ref}-approved`,
        type: "Approval",
        title: "Rental Approved",

        text:
          `Your rental of ${equipment} has been approved by ${provider}.`,

        createdAt
      },


      {
        key: `${ref}-payment`,
        type: "Payment",
        title: "Payment Verified",

        text:
          `Your payment of ₱${total} for ${ref} has been verified.`,

        createdAt
      },


      {
        key: `${ref}-pickup`,
        type: "Pickup / Use",
        title: "Equipment Checked Out",

        text:
          `${equipment} is now active under your rental. Please return it by the scheduled end date.`,

        createdAt
      },


      {
        key: `${ref}-return`,
        type: "Return",
        title: "Return Reminder",

        text:
          `${equipment} is due for return on ${formatDate(rental.end)}.`,

        createdAt
      }

    ];

  }


  /*
     COMPLETED / RETURNED
  */

  return [

    {
      key: `${ref}-returned`,
      type: "Approval",
      title: "Rental Completed",

      text:
        `${equipment} (${ref}) has been returned and your rental is complete.`,

      createdAt
    },


    {
      key: `${ref}-payment`,
      type: "Payment",
      title: "Payment Verified",

      text:
        `Your payment of ₱${total} for ${ref} (${equipment}) has been verified.`,

      createdAt
    }

  ];

}


/* =========================
   ALL NOTIFICATIONS
========================= */

function getNotifications() {

  return getStudentRentals()
    .flatMap(notificationFor)
    .sort((a, b) => {

      const dateA =
        a.createdAt
          ? new Date(a.createdAt).getTime()
          : 0;

      const dateB =
        b.createdAt
          ? new Date(b.createdAt).getTime()
          : 0;

      return dateB - dateA;

    });

}


/* =========================
   TYPE CLASS
========================= */

function getTypeClass(type) {

  if (type === "Approval") {
    return "approval";
  }

  if (type === "Payment") {
    return "payment";
  }

  if (type === "Pickup / Use") {
    return "pickup";
  }

  if (type === "Return") {
    return "return";
  }

  return "approval";

}


/* =========================
   ICON
========================= */

function getIcon(type) {

  if (type === "Approval") {
    return "✓";
  }

  if (type === "Payment") {
    return "▤";
  }

  if (type === "Pickup / Use") {
    return "♧";
  }

  if (type === "Return") {
    return "♧";
  }

  return "•";

}


/* =========================
   TIME FORMAT
========================= */

function formatTime(createdAt) {

  if (!createdAt) {
    return "Recent";
  }


  const date =
    new Date(createdAt);


  if (Number.isNaN(date.getTime())) {
    return "Recent";
  }


  const now =
    new Date();


  const diff =
    now.getTime() -
    date.getTime();


  const minutes =
    Math.floor(diff / 60000);


  if (minutes < 1) {
    return "Just now";
  }


  if (minutes < 60) {
    return `${minutes} min ago`;
  }


  const hours =
    Math.floor(minutes / 60);


  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }


  if (hours < 48) {
    return "Yesterday";
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
   DATE FORMAT
========================= */

function formatDate(value) {

  if (!value) {
    return "the scheduled return date";
  }


  const date =
    new Date(
      value + "T00:00:00"
    );


  if (Number.isNaN(date.getTime())) {
    return "the scheduled return date";
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
   UPDATE BADGES
========================= */

function updateBadges(unread) {

  const sidebarBadge =
    document.getElementById(
      "sidebarNotificationBadge"
    );


  const topBadge =
    document.getElementById(
      "topNotificationBadge"
    );


  if (sidebarBadge) {

    sidebarBadge.textContent =
      unread;

    sidebarBadge.classList.toggle(
      "show",
      unread > 0
    );

  }


  if (topBadge) {

    topBadge.textContent =
      unread;

    topBadge.classList.toggle(
      "show",
      unread > 0
    );

  }

}


/* =========================
   RENDER
========================= */

function render() {

  const allNotifications =
    getNotifications();


  const read =
    getRead();


  const unread =
    allNotifications.filter(
      notification =>
        !read[notification.key]
    ).length;


  /* Unread text */

  const unreadElement =
    document.getElementById(
      "unread"
    );


  unreadElement.textContent =
    `${unread} unread notification${unread === 1 ? "" : "s"}`;


  updateBadges(unread);


  /* Filter */

  const filtered =
    currentFilter === "All"
      ? allNotifications
      : allNotifications.filter(
          notification =>
            notification.type === currentFilter
        );


  const listElement =
    document.getElementById(
      "notificationList"
    );


  /* Empty */

  if (!filtered.length) {

    listElement.innerHTML = `

      <div class="empty">

        <strong>
          No notifications in this section.
        </strong>

        ${
          allNotifications.length
            ? "Try another notification category."
            : "Submit a rental request to see updates here."
        }

      </div>

    `;

    return;

  }


  /* Cards */

  listElement.innerHTML =
    filtered.map(notification => {

      const isRead =
        !!read[notification.key];


      const typeClass =
        getTypeClass(
          notification.type
        );


      return `

        <article
          class="notification ${isRead ? "read" : "unread"}"
          data-key="${notification.key}"
        >

          <div
            class="nicon ${typeClass}"
          >
            ${getIcon(notification.type)}
          </div>


          <div class="notification-body">

            <div class="notification-title-row">

              <strong>
                ${notification.title}
              </strong>

              <span
                class="notification-category ${typeClass}"
              >
                ${notification.type}
              </span>

            </div>


            <p>
              ${notification.text}
            </p>

          </div>


          <div class="notification-right">

            <span class="time">
              ${formatTime(notification.createdAt)}
            </span>

            <span class="dot"></span>

          </div>

        </article>

      `;

    }).join("");


  /* Click → mark as read */

  document
    .querySelectorAll(".notification")
    .forEach(card => {

      card.addEventListener(
        "click",
        () => {

          const key =
            card.dataset.key;


          const updatedRead =
            getRead();


          updatedRead[key] =
            true;


          saveRead(
            updatedRead
          );


          render();

        }
      );

    });

}


/* =========================
   FILTER BUTTONS
========================= */

document
  .querySelectorAll(".filter")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        currentFilter =
          button.dataset.filter;


        document
          .querySelectorAll(".filter")
          .forEach(filterButton => {

            filterButton.classList.remove(
              "active"
            );

          });


        button.classList.add(
          "active"
        );


        render();

      }
    );

  });


/* =========================
   MARK ALL AS READ
========================= */

document
  .getElementById("readAll")
  .addEventListener(
    "click",
    () => {

      const read =
        getRead();


      getNotifications()
        .forEach(notification => {

          read[notification.key] =
            true;

        });


      saveRead(read);


      render();

    }
  );


/* =========================
   GLOBAL SEARCH
========================= */

const globalSearch =
  document.getElementById(
    "globalSearch"
  );


if (globalSearch) {

  globalSearch.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter" &&
        globalSearch.value.trim()
      ) {

        window.location.href =
          `equipment.html?search=${encodeURIComponent(
            globalSearch.value.trim()
          )}`;

      }

    }
  );

}


/* =========================
   NOTIFICATION BUTTON
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
   PROFILE BUTTON
========================= */

const profileButton =
  document.getElementById(
    "profileButton"
  );


if (profileButton) {

  profileButton.addEventListener(
    "click",
    () => {

      window.location.href =
        "profile.html";

    }
  );

}


/* =========================
   INITIAL RENDER
========================= */

render();