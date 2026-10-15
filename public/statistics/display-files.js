const apiBaseUrl =
  window.location.protocol === "http:" || window.location.protocol === "https:"
    ? window.location.origin
    : "http://localhost:54560";

const statusMessage = document.getElementById("status-message");
const topArtistsBody = document.getElementById("top-artists-body");

const statFields = {
  totalFiles: document.getElementById("stat-total-files"),
  totalArtists: document.getElementById("stat-total-artists"),
  sfwFiles: document.getElementById("stat-sfw-files"),
  nsfwFiles: document.getElementById("stat-nsfw-files"),
  sfwPct: document.getElementById("stat-sfw-pct"),
  nsfwPct: document.getElementById("stat-nsfw-pct"),
  avgFiles: document.getElementById("stat-avg-files"),
  medianFiles: document.getElementById("stat-median-files"),
  concentrationRatio: document.getElementById("stat-concentration-ratio"),
};

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("status-error", isError);
}

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function renderSummary(summary) {
  const totalFiles = safeNumber(summary.total_files);
  const totalArtists = safeNumber(summary.total_artists);
  const sfwFiles = safeNumber(summary.sfw_files);
  const nsfwFiles = safeNumber(summary.nsfw_files);

  statFields.totalFiles.textContent = totalFiles.toLocaleString();
  statFields.totalArtists.textContent = totalArtists.toLocaleString();
  statFields.sfwFiles.textContent = sfwFiles.toLocaleString();
  statFields.nsfwFiles.textContent = nsfwFiles.toLocaleString();
  statFields.sfwPct.textContent = `${safeNumber(summary.sfw_pct).toFixed(2)}%`;
  statFields.nsfwPct.textContent = `${safeNumber(summary.nsfw_pct).toFixed(2)}%`;
  statFields.avgFiles.textContent = safeNumber(summary.avg_files_per_artist).toFixed(2);
  statFields.medianFiles.textContent = safeNumber(summary.median_files_per_artist).toFixed(2);
  statFields.concentrationRatio.textContent = safeNumber(summary.concentration_ratio).toFixed(2);
}

function renderTopArtists(rows) {
  topArtistsBody.innerHTML = "";

  if (!Array.isArray(rows) || rows.length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = '<td colspan="5" class="empty-state">No artist data available in the current catalog.</td>';
    topArtistsBody.appendChild(emptyRow);
    return;
  }

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.artist ?? "Unknown"}</td>
      <td>${safeNumber(row.total_files).toLocaleString()}</td>
      <td>${safeNumber(row.sfw_files).toLocaleString()}</td>
      <td>${safeNumber(row.nsfw_files).toLocaleString()}</td>
      <td>${safeNumber(row.share_pct).toFixed(2)}%</td>
    `;
    topArtistsBody.appendChild(tr);
  });
}

async function fetchSummary() {
  setStatus("Loading current catalog statistics...");

  try {
    const response = await fetch(`${apiBaseUrl}/api/statistics/display_files`);

    if (!response.ok) {
      throw new Error(`Server responded ${response.status}`);
    }

    const summary = await response.json();
    renderSummary(summary ?? {});
    renderTopArtists(summary?.top_artists ?? []);
    setStatus("Loaded current catalog snapshot.");
  } catch (error) {
    console.error(error);
    renderSummary({});
    renderTopArtists([]);
    setStatus("Failed to load current catalog statistics.", true);
  }
}

fetchSummary();
