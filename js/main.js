import { initThemes } from "./themes.js";
import { initTutorial } from "./tutorial.js";
import { PROMPTS_LIST, WORD_SET, sortWords, wordsContaining, esc, hlWord, validateWord, formatTime, CustomAlert, CustomConfirm } from "./utils/index.js";
import { MODE_LABELS, modeMap, validateModeStart, updateModeUI, getDifficultyDisplay } from "./modes.js";
import { generatePromptList, setMode, getNextPrompt, solveForPlayer, validateInput } from "./prompt-selection.js";
import { initRegen, updateRegenLetters, getRandomLetterForPrompt, setRegenRandomLetter, getRegenState } from "./regen-system.js";
import { getActiveWordlist, renderWordlists, setupWordlistHandlers, initWordlistManager } from "./wordlist-manager.js";
import { getState, updateState, recordPromptData, updateScore, getStruggleScore, setCurrentMode, setCurrentPrompt, setAutoSolvedThisPrompt } from "./state-management.js";
import { renderStats, renderFavs, createStarHandlers, updateStruggleInfo, createConfigHandlers, createModeHandlers, createFavoritesTabHandlers, createExportImportHandlers, createLookupHandlers, createBreakdownHandlers, createSidebarHandlers } from "./ui-handlers/index.js";
import { loadConfig, saveConfig, loadFavs, saveFavs, loadPriority, savePriority, loadStats } from "./storage.js";

// ── State ───────────────────────────────────────────────────────────────────────
let cfg = loadConfig();
let favorites = loadFavs();
let priority = loadPriority();
let currentPrompt = "";
let currentMode = "normal";
let sessionStart = Date.now();
let score = 0;
let flashEffect;

const promptWordEl = document.getElementById("prompt-word");
const inputEl = document.getElementById("input-box");
const timerEl = document.getElementById("timer");
const diffEl = document.getElementById("difficulty");
const scoreEl = document.getElementById("score");
const previewEl = document.getElementById("preview");
const msgEl = document.getElementById("msg");
const favBtn = document.getElementById("fav-btn");
const priBtn = document.getElementById("pri-btn");
const practiceBadge = document.getElementById("practice-badge");

// ── Core functions ─────────────────────────────────────────────────────────────
function solveForPlayerHandler() {
  setAutoSolvedThisPrompt(true);
  const regenState = getRegenState();
  const activeWordlist = getActiveWordlist();
  let word = solveForPlayer(currentPrompt, cfg, activeWordlist, regenState.regenRandomLetter, regenState.regenLetters, {});
  
  if (!word) {
    msgEl.textContent = "no words found";
    return;
  }
  
  inputEl.value = word;
  inputEl.classList.add("correct");
  updatePreview(word);
}

function updatePreview(text) {
  if (!text) { previewEl.innerHTML = ""; return; }
  const i = text.toLowerCase().indexOf(currentPrompt.toLowerCase());
  if (i !== -1) {
    previewEl.innerHTML = hlWord(text, currentPrompt);
    inputEl.classList.add("correct"); 
    inputEl.classList.remove("wrong");
  } else {
    previewEl.innerHTML = `<span style="color:var(--t-txt3)">${esc(text.toLowerCase())}</span>`;
    inputEl.classList.remove("correct");
  }
}

function resetPrompt() {
  recordPromptData();
  setAutoSolvedThisPrompt(false);
  
  const entry = getNextPrompt(cfg, favorites, priority, getState().struggleData);
  currentPrompt = entry[0];
  const currentDiff = entry[1];
  setCurrentPrompt(currentPrompt, currentDiff);
  
  const isSelf = WORD_SET.has(currentPrompt.toUpperCase());
  
  if (currentMode === "regen-random") {
    const randomLetter = getRandomLetterForPrompt(currentPrompt);
    setRegenRandomLetter(randomLetter);
    promptWordEl.textContent = randomLetter ? `${currentPrompt} + ${randomLetter}` : currentPrompt;
    if (!randomLetter) setRegenRandomLetter(null);
  } else {
    promptWordEl.textContent = currentPrompt;
    setRegenRandomLetter(null);
  }
  
  promptWordEl.style.color = isSelf ? "var(--t-acc)" : "var(--t-txt)";
  diffEl.textContent = getDifficultyDisplay(currentMode, currentDiff, currentPrompt);
  
  inputEl.value = "";
  inputEl.className = "ti";
  previewEl.innerHTML = "";
  msgEl.textContent = "";
  
  updateStarBtns();
  inputEl.focus();
}

function shake() {
  inputEl.classList.add("wrong");
  inputEl.value = "";
  previewEl.innerHTML = "";
  setTimeout(() => { inputEl.classList.remove("wrong"); msgEl.textContent = ""; }, 700);
}

// ── Mode activation ───────────────────────────────────────────────────────────
export function activateMode(mode) {
  currentMode = mode;
  setCurrentMode(mode);
  updateState({ practiceQueue: [] });
  
  if (mode === "all") generatePromptList(cfg);
  
  setMode(mode);
  
  const modeUI = updateModeUI(mode, practiceBadge, scoreEl, document.getElementById("regen-bar"));
  
  if (modeUI.needsRegenInit) {
    initRegen(modeUI.startingHearts);
  } else {
    document.getElementById("regen-bar").style.display = "none";
  }
  score = 0;
  scoreEl.textContent = 0;
  
  document.querySelectorAll(".mode-card").forEach(c => c.classList.remove("active-mode"));
  const cardId = Object.entries(modeMap).find(([_, m]) => m === mode)?.[0];
  if (cardId) document.getElementById(cardId)?.classList.add("active-mode");
  
  switchTab("game");
  currentPrompt = "";
  resetPrompt();
}

// ── Tab switching ───────────────────────────────────────────────────────────────
export function switchTab(name) {
  document.querySelectorAll(".ni").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelector(`.ni[data-tab="${name}"]`)?.classList.add("active");
  document.getElementById(`tab-${name}`)?.classList.add("active");
  
  if (name === "game") inputEl.focus();
  if (name === "stats") renderStats(sessionStart);
  if (name === "favorites") renderFavs(favorites, priority);
  if (name === "modes") updateStruggleInfo(getStruggleScore);
  if (name === "wordlists") renderWordlists();
}

// ── Star button management ───────────────────────────────────────────────────────
let starHandlers;

function updateStarBtns() {
  if (starHandlers) {
    favBtn.dataset.currentPrompt = currentPrompt;
    priBtn.dataset.currentPrompt = currentPrompt;
    starHandlers.updateStarBtns(currentPrompt);
  }
}

// ── Event handlers ─────────────────────────────────────────────────────────────
function setupEventHandlers() {
  // Setup star handlers
  starHandlers = createStarHandlers(favBtn, priBtn, favorites, priority);
  
  // Setup other UI handlers
  createConfigHandlers(cfg, generatePromptList);
  createModeHandlers(modeMap, validateModeStart, activateMode, () => updateStruggleInfo(getStruggleScore));
  createFavoritesTabHandlers(activateMode);
  createExportImportHandlers(sessionStart);
  createLookupHandlers(cfg, wordsContaining, sortWords, {});
  createBreakdownHandlers(PROMPTS_LIST);
  createSidebarHandlers(switchTab);
  
  // Input handling
  const ALLOWED = /[^a-zA-Z\-']/g;
  let solveDebounced = false;
  
  inputEl.addEventListener("input", () => {
    const raw = inputEl.value, last = raw.slice(-1);
    if (last === "^" || last === "6") {
      if (!solveDebounced) solveForPlayerHandler();
      solveDebounced = true; 
      setTimeout(() => solveDebounced = false, 300); 
      return;
    }
    const f = raw.replace(ALLOWED, "");
    if (f !== raw) inputEl.value = f;
    updatePreview(inputEl.value);
    msgEl.textContent = "";
  });
  
  inputEl.addEventListener("keydown", e => {
    if (e.key === " ") {
      e.preventDefault();
      const start = inputEl.selectionStart, end = inputEl.selectionEnd, value = inputEl.value;
      inputEl.value = value.slice(0, start) + "-" + value.slice(end);
      inputEl.selectionStart = inputEl.selectionEnd = start + 1;
      updatePreview(inputEl.value);
    } else if (e.key === ".") {
      e.preventDefault();
      const start = inputEl.selectionStart, end = inputEl.selectionEnd, value = inputEl.value;
      inputEl.value = value.slice(0, start) + "'" + value.slice(end);
      inputEl.selectionStart = inputEl.selectionEnd = start + 1;
      updatePreview(inputEl.value);
    } else if (e.key === "Backspace" && e.ctrlKey) {
      e.preventDefault();
      inputEl.value = "";
      updatePreview(inputEl.value);
    }
  });
  
  inputEl.addEventListener("keydown", e => {
    if (e.key !== "Enter") return;
    const val = inputEl.value.trim().toLowerCase();
    if (!val) {
      if (!solveDebounced) solveForPlayerHandler();
      solveDebounced = true; 
      setTimeout(() => solveDebounced = false, 300); 
      return;
    }
    
    const regenState = getRegenState();
    const validation = validateInput(currentMode, val, currentPrompt, WORD_SET, regenState.regenRandomLetter);
    if (!validation.valid) {
      msgEl.textContent = validation.message;
      shake();
      return;
    }
    
    if (currentMode === "regen-regular" || currentMode === "regen-ranked") {
      const result = updateRegenLetters(val);
      if (result.levelUp) scoreEl.textContent = result.newHearts;
    } else {
      score++;
      scoreEl.textContent = score;
    }
    
    updateScore();
    flashEffect.flash();
    resetPrompt();
  });
}

// ── Initialization ─────────────────────────────────────────────────────────────
function initializeApp() {
  initThemes();
  initTutorial();
  initRegen();
  initWordlistManager();
  
  const flashDiv = document.createElement("div");
  flashDiv.style.cssText = "position:fixed;inset:0;pointer-events:none;opacity:0;transition:opacity 0.2s;z-index:999;";
  document.body.appendChild(flashDiv);
  flashEffect = {
    flash: (color = "var(--t-acc2)") => {
      flashDiv.style.background = color; 
      flashDiv.style.opacity = "1";
      setTimeout(() => flashDiv.style.opacity = "0", 220);
    }
  };
  
  setupEventHandlers();
  
  favBtn.dataset.currentPrompt = "";
  priBtn.dataset.currentPrompt = "";
  
  document.getElementById("cfg-min").value = cfg.min;
  document.getElementById("cfg-max").value = cfg.max;
  document.getElementById("cfg-sort").value = cfg.sort;
  document.getElementById("cfg-weight-2").value = cfg.weight2 !== undefined ? cfg.weight2 : 0.5;
  document.getElementById("cfg-weight-3").value = cfg.weight3 !== undefined ? cfg.weight3 : 0.5;
  document.getElementById("weight-2-value").textContent = (cfg.weight2 !== undefined ? cfg.weight2 : 0.5).toFixed(1);
  document.getElementById("weight-3-value").textContent = (cfg.weight3 !== undefined ? cfg.weight3 : 0.5).toFixed(1);
  document.getElementById("cfg-weights-enabled").checked = cfg.weightsEnabled !== undefined ? cfg.weightsEnabled : false;
  
  generatePromptList(cfg);
  
  setInterval(() => timerEl.textContent = Math.floor((Date.now() - getState().startTime) / 1000) + "s", 500);
  
  setInterval(() => {
    const base = loadStats().totalSeconds;
    const sess = Math.floor((Date.now() - sessionStart) / 1000);
    document.getElementById("stat-time").textContent = formatTime(base + sess);
  }, 1000);
  
  renderStats(sessionStart);
  renderFavs(favorites, priority);
  resetPrompt();
}

initializeApp();