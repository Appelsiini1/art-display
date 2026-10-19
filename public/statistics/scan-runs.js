const apiBaseUrl =
  window.location.protocol === "http:" || window.location.protocol === "https:"
    ? window.location.origin
    : "http://localhost:54560";

const rangeSelect = document.getElementById("range-select");
const statusMessage = document.getElementById("status-message");
const historyTableBody = document.getElementById("history-table-body");

const statFields = {
  runs: document.getElementById("stat-runs"),
  deleted: document.getElementById("stat-deleted"),
  processed: document.getElementById("stat-processed"),
  errors: document.getElementById("stat-errors"),
  nsfw: document.getElementById("stat-nsfw"),
  sfw: document.getElementById("stat-sfw"),
  duration: document.getElementById("stat-duration"),
};

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("status-error", isError);
}

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatDuration(ms) {
  if (ms === null || ms === undefined || Number.isNaN(Number(ms))) {
    return "n/a";
  }

  const totalSeconds = Math.max(0, Math.round(Number(ms) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
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

function renderSummary(rows) {
  const totalRuns = rows.length;
  const totalDeleted = rows.reduce((sum, row) => sum + safeNumber(row.display_deleted), 0);
  const totalProcessed = rows.reduce((sum, row) => sum + safeNumber(row.processed), 0);
  const totalErrors = rows.reduce((sum, row) => sum + safeNumber(row.errors), 0);
  const totalNsfw = rows.reduce((sum, row) => sum + safeNumber(row.nsfw_hits), 0);
  const totalSfw = rows.reduce((sum, row) => sum + safeNumber(row.sfw_hits), 0);
  const durations = rows
    .map((row) => safeNumber(row.duration_ms))
    .filter((value) => value > 0);
  const avgDuration =
    durations.length > 0
      ? durations.reduce((sum, value) => sum + value, 0) / durations.length
      : 0;

  statFields.runs.textContent = totalRuns.toLocaleString();
  statFields.deleted.textContent = totalDeleted.toLocaleString();
  statFields.processed.textContent = totalProcessed.toLocaleString();
  statFields.errors.textContent = totalErrors.toLocaleString();
  statFields.nsfw.textContent = totalNsfw.toLocaleString();
  statFields.sfw.textContent = totalSfw.toLocaleString();
  statFields.duration.textContent = formatDuration(avgDuration);
}

function renderHistory(rows) {
  historyTableBody.innerHTML = "";

  if (!Array.isArray(rows) || rows.length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = '<td colspan="8" class="empty-state">No scan runs found in the selected time range.</td>';
    historyTableBody.appendChild(emptyRow);
    return;
  }

  const sortedRows = [...rows].sort(
    (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
  );

  sortedRows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${formatTimestamp(row.started_at)}</td>
      <td>${formatTimestamp(row.finished_at)}</td>
      <td>${formatDuration(row.duration_ms)}</td>
      <td>${safeNumber(row.processed).toLocaleString()}</td>
      <td>${safeNumber(row.display_deleted).toLocaleString()}</td>
      <td>${safeNumber(row.nsfw_hits).toLocaleString()}</td>
      <td>${safeNumber(row.sfw_hits).toLocaleString()}</td>
      <td>${safeNumber(row.errors).toLocaleString()}</td>
    `;
    historyTableBody.appendChild(tr);
  });
}

async function fetchHistory(hours) {
  setStatus("Loading scan history...");

  try {
    const response = await fetch(`${apiBaseUrl}/api/statistics/run_history?hours=${encodeURIComponent(hours)}`);

    if (!response.ok) {
      throw new Error(`Server responded ${response.status}`);
    }

    const payload = await response.json();
    const rows = Array.isArray(payload) ? payload : [];

    renderSummary(rows);
    renderHistory(rows);
    setStatus(`Loaded ${rows.length} scan run${rows.length === 1 ? "" : "s"} for the selected window.`);
  } catch (error) {
    console.error(error);
    renderSummary([]);
    renderHistory([]);
    setStatus("Failed to load scan history.", true);
  }
}

rangeSelect.addEventListener("change", () => {
  fetchHistory(rangeSelect.value);
});

fetchHistory(rangeSelect.value);
