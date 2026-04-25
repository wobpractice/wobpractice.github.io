import PROMPTS_RAW from "../data/prompts.js";
import WORDS from "../data/words.js";
import { SN_PROMPTS } from "../data/sn.js";
import { loadStats, saveStats, loadStruggle, saveStruggle } from "./storage.js";

// ── Data ────────────────────────────────────────────────────────────────────
export const PROMPTS_LIST = Object.entries(PROMPTS_RAW);
export const WORD_SET = new Set(WORDS);

const LETTER_WEIGHTS = { q:2, j:2, z:1, x:1.5, k:0.6, v:0.35, w:0.25, y:0.05, g:0.05, f:0.05 };
const HYPO_WEIGHTS = { "-":1, "'":3 };

// Regen mode weights based on actual letter rarities
export const REGENMODE_WEIGHTS = {
  q: 8.0, j: 7.5, x: 6.5, z: 6.0, k: 4.0, v: 3.5, w: 3.0, y: 2.5, 
  b: 2.0, f: 1.8, g: 1.5, h: 1.3, m: 1.2, p: 1.1, c: 1.0, d: 0.9,
  u: 0.8, l: 0.7, r: 0.6, t: 0.5, n: 0.4, s: 0.3, o: 0.2, i: 0.15, 
  a: 0.1, e: 0.05
};

// ── Utility functions ────────────────────────────────────────────────────────
function rareScore(w) { 
  let s = 0; 
  for (const c of w) s += (LETTER_WEIGHTS[c] || 0); 
  return s; 
}

function hypoScore(w) { 
  let s = 0; 
  for (const c of w) s += (HYPO_WEIGHTS[c] || 0);  
  return s; 
}

export function sortWords(arr, type) {
  const a = [...arr], s = type || "random";
  if (s === "random" || s === "default") { 
    for (let i = a.length - 1; i > 0; i--) { 
      const j = Math.floor(Math.random() * (i + 1)); 
      [a[i], a[j]] = [a[j], a[i]]; 
    } 
  }
  else if (s === "alphabetical") { a.sort((x, y) => x < y ? -1 : 1); }
  else if (s === "lengthasc") { a.sort((x, y) => x.length - y.length); }
  else if (s === "lengthdesc") { a.sort((x, y) => y.length - x.length); }
  else if (s === "rare") { a.sort((x, y) => rareScore(y) - rareScore(x)); }
  else if (s === "hypo") { a.sort((x, y) => hypoScore(y) - hypoScore(x)); }
  return a;
}

export function wordsContaining(p) { 
  return WORDS.filter(w => w.toLowerCase().includes(p.toLowerCase())); 
}

export function esc(s) { 
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); 
}

export function hlWord(word, prompt) {
  const w = word.toLowerCase(), p = prompt.toLowerCase(), i = w.indexOf(p);
  if (i === -1) return esc(word);
  return esc(word.slice(0, i)) + `<span style="color:var(--t-acc);font-weight:500">${esc(word.slice(i, i + p.length))}</span>` + esc(word.slice(i + p.length));
}

export function validateWord(word) {
  return /^[A-Z'-]+$/.test(word) && WORD_SET.has(word);
}

// ── State management ───────────────────────────────────────────────────────────
let stats = loadStats();
let struggleData = loadStruggle();
let promptList = [], promptIndex = 0;
let currentPrompt = "", currentDiff = 0;
let startTime = Date.now(), sessionStart = Date.now();
let score = 0;
let currentMode = "normal";
let practiceQueue = [];
let autoSolvedThisPrompt = false;

export function getState() {
  return {
    stats, struggleData, promptList, promptIndex, currentPrompt, currentDiff,
    startTime, sessionStart, score, currentMode, practiceQueue, autoSolvedThisPrompt
  };
}

export function updateState(updates) {
  Object.assign(getState(), updates);
}

// ── Prompt list generation ───────────────────────────────────────────────────
export function generatePromptList(cfg) {
  const valid = PROMPTS_LIST.filter(([k, v]) => v >= cfg.min && v <= cfg.max);
  valid.sort((a, b) => b[1] - a[1] || (a[0].length - b[0].length));
  promptList = valid; 
  promptIndex = 0;
}

// ── Struggle scoring ─────────────────────────────────────────────────────────
export function getStruggleScore(key) {
  const d = struggleData[key]; 
  if (!d || !d.count) return 0;
  return Math.max(0, (d.totalTime / d.count) * 0.6 + (d.autoSolves / d.count) * 20);
}

// ── Prompt selection logic ────────────────────────────────────────────────────
export function getWeightedRandomPrompt(pool, cfg) {
  if (!cfg.weightsEnabled) {
    return pool[Math.floor(Math.random() * pool.length)];
  }
  
  const weighted = [];
  pool.forEach(entry => {
    const [prompt] = entry;
    let weight = 1;
    
    if (prompt.length === 2) {
      weight = cfg.weight2 !== undefined ? cfg.weight2 : 0.5;
    } else if (prompt.length === 3) {
      weight = cfg.weight3 !== undefined ? cfg.weight3 : 0.5;
    }
    
    const copies = Math.round(weight * 10);
    for (let i = 0; i < copies; i++) {
      weighted.push(entry);
    }
  });
  
  if (weighted.length === 0) {
    return pool[Math.floor(Math.random() * pool.length)];
  }
  
  return weighted[Math.floor(Math.random() * weighted.length)];
}

export function getNextPrompt(cfg) {
  if (currentMode === "all") {
    if (promptIndex >= promptList.length) generatePromptList(cfg);
    return promptList[promptIndex++];
  }
  
  // Handle other modes in modes.js
  const valid = PROMPTS_LIST.filter(([k, v]) => v >= cfg.min && v <= cfg.max);
  const pool = valid.length ? valid : PROMPTS_LIST;
  
  return getWeightedRandomPrompt(pool, cfg);
}

// ── Performance tracking ───────────────────────────────────────────────────────
export function recordPromptData() {
  if (!currentPrompt) return;
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  if (!struggleData[currentPrompt]) {
    struggleData[currentPrompt] = { count: 0, totalTime: 0, autoSolves: 0 };
  }
  struggleData[currentPrompt].count++;
  struggleData[currentPrompt].totalTime += elapsed;
  if (autoSolvedThisPrompt) struggleData[currentPrompt].autoSolves++;
  saveStruggle(struggleData);
}

export function updateScore() {
  stats.totalWords++; 
  saveStats(stats);
}

// ── Timer utilities ───────────────────────────────────────────────────────────
export function formatTime(s) {
  if (s < 60)   return s + "s";
  if (s < 3600) return Math.floor(s/60) + "m " + Math.floor(s%60) + "s";
  return Math.floor(s/3600) + "h " + Math.floor((s%3600)/60) + "m";
}

// ── Flash effects ─────────────────────────────────────────────────────────────
export function createFlashEffect() {
  const flashDiv = document.createElement("div");
  flashDiv.style.cssText = "position:fixed;inset:0;pointer-events:none;opacity:0;transition:opacity 0.2s;z-index:999;";
  document.body.appendChild(flashDiv);
  
  return {
    flash: (color = "var(--t-acc2)") => {
      flashDiv.style.background = color; 
      flashDiv.style.opacity = "1";
      setTimeout(() => flashDiv.style.opacity = "0", 220);
    }
  };
}

// ── Input utilities ───────────────────────────────────────────────────────────
export function createInputHandler(inputEl, previewEl, msgEl, currentPrompt, cfg) {
  const ALLOWED = /[^a-zA-Z\-']/g;
  let solveDebounced = false;
  
  const handlers = {
    onInput: null,
    onEnter: null,
    onSolve: null
  };
  
  inputEl.addEventListener("input", () => {
    const raw = inputEl.value, last = raw.slice(-1);
    if (last === "^" || last === "6") {
      if (!solveDebounced && handlers.onSolve) {
        handlers.onSolve();
      }
      solveDebounced = true; 
      setTimeout(() => solveDebounced = false, 300); 
      return;
    }
    const f = raw.replace(ALLOWED, "");
    if (f !== raw) inputEl.value = f;
    
    if (handlers.onInput) handlers.onInput(inputEl.value);
    
    // Update preview
    if (!inputEl.value) { 
      previewEl.innerHTML = ""; 
      return; 
    }
    const i = inputEl.value.toLowerCase().indexOf(currentPrompt.toLowerCase());
    if (i !== -1) {
      previewEl.innerHTML = hlWord(inputEl.value, currentPrompt);
      inputEl.classList.add("correct"); 
      inputEl.classList.remove("wrong");
    } else {
      previewEl.innerHTML = `<span style="color:var(--t-txt3)">${esc(inputEl.value.toLowerCase())}</span>`;
      inputEl.classList.remove("correct");
    }
    msgEl.textContent = "";
  });
  
  inputEl.addEventListener("keydown", e => {
    if (e.key === " ") {
      e.preventDefault();
      const start = inputEl.selectionStart;
      const end = inputEl.selectionEnd;
      const value = inputEl.value;
      inputEl.value = value.slice(0, start) + "-" + value.slice(end);
      inputEl.selectionStart = inputEl.selectionEnd = start + 1;
      if (handlers.onInput) handlers.onInput(inputEl.value);
    } else if (e.key === ".") {
      e.preventDefault();
      const start = inputEl.selectionStart;
      const end = inputEl.selectionEnd;
      const value = inputEl.value;
      inputEl.value = value.slice(0, start) + "'" + value.slice(end);
      inputEl.selectionStart = inputEl.selectionEnd = start + 1;
      if (handlers.onInput) handlers.onInput(inputEl.value);
    } else if (e.key === "Backspace" && e.ctrlKey) {
      e.preventDefault();
      inputEl.value = "";
      if (handlers.onInput) handlers.onInput(inputEl.value);
    }
  });
  
  inputEl.addEventListener("keydown", e => {
    if (e.key !== "Enter") return;
    const val = inputEl.value.trim().toLowerCase();
    if (!val) {
      if (!solveDebounced && handlers.onSolve) {
        handlers.onSolve();
      }
      solveDebounced = true; 
      setTimeout(() => solveDebounced = false, 300); 
      return;
    }
    
    if (handlers.onEnter) handlers.onEnter(val);
  });
  
  return {
    setHandlers: (newHandlers) => Object.assign(handlers, newHandlers),
    shake: () => {
      inputEl.classList.add("wrong"); 
      inputEl.value = ""; 
      previewEl.innerHTML = "";
      setTimeout(() => { 
        inputEl.classList.remove("wrong"); 
        msgEl.textContent = ""; 
      }, 700);
    }
  };
}
