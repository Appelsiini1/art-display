const apiBaseUrl =
  window.location.protocol === "http:" || window.location.protocol === "https:"
    ? window.location.origin
    : "http://localhost:54560";

const statusMessage = document.getElementById("status-message");
const topArtistsBody = document.getElementById("top-artists-body");
const topNsfwArtistsBody = document.getElementById("top-nsfw-artists-body");
const topSfwArtistsBody = document.getElementById("top-sfw-artists-body");

const statFields = {
  totalFiles: document.getElementById("stat-total-files"),
  totalArtists: document.getElementById("stat-total-artists"),
  sfwFiles: document.getElementById("stat-sfw-files"),
  nsfwFiles: document.getElementById("stat-nsfw-files"),
  sfwPct: document.getElementById("stat-sfw-pct"),
  nsfwPct: document.getElementById("stat-nsfw-pct"),
  avgFiles: document.getElementById("stat-avg-files"),
  medianFiles: document.getElementById("stat-median-files"),
  top10ArtistsShare: document.getElementById("stat-top-10-artists-share"),
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
  const concentrationRatio = safeNumber(summary.concentration_ratio);
  const top10ArtistsSharePct = safeNumber(summary.top_10_artists_share_pct);

  statFields.totalFiles.textContent = totalFiles.toLocaleString();
  statFields.totalArtists.textContent = totalArtists.toLocaleString();
  statFields.sfwFiles.textContent = sfwFiles.toLocaleString();
  statFields.nsfwFiles.textContent = nsfwFiles.toLocaleString();
  statFields.sfwPct.textContent = `${safeNumber(summary.sfw_pct).toFixed(2)}%`;
  statFields.nsfwPct.textContent = `${safeNumber(summary.nsfw_pct).toFixed(2)}%`;
  statFields.avgFiles.textContent = safeNumber(summary.avg_files_per_artist).toFixed(2);
  statFields.medianFiles.textContent = safeNumber(summary.median_files_per_artist).toFixed(2);
  statFields.top10ArtistsShare.textContent = `${top10ArtistsSharePct.toFixed(2)}%`;
  statFields.concentrationRatio.textContent = concentrationRatio.toFixed(2);
  statFields.concentrationRatio.title = `Largest artist count ÷ average files per artist. Higher values mean the catalog is more concentrated in a smaller set of artists. Current value: ${concentrationRatio.toFixed(2)}.`;
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

function renderRankedArtists(rows, body, { valueKey, shareKey, emptyText }) {
  body.innerHTML = "";

  if (!Array.isArray(rows) || rows.length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `<td colspan="3" class="empty-state">${emptyText}</td>`;
    body.appendChild(emptyRow);
    return;
  }

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.artist ?? "Unknown"}</td>
      <td>${safeNumber(row[valueKey]).toLocaleString()}</td>
      <td>${safeNumber(row[shareKey]).toFixed(2)}%</td>
    `;
    body.appendChild(tr);
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
    renderRankedArtists(summary?.top_nsfw_artists ?? [], topNsfwArtistsBody, {
      valueKey: "nsfw_files",
      shareKey: "share_pct",
      emptyText: "No NSFW-heavy artists available in the current catalog.",
    });
    renderRankedArtists(summary?.top_sfw_artists ?? [], topSfwArtistsBody, {
      valueKey: "sfw_files",
      shareKey: "share_pct",
      emptyText: "No SFW-heavy artists available in the current catalog.",
    });
    setStatus("Loaded current catalog snapshot.");
  } catch (error) {
    console.error(error);
    renderSummary({});
    renderTopArtists([]);
    renderRankedArtists([], topNsfwArtistsBody, {
      valueKey: "nsfw_files",
      shareKey: "share_pct",
      emptyText: "No NSFW-heavy artists available in the current catalog.",
    });
    renderRankedArtists([], topSfwArtistsBody, {
      valueKey: "sfw_files",
      shareKey: "share_pct",
      emptyText: "No SFW-heavy artists available in the current catalog.",
    });
    setStatus("Failed to load current catalog statistics.", true);
  }
}

fetchSummary();
