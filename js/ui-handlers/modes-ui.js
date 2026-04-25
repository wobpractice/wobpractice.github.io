export function createModeHandlers(modeMap, validateModeStart, activateMode, updateStruggleInfo) {
  Object.entries(modeMap).forEach(([id, mode]) => {
    document.getElementById(id).addEventListener("click", async () => {
      const { loadFavs, loadPriority } = await import("../storage.js");
      const favorites = loadFavs();
      const priority = loadPriority();
      
      const validation = validateModeStart(mode, favorites, priority);
      if (!validation.valid) {
        const { CustomAlert } = await import("../utils/popup.js");
        await CustomAlert(validation.message, "Cannot Start");
        return;
      }
      
      activateMode(mode);
      if (mode === "struggle") updateStruggleInfo();
    });
  });

  document.getElementById("clear-struggle-btn").addEventListener("click", async () => {
    const { CustomConfirm } = await import("../utils/popup.js");
    if (!await CustomConfirm("clear all struggle data?", "Are you sure?")) return;
    
    const { loadStruggle, clearStruggle } = await import("../storage.js");
    const struggleData = loadStruggle();
    struggleData = {}; 
    clearStruggle(); 
    updateStruggleInfo();
  });
}

export function createFavoritesTabHandlers(activateMode) {
  document.getElementById("fav-practice-btn").addEventListener("click", () => {
    const { loadFavs } = require("../storage.js");
    const favorites = loadFavs();
    if (!favorites.size) { 
      document.getElementById("fav-practice-msg").textContent = "add some favorites first!"; 
      return; 
    }
    activateMode("fav-rand");
  });

  document.getElementById("fav-practice-seq-btn").addEventListener("click", () => {
    const { loadFavs } = require("../storage.js");
    const favorites = loadFavs();
    if (!favorites.size) { 
      document.getElementById("fav-practice-msg").textContent = "add some favorites first!"; 
      return; 
    }
    activateMode("fav-seq");
  });
}
