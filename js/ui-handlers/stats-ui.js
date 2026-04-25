import { loadStats } from "../storage.js";
import { formatTime } from "../utils/text-utils.js";

export function renderStats(sessionStart) {
  const base = loadStats();
  document.getElementById("stat-words").textContent = base.totalWords;
  document.getElementById("stat-time").textContent = formatTime(base.totalSeconds + Math.floor((Date.now() - sessionStart) / 1000));
}

export function renderStatsQuiet() {
  document.getElementById("stat-words").textContent = loadStats().totalWords;
}
