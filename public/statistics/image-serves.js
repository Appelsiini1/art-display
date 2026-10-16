const apiBaseUrl =
  window.location.protocol === "http:" || window.location.protocol === "https:"
    ? window.location.origin
    : "http://localhost:54560";

const rangeSelect = document.getElementById("range-select");
const statusMessage = document.getElementById("status-message");
const topFilesBody = document.getElementById("top-files-body");
const topArtistsBody = document.getElementById("top-artists-body");
const latestServedBody = document.getElementById("latest-served-body");

const statFields = {
  total: document.getElementById("stat-total"),
  sfw: document.getElementById("stat-sfw"),
  nsfw: document.getElementById("stat-nsfw"),
  sfwPct: document.getElementById("stat-sfw-pct"),
  nsfwPct: document.getElementById("stat-nsfw-pct"),
};

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("status-error", isError);
}

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatTimestamp(value) {
  if (!value) {
    return "n/a";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "n/a";
  }

  const pad = (n) => String(n).padStart(2, "0");
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

function renderSummary(summary) {
  const totalServes = safeNumber(summary.total_serves);
  const sfwServes = safeNumber(summary.sfw_serves);
  const nsfwServes = safeNumber(summary.nsfw_serves);

  statFields.total.textContent = totalServes.toLocaleString();
  statFields.sfw.textContent = sfwServes.toLocaleString();
  statFields.nsfw.textContent = nsfwServes.toLocaleString();
  statFields.sfwPct.textContent = `${safeNumber(summary.sfw_pct).toFixed(1)}%`;
  statFields.nsfwPct.textContent = `${safeNumber(summary.nsfw_pct).toFixed(1)}%`;
}

function renderTableBody(bodyElement, rows, fallbackText) {
  bodyElement.innerHTML = "";

  if (!Array.isArray(rows) || rows.length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `<td colspan="4" class="empty-state">${fallbackText}</td>`;
    bodyElement.appendChild(emptyRow);
    return;
  }

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.file_path ?? row.artist ?? "Unknown"}</td>
      <td>${safeNumber(row.serves).toLocaleString()}</td>
      <td>${safeNumber(row.sfw_serves).toLocaleString()}</td>
      <td>${safeNumber(row.nsfw_serves).toLocaleString()}</td>
    `;
    bodyElement.appendChild(tr);
  });
}

async function fetchSummary(hours) {
  setStatus("Loading image serve statistics...");

  try {
    const response = await fetch(`${apiBaseUrl}/api/statistics/image_serves?hours=${encodeURIComponent(hours)}`);

    if (!response.ok) {
      throw new Error(`Server responded ${response.status}`);
    }

    const summary = await response.json();
    renderSummary(summary ?? {});
    renderTableBody(topFilesBody, summary?.top_files ?? [], "No files found in the selected time range.");
    renderTableBody(topArtistsBody, summary?.top_artists ?? [], "No artists found in the selected time range.");
    (summary?.latest_served ?? []).forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.file_path ?? "Unknown"}</td>
        <td>${row.artist ?? "Unknown"}</td>
        <td>${row.rating === "nsfw" ? "NSFW" : "SFW"}</td>
        <td>${formatTimestamp(row.served_at)}</td>
      `;
      latestServedBody.appendChild(tr);
    });
    setStatus(`Loaded aggregate usage for the selected ${hours}-hour window.`);
  } catch (error) {
    console.error(error);
    renderSummary({});
    renderTableBody(topFilesBody, [], "Failed to load file statistics.");
    renderTableBody(topArtistsBody, [], "Failed to load artist statistics.");
    setStatus("Failed to load image serve statistics.", true);
  }
}

rangeSelect.addEventListener("change", () => {
  fetchSummary(rangeSelect.value);
});

fetchSummary(rangeSelect.value);
