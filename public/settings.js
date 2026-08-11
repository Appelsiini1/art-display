const apiBaseUrl =
  window.location.protocol === "http:" || window.location.protocol === "https:"
    ? window.location.origin
    : "http://localhost:9000";

const CURRENT_RATING_KEY = "currentRating";
const ALLOWED_RATINGS = ["all", "sfw", "nsfw"];

const metadataKeyInput = document.getElementById("metadata-key");
const metadataValueInput = document.getElementById("metadata-value");
const loadValueButton = document.getElementById("load-value-button");
const saveValueButton = document.getElementById("save-value-button");
const refreshAllButton = document.getElementById("refresh-all-button");
const statusMessage = document.getElementById("status-message");
const metadataListBody = document.getElementById("metadata-list-body");
const currentRatingValue = document.getElementById("current-rating-value");
const currentRatingStatus = document.getElementById("current-rating-status");
const ratingButtons = Array.from(document.querySelectorAll(".rating-button"));

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("status-error", isError);
}

function setCurrentRatingStatus(message, isError = false) {
  currentRatingStatus.textContent = message;
  currentRatingStatus.classList.toggle("status-error", isError);
}

function renderCurrentRating(value) {
  currentRatingValue.textContent = value;
  ratingButtons.forEach((button) => {
    const isActive = button.dataset.rating === value;
    button.classList.toggle("active", isActive);
    button.disabled = isActive;
  });
}

async function saveCurrentRating(rating) {
  if (!ALLOWED_RATINGS.includes(rating)) {
    setCurrentRatingStatus(`Invalid rating '${rating}'.`, true);
    return;
  }

  setCurrentRatingStatus("Saving current rating...");

  try {
    const response = await fetch(
      `${apiBaseUrl}/metadata?name=${encodeURIComponent(CURRENT_RATING_KEY)}&value=${encodeURIComponent(
        rating,
      )}`,
      { method: "POST" },
    );

    if (!response.ok) {
      throw new Error(`Server responded ${response.status}`);
    }

    renderCurrentRating(rating);
    await fetchMetadataList();
    setCurrentRatingStatus(`Current rating set to '${rating}'.`);
  } catch (error) {
    console.error(error);
    setCurrentRatingStatus("Failed to save current rating.", true);
  }
}

async function fetchCurrentRating() {
  setCurrentRatingStatus("Loading current rating...");

  try {
    const response = await fetch(
      `${apiBaseUrl}/metadata/get?name=${encodeURIComponent(CURRENT_RATING_KEY)}`,
    );

    if (!response.ok) {
      if (response.status === 404) {
        await saveCurrentRating("sfw");
        return;
      }
      throw new Error(`Server responded ${response.status}`);
    }

    const payload = await response.json();
    const value = payload?.value || "sfw";

    if (!payload?.value) {
      await saveCurrentRating(value);
      return;
    }

    renderCurrentRating(value);
    setCurrentRatingStatus(`Current rating is '${value}'.`);
  } catch (error) {
    console.error(error);
    setCurrentRatingStatus("Failed to load current rating.", true);
    renderCurrentRating("sfw");
  }
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
  const filteredValues = Array.isArray(values)
    ? values.filter((entry) => entry.name !== CURRENT_RATING_KEY)
    : [];

  if (!Array.isArray(filteredValues) || filteredValues.length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `<td colspan="2" class="metadata-empty">No metadata values found.</td>`;
    metadataListBody.appendChild(emptyRow);
    return;
  }

  filteredValues.forEach((entry) => {
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

ratingButtons.forEach((button) => {
  button.addEventListener("click", () => {
    saveCurrentRating(button.dataset.rating);
  });
});

loadValueButton.addEventListener("click", loadMetadataValue);
saveValueButton.addEventListener("click", saveMetadataValue);
refreshAllButton.addEventListener("click", fetchMetadataList);

fetchCurrentRating().then(() => fetchMetadataList());
