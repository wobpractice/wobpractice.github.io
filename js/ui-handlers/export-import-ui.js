import { loadFavs, saveFavs, loadPriority, savePriority, loadStats, saveStats, loadStruggle, saveStruggle } from "../storage.js";

function tmp(id, msg, t = 2200) { 
  const el = document.getElementById(id); 
  el.textContent = msg; 
  setTimeout(() => el.textContent = "", t); 
}

export function createExportImportHandlers(sessionStart) {
  document.getElementById("fav-export").addEventListener("click", () => {
    const favorites = loadFavs();
    const priority = loadPriority();
    const blob = new Blob([JSON.stringify({ favorites: [...favorites], priority: [...priority] }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "wordbomb_favorites.json";
    a.click();
    tmp("fav-io-msg", "exported!");
  });

  document.getElementById("fav-import-btn").addEventListener("click", () => {
    document.getElementById("fav-import-file").click();
  });

  document.getElementById("fav-import-file").addEventListener("change", e => {
    const file = e.target.files[0]; 
    if (!file) return;
    const r = new FileReader();
    r.onload = ev => {
      try {
        const d = JSON.parse(ev.target.result);
        const favorites = loadFavs();
        const priority = loadPriority();
        
        if (d.favorites && Array.isArray(d.favorites)) { 
          d.favorites.forEach(p => favorites.add(p)); 
          saveFavs(favorites); 
        }
        if (d.priority && Array.isArray(d.priority)) { 
          d.priority.forEach(p => priority.add(p));   
          savePriority(priority); 
        }
        
        const { renderFavs } = require("./favorites-ui.js");
        renderFavs(favorites, priority);
        tmp("fav-io-msg", "imported!");
      } catch { 
        tmp("fav-io-msg", "invalid file"); 
      }
    };
    r.readAsText(file); 
    e.target.value = "";
  });

  document.getElementById("stats-export").addEventListener("click", () => {
    const base = loadStats();
    const out = { totalWords: base.totalWords, totalSeconds: base.totalSeconds + Math.floor((Date.now() - sessionStart) / 1000) };
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "wordbomb_stats.json";
    a.click();
    tmp("stats-io-msg", "exported!");
  });

  document.getElementById("stats-import-btn").addEventListener("click", () => {
    document.getElementById("stats-import-file").click();
  });

  document.getElementById("stats-import-file").addEventListener("change", e => {
    const file = e.target.files[0]; 
    if (!file) return;
    const r = new FileReader();
    r.onload = ev => {
      try {
        const d = JSON.parse(ev.target.result);
        const stats = loadStats();
        
        if (typeof d.totalWords === "number") stats.totalWords = d.totalWords;
        if (typeof d.totalSeconds === "number") stats.totalSeconds = d.totalSeconds;
        
        saveStats(stats);
        const { renderStats } = require("./stats-ui.js");
        renderStats(new Date());
        tmp("stats-io-msg", "restored!");
      } catch { 
        tmp("stats-io-msg", "invalid file"); 
      }
    };
    r.readAsText(file); 
    e.target.value = "";
  });

  document.getElementById("stats-reset").addEventListener("click", async () => {
    const { CustomConfirm } = await import("../utils/popup.js");
    if (!await CustomConfirm("reset all stats?", "Are you sure?")) return;
    
    const stats = { totalWords: 0, totalSeconds: 0 };
    const struggleData = {};
    
    saveStats(stats);
    saveStruggle(struggleData);
    const { renderStats } = require("./stats-ui.js");
    renderStats(new Date());
  });
}
