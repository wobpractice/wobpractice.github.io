import { loadWordlists, saveWordlists, loadActiveWordlist, saveActiveWordlist } from "./storage.js";
import { wordsContaining, validateWord, esc, CustomConfirm, CustomAlert } from "./utils/index.js";

let wordlists = loadWordlists();
let activeWordlistId = loadActiveWordlist();
let currentEditingWordlistId = null;
let currentEditingMode = null;

function createDefaultWordlists() {
  const defaults = {
    fish: { id: 'fish', title: 'Fish', desc: 'All words containing "fish"', words: wordsContaining('fish'), fixed: true },
    wood: { id: 'wood', title: 'Wood', desc: 'All words containing "wood"', words: wordsContaining('wood'), fixed: true },
    super: { id: 'super', title: 'Super', desc: 'All words containing "super"', words: wordsContaining('super'), fixed: true },
    hyper: { id: 'hyper', title: 'Hyper', desc: 'All words containing "hyper"', words: wordsContaining('hyper'), fixed: true },
    man: { id: 'man', title: 'Man', desc: 'All words containing "man"', words: wordsContaining('man'), fixed: true }
  };
  
  let updated = false;
  for (const [key, wordlist] of Object.entries(defaults)) {
    if (!wordlists[key]) {
      wordlists[key] = wordlist;
      updated = true;
    }
  }
  
  if (updated) saveWordlists(wordlists);
}

export function getActiveWordlist() {
  return activeWordlistId && wordlists[activeWordlistId] ? wordlists[activeWordlistId] : null;
}

export function setActiveWordlist(id) {
  if (id && wordlists[id]) {
    activeWordlistId = id;
    saveActiveWordlist(id);
  } else {
    activeWordlistId = null;
    saveActiveWordlist(null);
  }
  renderWordlists();
}

export function getWordlists() {
  return wordlists;
}

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
        exportWordlist(wl);
      } else if (action === "delete") {
        deleteWordlist(id, wl);
      }
    });
    
    el.appendChild(card);
  });
}

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

function exportWordlist(wl) {
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
}

async function deleteWordlist(id, wl) {
  if (!await CustomConfirm(`Delete wordlist "${wl.title}"?`, "Are you sure?")) return;
  
  delete wordlists[id];
  if (activeWordlistId === id) setActiveWordlist(null);
  saveWordlists(wordlists);
  renderWordlists();
}

function importWordsFromFile(file) {
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
        showImportLimitAlert(0, 0);
        return;
      }
      finalWords = importedWords.slice(0, remainingSlots);
      if (finalWords.length < importedWords.length) {
        showImportLimitAlert(finalWords.length, importedWords.length);
      }
    } else {
      finalWords = importedWords;
    }
    
    wordsInput.value = [...currentWords, ...finalWords].join("\n");
    updateWordCount();
  };
  r.readAsText(file);
}

async function showImportLimitAlert(imported, total) {
  if (imported === 0) {
    await CustomAlert("Wordlist already has 500 words (maximum limit).", "Limit Reached");
  } else {
    await CustomAlert(`Only imported ${imported} words due to 500-word limit.`, "Limited");
  }
}

export function setupWordlistHandlers() {
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
    const file = e.target.files[0]; 
    if (!file) return;
    importWordsFromFile(file);
    e.target.value = "";
  });
}

export function initWordlistManager() {
  createDefaultWordlists();
  renderWordlists();
  setupWordlistHandlers();
}
