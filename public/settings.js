const apiBaseUrl =
  window.location.protocol === "http:" || window.location.protocol === "https:"
    ? window.location.origin
    : "http://localhost:9000";

const metadataKeyInput = document.getElementById("metadata-key");
const metadataValueInput = document.getElementById("metadata-value");
const loadValueButton = document.getElementById("load-value-button");
const saveValueButton = document.getElementById("save-value-button");
const refreshAllButton = document.getElementById("refresh-all-button");
const statusMessage = document.getElementById("status-message");
const metadataListBody = document.getElementById("metadata-list-body");

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("status-error", isError);
}

async function fetchMetadataList() {
  setStatus("Loading metadata values...");

  try {
    const response = await fetch(`${apiBaseUrl}/metadata/get/all`);
    if (!response.ok) {
      throw new Error(`Server responded ${response.status}`);
    }
    const payload = await response.json();
    renderMetadataList(payload.metadata || []);
    setStatus(`Loaded ${payload.metadata?.length || 0} metadata values.`);
  } catch (error) {
    console.error(error);
    setStatus("Failed to load metadata values.", true);
  }
}

function renderMetadataList(values) {
  metadataListBody.innerHTML = "";

  if (!Array.isArray(values) || values.length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `<td colspan="2" class="metadata-empty">No metadata values found.</td>`;
    metadataListBody.appendChild(emptyRow);
    return;
  }

  values.forEach((entry) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${escapeHtml(entry.name || "")}</td><td>${escapeHtml(entry.value || "")}</td>`;
    metadataListBody.appendChild(row);
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function loadMetadataValue() {
  const key = metadataKeyInput.value.trim();
  if (!key) {
    setStatus("Enter a metadata key to load.", true);
    return;
  }

  setStatus("Loading metadata value...");
  try {
    const response = await fetch(`${apiBaseUrl}/metadata/get?name=${encodeURIComponent(key)}`);
    if (!response.ok) {
      if (response.status === 404) {
        setStatus(`Metadata key '${key}' not found.`, true);
        return;
      }
      throw new Error(`Server responded ${response.status}`);
    }

    const payload = await response.json();
    metadataValueInput.value = payload.value || "";
    setStatus(`Loaded value for '${key}'.`);
  } catch (error) {
    console.error(error);
    setStatus("Failed to load metadata value.", true);
  }
}

async function saveMetadataValue() {
  const key = metadataKeyInput.value.trim();
  const value = metadataValueInput.value.trim();
  if (!key) {
    setStatus("Enter a metadata key before saving.", true);
    return;
  }

  setStatus("Saving metadata value...");
  try {
    const response = await fetch(
      `${apiBaseUrl}/metadata?name=${encodeURIComponent(key)}&value=${encodeURIComponent(value)}`,
      { method: "POST" },
    );

    if (!response.ok) {
      throw new Error(`Server responded ${response.status}`);
    }

    setStatus(`Saved metadata key '${key}'.`);
    await fetchMetadataList();
  } catch (error) {
    console.error(error);
    setStatus("Failed to save metadata value.", true);
  }
}

loadValueButton.addEventListener("click", loadMetadataValue);
saveValueButton.addEventListener("click", saveMetadataValue);
refreshAllButton.addEventListener("click", fetchMetadataList);

fetchMetadataList();
