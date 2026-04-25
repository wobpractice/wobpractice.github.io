import { loadFavs, saveFavs, loadPriority, savePriority } from "../storage.js";
import { esc } from "../utils/text-utils.js";

export function renderFavs(favorites, priority) {
  const el = document.getElementById("fav-list");
  const priEl = document.getElementById("pri-list");
  
  if (!favorites.size) {
    el.innerHTML = '<span style="font-size:13px;color:var(--t-txt3);">star a prompt during the game to save it here</span>';
    priEl.innerHTML = '<span style="font-size:13px;color:var(--t-txt3);">use the ✦ button on a favorited prompt to mark it as priority</span>';
    return;
  }
  
  el.innerHTML = "";
  [...favorites].sort().forEach(p => {
    const isPri = priority.has(p);
    const pill = document.createElement("div");
    pill.className = isPri ? "pri-pill" : "fav-pill";
    pill.innerHTML = `${isPri ? "✦ " : ""}${esc(p)}<span class="fav-rm">✕</span>`;
    pill.addEventListener("click", () => {
      favorites.delete(p); 
      priority.delete(p);
      saveFavs(favorites); 
      savePriority(priority); 
      renderFavs(favorites, priority);
    });
    el.appendChild(pill);
  });
  
  priEl.innerHTML = "";
  const priItems = [...priority].filter(p => favorites.has(p)).sort();
  if (!priItems.length) {
    priEl.innerHTML = '<span style="font-size:13px;color:var(--t-txt3);">no priority prompts yet</span>';
    return;
  }
  priItems.forEach(p => {
    const pill = document.createElement("div");
    pill.className = "pri-pill";
    pill.innerHTML = `✦ ${esc(p)}<span class="fav-rm">✕</span>`;
    pill.addEventListener("click", () => { 
      priority.delete(p); 
      savePriority(priority); 
      renderFavs(favorites, priority);
    });
    priEl.appendChild(pill);
  });
}

export function createStarHandlers(favBtn, priBtn, favorites, priority) {
  function updateStarBtns(currentPrompt) {
    const on = favorites.has(currentPrompt);
    favBtn.className = on ? "on" : "off";
    favBtn.title = on ? "unfavorite this prompt" : "favorite this prompt";
    const pon = priority.has(currentPrompt);
    priBtn.className = pon ? "on" : "off";
    priBtn.title = pon ? "remove priority" : "mark as priority";
    priBtn.style.display = on ? "" : "none";
  }

  favBtn.addEventListener("click", () => {
    const currentPrompt = favBtn.dataset.currentPrompt;
    if (favorites.has(currentPrompt)) { 
      favorites.delete(currentPrompt); 
      priority.delete(currentPrompt); 
      savePriority(priority); 
    } else {
      favorites.add(currentPrompt);
    }
    saveFavs(favorites); 
    updateStarBtns(currentPrompt); 
    renderFavs(favorites, priority);
  });

  priBtn.addEventListener("click", () => {
    const currentPrompt = priBtn.dataset.currentPrompt;
    if (!favorites.has(currentPrompt)) return;
    if (priority.has(currentPrompt)) {
      priority.delete(currentPrompt);
    } else {
      priority.add(currentPrompt);
    }
    savePriority(priority); 
    updateStarBtns(currentPrompt); 
    renderFavs(favorites, priority);
  });

  return { updateStarBtns };
}
