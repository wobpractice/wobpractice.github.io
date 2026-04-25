import { PROMPTS_LIST, SN_PROMPTS, sortWords, wordsContaining } from "./utils/index.js";
import { loadConfig } from "./storage.js";

// ── Mode configuration ───────────────────────────────────────────────────────────
export const MODE_LABELS = {
  normal:    null,
  all:       "all prompts - sequential",
  "fav-rand":"* favorites - random",
  "fav-seq": "-> favorites - sequential",
  priority:  "* priority prompts only",
  struggle:  " struggle mode",
  "regen-random": " regen random letter",
  "regen-regular": " regen regular",
  "regen-ranked": " regen ranked",
  sn:        " sn mode",
};

export const modeMap = {
  "mode-normal":   "normal",
  "mode-all":      "all",
  "mode-fav-rand": "fav-rand",
  "mode-fav-seq":  "fav-seq",
  "mode-priority": "priority",
  "mode-struggle": "struggle",
  "mode-regen-random": "regen-random",
  "mode-regen-regular": "regen-regular",
  "mode-regen-ranked": "regen-ranked",
  "mode-sn":       "sn",
};

// ── Mode validation ─────────────────────────────────────────────────────────────
export function validateModeStart(mode, favorites, priority) {
  if (mode === "fav-rand" || mode === "fav-seq") {
    if (!favorites.size) {
      return { valid: false, message: "add some favorites first!" };
    }
  }
  
  if (mode === "priority") {
    if (![...priority].some(p => favorites.has(p))) {
      return { valid: false, message: "mark some prompts as priority first!" };
    }
  }
  
  return { valid: true };
}

// ── Mode UI updates ───────────────────────────────────────────────────────────
export function updateModeUI(mode, practiceBadge, scoreEl, regenBarEl) {
  const label = MODE_LABELS[mode];
  if (label) { 
    practiceBadge.textContent = label; 
    practiceBadge.classList.add("show"); 
  } else {        
    practiceBadge.classList.remove("show"); 
  }
  
  if (mode === "regen-regular" || mode === "regen-ranked") {
    if (regenBarEl) regenBarEl.style.display = "block";
    return { needsRegenInit: true, startingHearts: mode === "regen-ranked" ? 3 : 1 };
  } else {
    if (regenBarEl) regenBarEl.style.display = "none";
    scoreEl.textContent = "0";
    return { needsRegenInit: false };
  }
}

// ── Difficulty display ─────────────────────────────────────────────────────────
export function getDifficultyDisplay(mode, currentDiff, currentPrompt) {
  if (mode === "sn") {
    const snEntry = SN_PROMPTS.find(([prompt, count]) => prompt === currentPrompt);
    const solutionCount = snEntry ? snEntry[1] : wordsContaining(currentPrompt).length;
    return `Sub ${solutionCount}`;
  } else {
    return currentDiff + "%";
  }
}
