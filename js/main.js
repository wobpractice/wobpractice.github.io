import PROMPTS_RAW from "../data/prompts.js";
import WORDS from "../data/words.js";
import { SN_PROMPTS } from "../data/sn.js";
import { initThemes }   from "./themes.js";
import { initTutorial } from "./tutorial.js";
import { 
  loadStats, saveStats,
  loadFavs, saveFavs,
  loadPriority, savePriority,
  loadStruggle, saveStruggle, clearStruggle,
  loadWordlists, saveWordlists,
  loadActiveWordlist, saveActiveWordlist,
  loadConfig, saveConfig
} from "./storage.js";

// ── Data ────────────────────────────────────────────────────────────────────
export const PROMPTS_LIST = Object.entries(PROMPTS_RAW);
export const WORD_SET     = new Set(WORDS);

const LETTER_WEIGHTS = { q:2, j:2, z:1, x:1.5, k:0.6, v:0.35, w:0.25, y:0.05, g:0.05, f:0.05 };
const HYPO_WEIGHTS   = { "-":1, "'":3 };

// Regen mode weights based on actual letter rarities
const REGENMODE_WEIGHTS = {
  q: 8.0, j: 7.5, x: 6.5, z: 6.0, k: 4.0, v: 3.5, w: 3.0, y: 2.5, 
  b: 2.0, f: 1.8, g: 1.5, h: 1.3, m: 1.2, p: 1.1, c: 1.0, d: 0.9,
  u: 0.8, l: 0.7, r: 0.6, t: 0.5, n: 0.4, s: 0.3, o: 0.2, i: 0.15, 
  a: 0.1, e: 0.05
};
function rareScore(w) { let s=0; for (const c of w) s += (LETTER_WEIGHTS[c]||0); return s; }
function hypoScore(w)  { let s=0; for (const c of w) s += (HYPO_WEIGHTS[c]||0);  return s; }

export function sortWords(arr, type) {
  const a = [...arr], s = type || "random";
  if (s==="random"||s==="default") { for (let i=a.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } }
  else if (s==="alphabetical") { a.sort((x,y) => x<y?-1:1); }
  else if (s==="lengthasc")    { a.sort((x,y) => x.length-y.length); }
  else if (s==="lengthdesc")   { a.sort((x,y) => y.length-x.length); }
  else if (s==="rare")         { a.sort((x,y) => rareScore(y)-rareScore(x)); }
  else if (s==="hypo")         { a.sort((x,y) => hypoScore(y)-hypoScore(x)); }
  return a;
}
export function wordsContaining(p) { return WORDS.filter(w => w.toLowerCase().includes(p.toLowerCase())); }
export function esc(s) { return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
export function hlWord(word, prompt) {
  const w=word.toLowerCase(), p=prompt.toLowerCase(), i=w.indexOf(p);
  if (i===-1) return esc(word);
  return esc(word.slice(0,i)) + `<span style="color:var(--t-acc);font-weight:500">${esc(word.slice(i,i+p.length))}</span>` + esc(word.slice(i+p.length));
}

// ── State ───────────────────────────────────────────────────────────────────
let stats        = loadStats();
let favorites    = loadFavs();
let priority     = loadPriority();
let struggleData = loadStruggle();
let cfg          = loadConfig();
let promptList   = [], promptIndex = 0;
let currentPrompt = "", currentDiff = 0;
let startTime = Date.now(), sessionStart = Date.now();
let score = 0;
let currentMode = "normal";
let practiceQueue = [];
let autoSolvedThisPrompt = false;
let wordlists = loadWordlists();
let activeWordlistId = loadActiveWordlist();

// Regen state
let regenLetters = {};
let regenHearts = 0;
let regenRandomLetter = null;
let regenStartingCount = 1;

// ── DOM refs ─────────────────────────────────────────────────────────────────
const promptWordEl  = document.getElementById("prompt-word");
const inputEl       = document.getElementById("input-box");
const timerEl       = document.getElementById("timer");
const diffEl        = document.getElementById("difficulty");
const scoreEl       = document.getElementById("score");
const previewEl     = document.getElementById("preview");
const msgEl         = document.getElementById("msg");
const favBtn        = document.getElementById("fav-btn");
const priBtn        = document.getElementById("pri-btn");
const practiceBadge = document.getElementById("practice-badge");

// Wordlists
function createDefaultWordlists() {
  const defaults = {
    fish: {
      id: 'fish',
      title: 'Fish',
      desc: 'All words containing "fish"',
      words: wordsContaining('fish'),
      fixed: true
    },
    wood: {
      id: 'wood', 
      title: 'Wood',
      desc: 'All words containing "wood"',
      words: wordsContaining('wood'),
      fixed: true
    },
    super: {
      id: 'super',
      title: 'Super', 
      desc: 'All words containing "super"',
      words: wordsContaining('super'),
      fixed: true
    },
    hyper: {
      id: 'hyper',
      title: 'Hyper',
      desc: 'All words containing "hyper"', 
      words: wordsContaining('hyper'),
      fixed: true
    },
    man: {
      id: 'man',
      title: 'Man',
      desc: 'All words containing "man"',
      words: wordsContaining('man'),
      fixed: true
    }
  };
  
  let updated = false;
  for (const [key, wordlist] of Object.entries(defaults)) {
    if (!wordlists[key]) {
      wordlists[key] = wordlist;
      updated = true;
    }
  }
  
  if (updated) {
    saveWordlists(wordlists);
  }
}

function validateWord(word) {
  return /^[A-Z'-]+$/.test(word) && WORD_SET.has(word);
}

function getActiveWordlist() {
  return activeWordlistId && wordlists[activeWordlistId] ? wordlists[activeWordlistId] : null;
}

function setActiveWordlist(id) {
  if (id && wordlists[id]) {
    activeWordlistId = id;
    saveActiveWordlist(id);
  } else {
    activeWordlistId = null;
    saveActiveWordlist(null);
  }
  renderWordlists();
}

// ── Mode labels ──────────────────────────────────────────────────────────────
const MODE_LABELS = {
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

// ── Prompt list generation ───────────────────────────────────────────────────
export function generatePromptList() {
  const valid = PROMPTS_LIST.filter(([k,v]) => v >= cfg.min && v <= cfg.max);
  valid.sort((a,b) => b[1]-a[1] || (a[0].length-b[0].length));
  promptList = valid; promptIndex = 0;
}

// ── Struggle scoring ─────────────────────────────────────────────────────────
function getStruggleScore(key) {
  const d = struggleData[key]; if (!d||!d.count) return 0;
  return Math.max(0, (d.totalTime/d.count)*0.6 + (d.autoSolves/d.count)*20);
}

// ── Next prompt selection ────────────────────────────────────────────────────
function getNextPrompt() {
  if (currentMode === "all") {
    if (promptIndex >= promptList.length) generatePromptList();
    return promptList[promptIndex++];
  }
  if (currentMode === "fav-rand" || currentMode === "fav-seq") {
    if (!practiceQueue.length) {
      const favArr = [...favorites];
      if (!favArr.length) { activateMode("normal"); return getWeightedRandomPrompt(PROMPTS_LIST); }
      if (currentMode === "fav-seq") {
        practiceQueue = [...favArr].sort();
      } else {
        const priArr = [...priority].filter(p => favorites.has(p));
        const weighted = [...favArr];
        priArr.forEach(p => { weighted.push(p); weighted.push(p); });
        for (let i=weighted.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [weighted[i],weighted[j]]=[weighted[j],weighted[i]]; }
        practiceQueue = [...weighted];
      }
    }
    const key  = practiceQueue.shift();
    const diff = PROMPTS_RAW[key] ?? PROMPTS_RAW[key.toUpperCase()] ?? PROMPTS_RAW[key.toLowerCase()] ?? 50;
    return [key, diff];
  }
  if (currentMode === "priority") {
    const priArr = [...priority].filter(p => favorites.has(p));
    if (!priArr.length) { activateMode("normal"); return getWeightedRandomPrompt(PROMPTS_LIST); }
    const priPrompts = priArr.map(key => [key, PROMPTS_RAW[key] ?? PROMPTS_RAW[key.toUpperCase()] ?? PROMPTS_RAW[key.toLowerCase()] ?? 50]);
    return getWeightedRandomPrompt(priPrompts);
  }
  if (currentMode === "struggle") {
    const valid = PROMPTS_LIST.filter(([k,v]) => v >= cfg.min && v <= cfg.max);
    const pool  = valid.length ? valid : PROMPTS_LIST;
    const weighted = [];
    pool.forEach(entry => {
      const copies = Math.max(1, Math.round(1 + getStruggleScore(entry[0]) * 0.5));
      for (let i=0; i<copies; i++) weighted.push(entry);
    });
    return weighted[Math.floor(Math.random()*weighted.length)];
  }
  if (currentMode === "sn") {
    if (SN_PROMPTS.length === 0) {
      const valid = PROMPTS_LIST.filter(([k,v]) => v >= cfg.min && v <= cfg.max);
      const pool  = valid.length ? valid : PROMPTS_LIST;
      return getWeightedRandomPrompt(pool);
    }
    
    const weighted = [];
    SN_PROMPTS.forEach(entry => {
      const [prompt, solveCount] = entry;
      const copies = solveCount;
      for (let i = 0; i < copies; i++) {
        weighted.push(entry);
      }
    });
    
    return weighted[Math.floor(Math.random() * weighted.length)];
  }
  const valid = PROMPTS_LIST.filter(([k,v]) => v >= cfg.min && v <= cfg.max);
  const pool  = valid.length ? valid : PROMPTS_LIST;
  
  return getWeightedRandomPrompt(pool);
}

// Helper function for weighted random prompt selection
function getWeightedRandomPrompt(pool) {
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

// ── Record prompt performance ────────────────────────────────────────────────
function recordPromptData() {
  if (!currentPrompt) return;
  const elapsed = Math.floor((Date.now()-startTime)/1000);
  if (!struggleData[currentPrompt]) struggleData[currentPrompt] = { count:0, totalTime:0, autoSolves:0 };
  struggleData[currentPrompt].count++;
  struggleData[currentPrompt].totalTime += elapsed;
  if (autoSolvedThisPrompt) struggleData[currentPrompt].autoSolves++;
  saveStruggle(struggleData);
}

// ── Reset prompt ─────────────────────────────────────────────────────────────
function resetPrompt() {
  recordPromptData();
  autoSolvedThisPrompt = false;
  const entry = getNextPrompt();
  currentPrompt = entry[0]; currentDiff = entry[1];
  startTime = Date.now();
  const isSelf = WORD_SET.has(currentPrompt.toUpperCase());
  
  if (currentMode === "regen-random") {
    regenRandomLetter = getRandomLetterForPrompt(currentPrompt);
    if (regenRandomLetter) {
      promptWordEl.textContent = `${currentPrompt} + ${regenRandomLetter}`;
    } else {
      promptWordEl.textContent = currentPrompt;
      regenRandomLetter = null;
    }
  } else {
    promptWordEl.textContent = currentPrompt;
    regenRandomLetter = null;
  }
  
  promptWordEl.style.color = isSelf ? "var(--t-acc)" : "var(--t-txt)";
  if (currentMode === "sn") {
    const snEntry = SN_PROMPTS.find(([prompt, count]) => prompt === currentPrompt);
    const solutionCount = snEntry ? snEntry[1] : wordsContaining(currentPrompt).length;
    diffEl.textContent = `Sub ${solutionCount}`;
  } else {
    diffEl.textContent = currentDiff + "%";
  }
  inputEl.value = ""; inputEl.className = "ti";
  previewEl.innerHTML = ""; msgEl.textContent = "";
  updateStarBtns(); inputEl.focus();
}

// ── Mode activation ──────────────────────────────────────────────────────────
export function activateMode(mode) {
  currentMode  = mode;
  practiceQueue = [];
  if (mode === "all") generatePromptList();
  
  if (mode === "regen-regular" || mode === "regen-ranked") {
    document.getElementById("regen-bar").style.display = "block";
    regenStartingCount = mode === "regen-ranked" ? 3 : 1;
    initRegen();
    score = 0; scoreEl.textContent = 0;
  } else {
    document.getElementById("regen-bar").style.display = "none";
    score = 0; scoreEl.textContent = 0;
  }
  
  const label = MODE_LABELS[mode];
  if (label) { practiceBadge.textContent = label; practiceBadge.classList.add("show"); }
  else        { practiceBadge.classList.remove("show"); }
  document.querySelectorAll(".mode-card").forEach(c => c.classList.remove("active-mode"));
  const cardId = { normal:"mode-normal", all:"mode-all", "fav-rand":"mode-fav-rand",
                   "fav-seq":"mode-fav-seq", priority:"mode-priority", struggle:"mode-struggle",
                   "regen-random":"mode-regen-random", "regen-regular":"mode-regen-regular", 
                   "regen-ranked":"mode-regen-ranked", sn:"mode-sn" }[mode];
  if (cardId) document.getElementById(cardId)?.classList.add("active-mode");
  switchTab("game");
  currentPrompt = ""; resetPrompt();
}

// ── Tab switching ─────────────────────────────────────────────────────────────
export function switchTab(name) {
  document.querySelectorAll(".ni").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelector(`.ni[data-tab="${name}"]`)?.classList.add("active");
  document.getElementById(`tab-${name}`)?.classList.add("active");
  if (name === "game")      inputEl.focus();
  if (name === "stats")     renderStats();
  if (name === "favorites") renderFavs();
  if (name === "modes")     updateStruggleInfo();
  if (name === "wordlists") renderWordlists();
}

// ── Star buttons ──────────────────────────────────────────────────────────────
function updateStarBtns() {
  const on  = favorites.has(currentPrompt);
  favBtn.className = on ? "on" : "off";
  favBtn.title = on ? "unfavorite this prompt" : "favorite this prompt";
  const pon = priority.has(currentPrompt);
  priBtn.className = pon ? "on" : "off";
  priBtn.title = pon ? "remove priority" : "mark as priority";
  priBtn.style.display = on ? "" : "none";
}

favBtn.addEventListener("click", () => {
  if (favorites.has(currentPrompt)) { favorites.delete(currentPrompt); priority.delete(currentPrompt); savePriority(priority); }
  else favorites.add(currentPrompt);
  saveFavs(favorites); updateStarBtns(); renderFavs();
});
priBtn.addEventListener("click", () => {
  if (!favorites.has(currentPrompt)) return;
  if (priority.has(currentPrompt)) priority.delete(currentPrompt);
  else priority.add(currentPrompt);
  savePriority(priority); updateStarBtns(); renderFavs();
});

// ── Solve for player ──────────────────────────────────────────────────────────
function solveForPlayer() {
  autoSolvedThisPrompt = true;
  let pool = wordsContaining(currentPrompt);
  
  if (currentMode === "regen-random" && regenRandomLetter) {
    pool = pool.filter(w => w.toUpperCase().includes(regenRandomLetter));
  }
  
  const activeWordlist = getActiveWordlist();
  if (activeWordlist) {
    const wordlistWords = new Set(activeWordlist.words);
    const wordlistMatches = pool.filter(w => wordlistWords.has(w));
    if (wordlistMatches.length > 0) {
      pool = wordlistMatches;
    }
  }
  
  pool = sortWords(pool, cfg.sort);
  
  if (currentMode.startsWith("regen") && currentMode !== "regen-random") {
    const filteredPool = pool.filter(word => {
      for (let i = 0; i < word.length; i++) {
        const char = word[i];
        if (char >= 'A' && char <= 'Z' && regenLetters[char] > 0) {
          return true;
        }
      }
      return false;
    });
    
    if (filteredPool.length > 0) {
      let bestWord = filteredPool[0];
      let bestScore = 0;
      
      for (let i = 0; i < filteredPool.length; i++) {
        const word = filteredPool[i];
        let score = 0;
        
        const letterCounts = {};
        for (let j = 0; j < word.length; j++) {
          const char = word[j];
          if (char >= 'A' && char <= 'Z') {
            letterCounts[char] = (letterCounts[char] || 0) + 1;
          }
        }
        
        for (const [char, count] of Object.entries(letterCounts)) {
          const remainingCount = regenLetters[char];
          if (remainingCount > 0) {
            const actualCount = Math.min(count, remainingCount);
            score += actualCount * remainingCount * (REGENMODE_WEIGHTS[char] || 1);
          }
        }
        
        if (score > bestScore) {
          bestScore = score;
          bestWord = word;
        }
      }
      
      if (bestWord && bestWord !== pool[0]) {
        const bestIndex = pool.indexOf(bestWord);
        if (bestIndex > 0) {
          [pool[0], pool[bestIndex]] = [pool[bestIndex], pool[0]];
        }
      }
    }
  }
  if (!pool.length) { msgEl.textContent = "no words found"; return; }
  const w = pool[0];
  inputEl.value = w; inputEl.classList.add("correct"); updatePreview(w);
}

function updatePreview(text) {
  if (!text) { previewEl.innerHTML = ""; return; }
  const i = text.toLowerCase().indexOf(currentPrompt.toLowerCase());
  if (i !== -1) {
    previewEl.innerHTML = hlWord(text, currentPrompt);
    inputEl.classList.add("correct"); inputEl.classList.remove("wrong");
  } else {
    previewEl.innerHTML = `<span style="color:var(--t-txt3)">${esc(text.toLowerCase())}</span>`;
    inputEl.classList.remove("correct");
  }
}

// ── Input handling ────────────────────────────────────────────────────────────
const ALLOWED = /[^a-zA-Z\-']/g;
let solveDebounced = false;

inputEl.addEventListener("input", () => {
  const raw = inputEl.value, last = raw.slice(-1);
  if (last==="^"||last==="6") {
    if (!solveDebounced) solveForPlayer();
    solveDebounced = true; setTimeout(() => solveDebounced=false, 300); return;
  }
  const f = raw.replace(ALLOWED, "");
  if (f !== raw) inputEl.value = f;
  updatePreview(inputEl.value); msgEl.textContent = "";
});

inputEl.addEventListener("keydown", e => {
  if (e.key === " ") {
    e.preventDefault();
    const start = inputEl.selectionStart;
    const end = inputEl.selectionEnd;
    const value = inputEl.value;
    inputEl.value = value.slice(0, start) + "-" + value.slice(end);
    inputEl.selectionStart = inputEl.selectionEnd = start + 1;
    updatePreview(inputEl.value);
  } else if (e.key === ".") {
    e.preventDefault();
    const start = inputEl.selectionStart;
    const end = inputEl.selectionEnd;
    const value = inputEl.value;
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
    if (!solveDebounced) solveForPlayer();
    solveDebounced = true; setTimeout(() => solveDebounced=false, 300); return;
  }
  const hasPrompt = val.includes(currentPrompt.toLowerCase());
  const isWord    = WORD_SET.has(val.toUpperCase());
  
  if (currentMode === "regen-random" && regenRandomLetter) {
    const hasLetter = val.toUpperCase().includes(regenRandomLetter);
    if (!hasLetter) { 
      msgEl.textContent = `"${val}" doesn't contain required letter "${regenRandomLetter}"`; 
      shake(); return; 
    }
  }
  
  if (!hasPrompt) { msgEl.textContent = `"${val}" doesn't contain "${currentPrompt}"`; shake(); return; }
  if (!isWord)    { msgEl.textContent = `"${val}" isn't a valid word`; shake(); return; }
  
  if (currentMode === "regen-regular" || currentMode === "regen-ranked") {
    updateRegenLetters(val);
  } else {
    score++; scoreEl.textContent = score;
  }
  
  stats.totalWords++; saveStats(stats); renderStatsQuiet();
  flashGreen(); resetPrompt();
});

function shake() {
  inputEl.classList.add("wrong"); inputEl.value = ""; previewEl.innerHTML = "";
  setTimeout(() => { inputEl.classList.remove("wrong"); msgEl.textContent = ""; }, 700);
}

// ── Flash overlay ─────────────────────────────────────────────────────────────
const flashDiv = document.createElement("div");
flashDiv.style.cssText = "position:fixed;inset:0;pointer-events:none;opacity:0;transition:opacity 0.2s;z-index:999;";
document.body.appendChild(flashDiv);
function flashGreen() {
  flashDiv.style.background = "var(--t-acc2)"; flashDiv.style.opacity = "1";
  setTimeout(() => flashDiv.style.opacity = "0", 220);
}

// ── Timers ────────────────────────────────────────────────────────────────────
setInterval(() => { timerEl.textContent = Math.floor((Date.now()-startTime)/1000)+"s"; }, 500);
setInterval(() => {
  const base = loadStats().totalSeconds, sess = Math.floor((Date.now()-sessionStart)/1000);
  document.getElementById("stat-time").textContent = formatTime(base+sess);
}, 1000);

export function formatTime(s) {
  if (s < 60)   return s + "s";
  if (s < 3600) return Math.floor(s/60) + "m " + Math.floor(s%60) + "s";
  return Math.floor(s/3600) + "h " + Math.floor((s%3600)/60) + "m";
}

// ── Stats rendering ───────────────────────────────────────────────────────────
export function renderStats() {
  const base = loadStats();
  document.getElementById("stat-words").textContent = base.totalWords;
  document.getElementById("stat-time").textContent  = formatTime(base.totalSeconds + Math.floor((Date.now()-sessionStart)/1000));
}
export function renderStatsQuiet() { document.getElementById("stat-words").textContent = loadStats().totalWords; }

// ── Favorites rendering ───────────────────────────────────────────────────────
export function renderFavs() {
  const el    = document.getElementById("fav-list");
  const priEl = document.getElementById("pri-list");
  if (!favorites.size) {
    el.innerHTML    = '<span style="font-size:13px;color:var(--t-txt3);">star a prompt during the game to save it here</span>';
    priEl.innerHTML = '<span style="font-size:13px;color:var(--t-txt3);">use the ✦ button on a favorited prompt to mark it as priority</span>';
    return;
  }
  el.innerHTML = "";
  [...favorites].sort().forEach(p => {
    const isPri = priority.has(p);
    const pill  = document.createElement("div");
    pill.className = isPri ? "pri-pill" : "fav-pill";
    pill.innerHTML = `${isPri ? "✦ " : ""}${esc(p)}<span class="fav-rm">✕</span>`;
    pill.addEventListener("click", () => {
      favorites.delete(p); priority.delete(p);
      saveFavs(favorites); savePriority(priority); updateStarBtns(); renderFavs();
    });
    el.appendChild(pill);
  });
  priEl.innerHTML = "";
  const priItems = [...priority].filter(p => favorites.has(p)).sort();
  if (!priItems.length) { priEl.innerHTML = '<span style="font-size:13px;color:var(--t-txt3);">no priority prompts yet</span>'; return; }
  priItems.forEach(p => {
    const pill = document.createElement("div"); pill.className = "pri-pill";
    pill.innerHTML = `&#10005; ${esc(p)}<span class="fav-rm">&#10005;</span>`;
    pill.addEventListener("click", () => { priority.delete(p); savePriority(priority); updateStarBtns(); renderFavs(); });
    priEl.appendChild(pill);
  });
}

// Wordlists rendering
export function renderWordlists() {
  const el = document.getElementById("wordlists-grid");
  const wordlistIds = Object.keys(wordlists);
  
  if (!wordlistIds.length) {
    el.innerHTML = '<span style="font-size:13px;color:var(--t-txt3);grid-column:1/-1;">no wordlists yet</span>';
    return;
  }
  
  el.innerHTML = "";
  wordlistIds.forEach(id => {
    const wl = wordlists[id];
    const card = document.createElement("div");
    card.className = `wordlist-card ${wl.fixed ? 'wordlist-fixed' : ''} ${activeWordlistId === id ? 'active' : ''}`;
    
    card.innerHTML = `
      <div class="wordlist-title">${esc(wl.title)}</div>
      <div class="wordlist-desc">${esc(wl.desc || 'No description')}</div>
      <div class="wordlist-count">${wl.words.length} words</div>
      <div class="wordlist-actions">
        <button class="wordlist-btn ${activeWordlistId === id ? 'active' : ''}" data-action="activate">
          ${activeWordlistId === id ? 'active' : 'make active'}
        </button>
        ${!wl.fixed ? `<button class="wordlist-btn" data-action="edit-details">edit details</button>` : ''}
        <button class="wordlist-btn" data-action="edit-words">${wl.fixed ? 'view' : 'edit'} word list</button>
        <button class="wordlist-btn" data-action="export">export</button>
        ${!wl.fixed ? `<button class="wordlist-btn" data-action="delete">delete</button>` : ''}
      </div>
    `;
    
    card.addEventListener("click", (e) => {
      const action = e.target.dataset.action;
      if (action === "activate") {
        setActiveWordlist(activeWordlistId === id ? null : id);
      } else if (action === "edit-details") {
        openWordlistModal(id, 'details');
      } else if (action === "edit-words") {
        openWordlistModal(id, 'words');
      } else if (action === "export") {
        const content = wl.words.join('\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${wl.title.replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'wordlist'}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (action === "delete") {
        (async () => {
          if (await CustomConfirm(`Delete wordlist "${wl.title}"?`, "Are you sure?")) {
            delete wordlists[id];
            if (activeWordlistId === id) setActiveWordlist(null);
            saveWordlists(wordlists);
            renderWordlists();
          }
        })();
      }
    });
    
    el.appendChild(card);
  });
}

// Wordlist modal
let currentEditingWordlistId = null;
let currentEditingMode = null;

function openWordlistModal(id, mode) {
  currentEditingWordlistId = id;
  currentEditingMode = mode;
  const modal = document.getElementById("wordlist-modal");
  const titleInput = document.getElementById("wordlist-title");
  const descInput = document.getElementById("wordlist-desc");
  const wordsInput = document.getElementById("wordlist-words");
  const wordCount = document.getElementById("word-count");
  
  const wl = wordlists[id];
  titleInput.value = wl.title;
  descInput.value = wl.desc || "";
  wordsInput.value = wl.words.join("\n");
  wordCount.textContent = wl.words.length;
  
  titleInput.disabled = wl.fixed && mode === 'details';
  descInput.disabled = wl.fixed && mode === 'details';
  wordsInput.disabled = wl.fixed;
  
  modal.style.display = "flex";
  updateWordCount();
}

function closeWordlistModal() {
  document.getElementById("wordlist-modal").style.display = "none";
  currentEditingWordlistId = null;
  currentEditingMode = null;
}

function updateWordCount() {
  const wordsInput = document.getElementById("wordlist-words");
  const wordCount = document.getElementById("word-count");
  const words = wordsInput.value.split(/[\s\n]+/).filter(w => w.trim());
  wordCount.textContent = words.length;
}

function processWords(text) {
  return text.split(/[\s\n]+/)
    .map(w => w.trim().toUpperCase())
    .filter(w => w && validateWord(w))
    .slice(0, 500);
}

function saveWordlistFromModal() {
  const titleInput = document.getElementById("wordlist-title");
  const descInput = document.getElementById("wordlist-desc");
  const wordsInput = document.getElementById("wordlist-words");
  
  const wl = wordlists[currentEditingWordlistId];
  if (!wl.fixed) {
    wl.title = titleInput.value.trim() || "Untitled";
    wl.desc = descInput.value.trim();
  }
  wl.words = processWords(wordsInput.value);
  
  saveWordlists(wordlists);
  renderWordlists();
  closeWordlistModal();
}

// Struggle info ─────────────────────────────────────────────────────────────
export function updateStruggleInfo() {
  const info = document.getElementById("struggle-info");
  const entries = PROMPTS_LIST.map(([k]) => ({ key:k, score:getStruggleScore(k) }))
    .filter(e => e.score > 0).sort((a,b) => b.score-a.score).slice(0,10);
  if (!entries.length) {
    info.textContent = "no struggle data yet — play some rounds first.";
  } else {
    info.innerHTML = "<b style='color:var(--t-txt);font-weight:500'>currently weighted high:</b> " +
      entries.map(e => `<span style='font-family:monospace'>${esc(e.key)}</span>`).join(", ");
  }
  info.classList.add("show");
}

// ── Config ────────────────────────────────────────────────────────────────────
document.getElementById("cfg-min").addEventListener("blur", () => {
  let v = parseInt(document.getElementById("cfg-min").value);
  if (isNaN(v)||v<0) v=0; if (v>cfg.max) v=cfg.max;
  cfg.min = v; document.getElementById("cfg-min").value = v; generatePromptList();
  saveConfig(cfg);
});
document.getElementById("cfg-max").addEventListener("blur", () => {
  let v = parseInt(document.getElementById("cfg-max").value);
  if (isNaN(v)||v>100) v=100; if (v<cfg.min) v=cfg.min;
  cfg.max = v; document.getElementById("cfg-max").value = v; generatePromptList();
  saveConfig(cfg);
});
["cfg-min","cfg-max"].forEach(id => document.getElementById(id).addEventListener("keydown", e => { if (e.key==="Enter") e.target.blur(); }));
document.getElementById("cfg-sort").addEventListener("change", e => { cfg.sort = e.target.value; saveConfig(cfg); });

function updateWeightSliders(changedSlider) {
  const slider2 = document.getElementById("cfg-weight-2");
  const slider3 = document.getElementById("cfg-weight-3");
  const value2El = document.getElementById("weight-2-value");
  const value3El = document.getElementById("weight-3-value");
  
  let weight2 = parseFloat(slider2.value);
  let weight3 = parseFloat(slider3.value);
  
  if (changedSlider === '2') {
    weight3 = Math.max(0, Math.min(1, 1 - weight2));
    slider3.value = weight3;
  } else if (changedSlider === '3') {
    weight2 = Math.max(0, Math.min(1, 1 - weight3));
    slider2.value = weight2;
  }
  
  cfg.weight2 = weight2;
  cfg.weight3 = weight3;
  
  value2El.textContent = weight2.toFixed(1);
  value3El.textContent = weight3.toFixed(1);
  
  saveConfig(cfg);
}

document.getElementById("cfg-weight-2").addEventListener("input", () => updateWeightSliders('2'));
document.getElementById("cfg-weight-3").addEventListener("input", () => updateWeightSliders('3'));
document.getElementById("cfg-weights-enabled").addEventListener("change", e => {
  cfg.weightsEnabled = e.target.checked;
  saveConfig(cfg);
});

// ── Modes tab ──────────────────────────────────────────────────────────────────
const modeMap = {
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
Object.entries(modeMap).forEach(([id, mode]) => {
  document.getElementById(id).addEventListener("click", async () => {
    if (mode==="fav-rand"||mode==="fav-seq") { if (!favorites.size) { await CustomAlert("add some favorites first!", "Cannot Start"); return; } }
    if (mode==="priority") { if (![...priority].some(p=>favorites.has(p))) { await CustomAlert("mark some prompts as priority first!", "Cannot Start"); return; } }
    activateMode(mode);
    if (mode==="struggle") updateStruggleInfo();
  });
});

document.getElementById("clear-struggle-btn").addEventListener("click", async () => {
  if (!await CustomConfirm("clear all struggle data?", "Are you sure?")) return;
  struggleData = {}; clearStruggle(); updateStruggleInfo();
});

// ── Favorites tab buttons ─────────────────────────────────────────────────────
document.getElementById("fav-practice-btn").addEventListener("click", () => {
  if (!favorites.size) { document.getElementById("fav-practice-msg").textContent = "add some favorites first!"; return; }
  activateMode("fav-rand");
});
document.getElementById("fav-practice-seq-btn").addEventListener("click", () => {
  if (!favorites.size) { document.getElementById("fav-practice-msg").textContent = "add some favorites first!"; return; }
  activateMode("fav-seq");
});

// ── Fav export/import ─────────────────────────────────────────────────────────
document.getElementById("fav-export").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify({favorites:[...favorites],priority:[...priority]},null,2)],{type:"application/json"});
  const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="wordbomb_favorites.json"; a.click();
  tmp("fav-io-msg","exported!");
});
document.getElementById("fav-import-btn").addEventListener("click", () => document.getElementById("fav-import-file").click());
document.getElementById("fav-import-file").addEventListener("change", e => {
  const file = e.target.files[0]; if (!file) return;
  const r = new FileReader();
  r.onload = ev => {
    try {
      const d = JSON.parse(ev.target.result);
      if (d.favorites&&Array.isArray(d.favorites)) { d.favorites.forEach(p=>favorites.add(p)); saveFavs(favorites); }
      if (d.priority&&Array.isArray(d.priority))   { d.priority.forEach(p=>priority.add(p));   savePriority(priority); }
      renderFavs(); updateStarBtns(); tmp("fav-io-msg","imported!");
    } catch { tmp("fav-io-msg","invalid file"); }
  };
  r.readAsText(file); e.target.value = "";
});

// ── Stats export/import ───────────────────────────────────────────────────────
document.getElementById("stats-export").addEventListener("click", () => {
  const base = loadStats();
  const out  = { totalWords:base.totalWords, totalSeconds:base.totalSeconds+Math.floor((Date.now()-sessionStart)/1000) };
  const blob = new Blob([JSON.stringify(out,null,2)],{type:"application/json"});
  const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="wordbomb_stats.json"; a.click();
  tmp("stats-io-msg","exported!");
});
document.getElementById("stats-import-btn").addEventListener("click", () => document.getElementById("stats-import-file").click());
document.getElementById("stats-import-file").addEventListener("change", e => {
  const file = e.target.files[0]; if (!file) return;
  const r = new FileReader();
  r.onload = ev => {
    try {
      const d = JSON.parse(ev.target.result);
      if (typeof d.totalWords==="number")   stats.totalWords   = d.totalWords;
      if (typeof d.totalSeconds==="number") stats.totalSeconds = d.totalSeconds;
      sessionStart = Date.now(); saveStats(stats); renderStats(); tmp("stats-io-msg","restored!");
    } catch { tmp("stats-io-msg","invalid file"); }
  };
  r.readAsText(file); e.target.value = "";
});
document.getElementById("stats-reset").addEventListener("click", async () => {
  if (!await CustomConfirm("reset all stats?", "Are you sure?")) return;
  stats = { totalWords:0, totalSeconds:0 }; struggleData = {};
  sessionStart = Date.now(); saveStats(stats); saveStruggle(struggleData); renderStats();
});

// ── Lookup ────────────────────────────────────────────────────────────────────
const lookupInp = document.getElementById("lookup-inp");
lookupInp.addEventListener("input", () => { lookupInp.value = lookupInp.value.replace(/[^a-zA-Z]/g,"").slice(0,5).toUpperCase(); });
function doLookup() {
  const raw = lookupInp.value; if (!raw) return;
  const p   = raw.toLowerCase();
  const solves = sortWords(wordsContaining(p), cfg.sort);
  const rate = PROMPTS_RAW[raw] ?? PROMPTS_RAW[p];
  const rateStr = rate !== undefined ? rate+"%" : "?";
  document.getElementById("lookup-res").innerHTML = `Solve Rate = <b>${rateStr}</b>, Sub = <b>${solves.length}</b>`;
  const wl = document.getElementById("word-list"); wl.innerHTML = "";
  solves.slice(0,222).forEach(w => {
    const pill = document.createElement("div"); pill.className = "wpill";
    pill.innerHTML = hlWord(w,p); wl.appendChild(pill);
  });
}
document.getElementById("lookup-btn").addEventListener("click", doLookup);
lookupInp.addEventListener("keydown", e => { if (e.key==="Enter") doLookup(); });

// ── Breakdown ─────────────────────────────────────────────────────────────────
const bdInp = document.getElementById("word-breakdown-inp");
bdInp.addEventListener("input", () => { bdInp.value = bdInp.value.replace(/[^a-zA-Z\-']/g,"").toUpperCase(); });
function doBreakdown() {
  const word = bdInp.value.toLowerCase(); if (!word) return;
  const container = document.getElementById("breakdown-list"); container.innerHTML = "";
  const matches = [];
  PROMPTS_LIST.forEach(([key,rate]) => { if (word.includes(key.toLowerCase())) matches.push([key,rate]); });
  matches.sort((a,b) => a[1]-b[1]);
  if (!matches.length) { container.innerHTML = '<span style="font-size:13px;color:var(--t-txt3);">no known prompts found in this word</span>'; return; }
  matches.forEach(([key,rate]) => {
    const pill = document.createElement("div"); pill.className = "bpill";
    pill.innerHTML = `<span style="font-family:monospace;color:var(--t-txt)">${esc(key)}</span><span class="bpill-rate">${rate.toFixed(1)}%</span>`;
    container.appendChild(pill);
  });
}
document.getElementById("breakdown-btn").addEventListener("click", doBreakdown);
bdInp.addEventListener("keydown", e => { if (e.key==="Enter") doBreakdown(); });

// ── Sidebar nav ───────────────────────────────────────────────────────────────
document.querySelectorAll(".ni").forEach(btn => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});
document.getElementById("stoggle").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});

// ── Wordlist event listeners ──────────────────────────────────────────────────
document.getElementById("new-wordlist-btn").addEventListener("click", () => {
  const id = "custom_" + Date.now();
  wordlists[id] = {
    id,
    title: "New Wordlist",
    desc: "",
    words: [],
    fixed: false
  };
  saveWordlists(wordlists);
  openWordlistModal(id, 'details');
});

document.getElementById("wordlist-modal-close").addEventListener("click", closeWordlistModal);
document.getElementById("wordlist-cancel").addEventListener("click", closeWordlistModal);
document.getElementById("wordlist-words").addEventListener("input", updateWordCount);
document.getElementById("wordlist-save").addEventListener("click", saveWordlistFromModal);

document.getElementById("wordlist-import-btn").addEventListener("click", () => {
  document.getElementById("wordlist-import-file").click();
});

document.getElementById("wordlist-import-file").addEventListener("change", e => {
  const file = e.target.files[0]; if (!file) return;
  const r = new FileReader();
  r.onload = ev => {
    const wordsInput = document.getElementById("wordlist-words");
    const currentWords = new Set(wordsInput.value.split(/[\s\n]+/).map(w => w.trim()).filter(w => w));
    const importedWords = ev.target.result.split(/[\n\r]+/)
      .map(w => w.trim().toUpperCase())
      .filter(w => w && validateWord(w))
      .filter(w => !currentWords.has(w));
    
    const wl = wordlists[currentEditingWordlistId];
    let finalWords = [];
    if (wl && !wl.fixed) {
      const remainingSlots = 500 - currentWords.size;
      if (remainingSlots <= 0) {
        CustomAlert("Wordlist already has 500 words (maximum limit).", "Limit Reached");
        return;
      }
      finalWords = importedWords.slice(0, remainingSlots);
      if (finalWords.length < importedWords.length) {
        CustomAlert(`Only imported ${finalWords.length} words due to 500-word limit.`, "Limited");
      }
    } else {
      finalWords = importedWords;
    }
    
    wordsInput.value = [...currentWords, ...finalWords].join("\n");
    updateWordCount();
  };
  r.readAsText(file);
  e.target.value = "";
});

// ── Utility ───────────────────────────────────────────────────────────────────
let popupResolve = null;

function showPopup(title, message, showCancel = false) {
  const modal = document.getElementById("popup-modal");
  const titleEl = document.getElementById("popup-title");
  const messageEl = document.getElementById("popup-message");
  const cancelBtn = document.getElementById("popup-cancel");
  const okBtn = document.getElementById("popup-ok");
  
  titleEl.textContent = title;
  messageEl.textContent = message;
  cancelBtn.style.display = showCancel ? "block" : "none";
  
  modal.classList.add("show");
  
  return new Promise((resolve) => {
    popupResolve = resolve;
    
    const handleOk = () => {
      modal.classList.remove("show");
      okBtn.removeEventListener("click", handleOk);
      cancelBtn.removeEventListener("click", handleCancel);
      resolve(true);
    };
    
    const handleCancel = () => {
      modal.classList.remove("show");
      okBtn.removeEventListener("click", handleOk);
      cancelBtn.removeEventListener("click", handleCancel);
      resolve(false);
    };
    
    okBtn.addEventListener("click", handleOk);
    if (showCancel) {
      cancelBtn.addEventListener("click", handleCancel);
    }
  });
}

function CustomAlert(message, title = "Notice") {
  return showPopup(title, message, false);
}

function CustomConfirm(message, title = "Confirm") {
  return showPopup(title, message, true);
}

// Regen functions
function initRegen() {
  regenLetters = {};
  for (let i = 65; i <= 90; i++) {
    const letter = String.fromCharCode(i);
    regenLetters[letter] = regenStartingCount;
  }
  renderRegenBar();
}

function renderRegenBar() {
  const container = document.getElementById("regen-letters");
  container.innerHTML = "";
  
  for (let i = 65; i <= 90; i++) {
    const letter = String.fromCharCode(i);
    const count = regenLetters[letter];
    
    const letterDiv = document.createElement("div");
    letterDiv.className = "regen-letter";
    if (count === 0) {
      letterDiv.classList.add("disabled");
    } else if (count > 0) {
      letterDiv.classList.add("active");
    }
    
    letterDiv.innerHTML = `
      <div class="letter">${letter}</div>
      <div class="count">${count}</div>
    `;
    
    container.appendChild(letterDiv);
  }
}

function updateRegenLetters(word) {
  const uniqueLetters = new Set();
  for (const char of word.toUpperCase()) {
    if (char >= 'A' && char <= 'Z') {
      uniqueLetters.add(char);
    }
  }
  
  for (const letter of uniqueLetters) {
    if (regenLetters[letter] > 0) {
      regenLetters[letter] = Math.max(0, regenLetters[letter] - 1);
    }
  }
  
  let allZero = true;
  for (let i = 65; i <= 90; i++) {
    const letter = String.fromCharCode(i);
    if (regenLetters[letter] > 0) {
      allZero = false;
      break;
    }
  }
  
  if (allZero) {
    regenHearts++;
    scoreEl.textContent = regenHearts;
    regenStartingCount++;
    initRegen();
  } else {
    renderRegenBar();
  }
}

function getRandomLetterForPrompt(prompt) {
  const promptLetters = new Set(prompt.toUpperCase());
  const availableLetters = [];
  
  const promptWords = wordsContaining(prompt);
  
  for (let i = 65; i <= 90; i++) {
    const letter = String.fromCharCode(i);
    if (!promptLetters.has(letter)) {
      const wordsWithBoth = promptWords.filter(w => 
        w.toUpperCase().includes(letter)
      );
      if (wordsWithBoth.length > 0) {
        availableLetters.push(letter);
      }
    }
  }
  
  return availableLetters.length > 0 
    ? availableLetters[Math.floor(Math.random() * availableLetters.length)]
    : null;
}

function tmp(id, msg, t=2200) { const el=document.getElementById(id); el.textContent=msg; setTimeout(()=>el.textContent="",t); }

// ── Init ──────────────────────────────────────────────────────────────────────
initThemes();
initTutorial();
initRegen();
createDefaultWordlists();
renderWordlists();

// Initialize config UI
document.getElementById("cfg-min").value = cfg.min;
document.getElementById("cfg-max").value = cfg.max;
document.getElementById("cfg-sort").value = cfg.sort;
document.getElementById("cfg-weight-2").value = cfg.weight2 !== undefined ? cfg.weight2 : 0.5;
document.getElementById("cfg-weight-3").value = cfg.weight3 !== undefined ? cfg.weight3 : 0.5;
document.getElementById("weight-2-value").textContent = (cfg.weight2 !== undefined ? cfg.weight2 : 0.5).toFixed(1);
document.getElementById("weight-3-value").textContent = (cfg.weight3 !== undefined ? cfg.weight3 : 0.5).toFixed(1);
document.getElementById("cfg-weights-enabled").checked = cfg.weightsEnabled !== undefined ? cfg.weightsEnabled : true;

generatePromptList();
renderStats();
renderFavs();
resetPrompt();