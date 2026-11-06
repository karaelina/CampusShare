const KEY = "campusSharePartnerships";

const form = document.getElementById("partnershipForm");

function getPartnerships(){
  return JSON.parse(localStorage.getItem(KEY) || "[]");
}

function savePartnerships(data){
  localStorage.setItem(KEY, JSON.stringify(data));
}


form.addEventListener("submit", function(event){

  event.preventDefault();


  /* =========================
     GET FORM VALUES
  ========================== */

  const campusName =
    document.getElementById("campusName").value.trim();

  const providerName =
    document.getElementById("providerName").value.trim();

  const campusAddress =
    document.getElementById("campusAddress").value.trim();

  const contactPerson =
    document.getElementById("contactPerson").value.trim();

  const contactNumber =
    document.getElementById("contactNumber").value.trim();

  const officialEmail =
    document.getElementById("officialEmail").value.trim();

  const equipmentCategory =
    document.getElementById("equipmentCategory").value;

  const equipmentCount =
    document.getElementById("equipmentCount").value;

  const equipmentDescription =
    document.getElementById("equipmentDescription").value.trim();

  const partnershipReason =
    document.getElementById("partnershipReason").value.trim();

  const agreement =
    document.getElementById("agreement").checked;


  /* =========================
     BASIC VALIDATION
  ========================== */

  if(!agreement){
    alert(
      "Please confirm that the information provided is accurate."
    );
    return;
  }


  /* =========================
     CREATE PARTNERSHIP REQUEST
  ========================== */

  const partnership = {

    id:
      "PART-" +
      Date.now().toString().slice(-6),

    campusName,

    providerName,

    campusAddress,

    contactPerson,

    contactNumber,

    officialEmail,

    equipmentCategory,

    equipmentCount:

      Number(equipmentCount),

    equipmentDescription,

    partnershipReason,

    status:
      "Pending Review",

    verificationStatus:
      "Not Started",

    createdAt:
      new Date().toISOString(),

    updatedAt:
      new Date().toISOString()

  };


  /* =========================
     SAVE REQUEST
  ========================== */

  const partnerships =
    getPartnerships();

  partnerships.push(partnership);

  savePartnerships(partnerships);


  /* =========================
     SUCCESS MESSAGE
  ========================== */

  alert(
    "Partnership request submitted successfully! " +
    "CampusShare administration will review your request."
  );


  /* =========================
     RESET FORM
  ========================== */

  form.reset();

});