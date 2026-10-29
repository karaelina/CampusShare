const KEY = "campusSharePartnerships";
const form = document.getElementById("partnershipForm");
const MAX_FILE_BYTES = 5 * 1024 * 1024;

function getPartnerships() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
  catch { return []; }
}
function savePartnerships(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}
function normalizeEmail(value) { return String(value || "").trim().toLowerCase(); }
function showFormError(message) {
  let box = document.getElementById("partnershipFormError");
  if (!box) {
    box = document.createElement("div");
    box.id = "partnershipFormError";
    box.className = "partnership-form-error";
    box.setAttribute("role", "alert");
    form.prepend(box);
  }
  box.textContent = message;
  box.scrollIntoView({ behavior: "smooth", block: "center" });
}
function clearFormError() {
  const box = document.getElementById("partnershipFormError");
  if (box) box.remove();
}
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, type: file.type, size: file.size, dataUrl: reader.result });
    reader.onerror = () => reject(new Error(`Could not read ${file.name}. Please try again.`));
    reader.readAsDataURL(file);
  });
}
function validateFile(file, label, allowedTypes) {
  if (!file) return `${label} is required.`;
  if (!allowedTypes.includes(file.type)) return `${label}: unsupported file type. Please use ${allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}.`;
  if (file.size > MAX_FILE_BYTES) return `${label} must be 5 MB or smaller. Please resize it and try again.`;
  if (file.size === 0) return `${label} is empty. Please choose another file.`;
  return "";
}
function setupFilePreview(inputId, previewId) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  input.addEventListener("change", () => {
    preview.replaceChildren();
    preview.hidden = true;
    const file = input.files && input.files[0];
    if (!file) return;
    const error = validateFile(file, input.labels?.[0]?.textContent || "File", inputId === "representativeId"
      ? ["image/jpeg", "image/png", "image/webp"]
      : ["image/jpeg", "image/png", "image/webp", "application/pdf"]);
    if (error) { input.value = ""; showFormError(error); return; }
    clearFormError();
    const label = document.createElement("span");
    label.textContent = `${file.name} · ${(file.size / 1024).toFixed(0)} KB`;
    preview.appendChild(label);
    if (file.type.startsWith("image/")) {
      const image = document.createElement("img");
      image.alt = `${file.name} preview`;
      image.src = URL.createObjectURL(file);
      preview.appendChild(image);
    } else {
      const icon = document.createElement("span");
      icon.textContent = "PDF document selected";
      preview.appendChild(icon);
    }
    preview.hidden = false;
  });
}
setupFilePreview("representativeId", "representativeIdPreview");
setupFilePreview("authorizationDocument", "authorizationDocumentPreview");

form.addEventListener("submit", async function(event) {
  event.preventDefault();
  clearFormError();
  const submitButton = form.querySelector('[type="submit"]');
  if (submitButton.disabled) return;

  const campusName = document.getElementById("campusName").value.trim();
  const providerName = document.getElementById("providerName").value.trim();
  const campusAddress = document.getElementById("campusAddress").value.trim();
  const contactPerson = document.getElementById("contactPerson").value.trim();
  const contactNumber = document.getElementById("contactNumber").value.trim();
  const officialEmail = document.getElementById("officialEmail").value.trim();
  const normalizedEmail = normalizeEmail(officialEmail);
  const equipmentCategory = document.getElementById("equipmentCategory").value;
  const equipmentCount = document.getElementById("equipmentCount").value;
  const equipmentDescription = document.getElementById("equipmentDescription").value.trim();
  const partnershipReason = document.getElementById("partnershipReason").value.trim();
  const agreement = document.getElementById("agreement").checked;
  const idFile = document.getElementById("representativeId").files[0];
  const authorizationFile = document.getElementById("authorizationDocument").files[0];

  if (!agreement) return showFormError("Please confirm that the information provided is accurate.");
  const existing = getPartnerships().find(item => normalizeEmail(item.officialEmail || item.email) === normalizedEmail);
  if (existing) {
    return showFormError(`This email already has a partnership application (${existing.id || "existing reference"}, status: ${existing.status || "Pending"}). Each email can be used for one application only. If you need help with an existing or rejected request, contact CampusShare administration.`);
  }
  let fileError = validateFile(idFile, "Authorized Representative ID", ["image/jpeg", "image/png", "image/webp"]);
  if (fileError) return showFormError(fileError);
  fileError = validateFile(authorizationFile, "Organization Authorization Document", ["image/jpeg", "image/png", "image/webp", "application/pdf"]);
  if (fileError) return showFormError(fileError);

  submitButton.disabled = true;
  submitButton.textContent = "Preparing application…";
  try {
    const [representativeId, authorizationDocument] = await Promise.all([
      readFileAsDataURL(idFile), readFileAsDataURL(authorizationFile)
    ]);
    const partnerships = getPartnerships();
    // Recheck after asynchronous file reads to reduce accidental duplicate submissions in this browser.
    if (partnerships.some(item => normalizeEmail(item.officialEmail || item.email) === normalizedEmail)) {
      throw new Error("This email already has a partnership application. Please use the Track Partnership Request option instead.");
    }
    const now = new Date().toISOString();
    const partnership = {
      id: "PART-" + Date.now().toString().slice(-6), campusName, providerName, campusAddress,
      contactPerson, contactNumber, officialEmail, officialEmailNormalized: normalizedEmail,
      equipmentCategory, equipmentCount: Number(equipmentCount), equipmentDescription, partnershipReason,
      verificationDocuments: { representativeId, authorizationDocument },
      verificationStatus: "Not Started", status: "Pending Review", statusNote: "",
      createdAt: now, updatedAt: now, statusUpdatedAt: now
    };
    partnerships.push(partnership);
    savePartnerships(partnerships);

    let confirmation = document.getElementById("partnershipSubmissionConfirmation");
    if (!confirmation) {
      confirmation = document.createElement("section");
      confirmation.id = "partnershipSubmissionConfirmation";
      confirmation.className = "partnership-confirmation";
      confirmation.setAttribute("role", "status");
      confirmation.setAttribute("aria-live", "polite");
      form.parentNode.insertBefore(confirmation, form);
    }
    confirmation.innerHTML = "";
    const heading = document.createElement("strong"); heading.textContent = "Partnership request submitted!";
    const ref = document.createElement("p"); ref.append("Your reference number is ");
    const refStrong = document.createElement("b"); refStrong.textContent = partnership.id; ref.appendChild(refStrong);
    heading.textContent = "Partnership request submitted!";
    const status = document.createElement("p"); status.textContent = "Your application is now Pending Review. Track your application first. Provider Login and Activate Account stay locked for this application until CampusShare administration approves it.";
    const refWrap = document.createElement("p"); refWrap.textContent = "Application reference number";
    const applicationRefBadge = document.createElement("span"); applicationRefBadge.className = "application-ref"; applicationRefBadge.textContent = partnership.id; refWrap.appendChild(applicationRefBadge);
    const privacy = document.createElement("p"); privacy.textContent = "Prototype only: uploaded files are stored in this browser and are not securely protected. Use sample documents only.";
    const actions = document.createElement("div"); actions.className = "next-actions";
    const track = document.createElement("a"); track.className = "track-now"; track.href = "provider-login.html?track=" + encodeURIComponent(partnership.id); track.textContent = "Track Your Partnership";
    const loginLocked = document.createElement("button"); loginLocked.type = "button"; loginLocked.className = "locked-action"; loginLocked.disabled = true; loginLocked.textContent = "Provider Login — Locked until approval";
    const activateLocked = document.createElement("button"); activateLocked.type = "button"; activateLocked.className = "locked-action"; activateLocked.disabled = true; activateLocked.textContent = "Activate Account — Locked until approval";
    const lockNote = document.createElement("p"); lockNote.className = "locked-help"; lockNote.textContent = "These actions become available after the Admin approves this application. You can always return here to track its status.";
    actions.append(track, loginLocked, activateLocked, lockNote);
    confirmation.replaceChildren(heading, refWrap, status, privacy, actions);
    confirmation.scrollIntoView({ behavior: "smooth", block: "center" });
    form.classList.add("partnership-form-complete");
    form.reset();
    document.getElementById("representativeIdPreview").hidden = true;
    document.getElementById("authorizationDocumentPreview").hidden = true;
  } catch (error) {
    showFormError(error.message || "Unable to save this application. Check browser storage and try smaller files.");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit Partnership Request";
  }
});
