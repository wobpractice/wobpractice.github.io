// LocalStorage keys
const LS_STATS    = "wb_stats";
const LS_FAVS     = "wb_favs";
const LS_PRI      = "wb_priority";
const LS_STRUGGLE = "wb_struggle";
const LS_WORDLISTS = "wb_wordlists";
const LS_ACTIVE_WORDLIST = "wb_active_wordlist";
const LS_CONFIG   = "wb_config";

// Stats functions
export function loadStats() {
  try { 
    const d = localStorage.getItem(LS_STATS); 
    return d ? JSON.parse(d) : { totalWords: 0, totalSeconds: 0 }; 
  }
  catch { return { totalWords: 0, totalSeconds: 0 }; }
}

export function saveStats(s) {
  try { localStorage.setItem(LS_STATS, JSON.stringify(s)); } catch {}
}

// Favorites functions
export function loadFavs() {
  try { const d = localStorage.getItem(LS_FAVS); return d ? new Set(JSON.parse(d)) : new Set(); }
  catch { return new Set(); }
}

export function saveFavs(f) {
  try { localStorage.setItem(LS_FAVS, JSON.stringify([...f])); } catch {}
}

// Priority functions
export function loadPriority() {
  try { const d = localStorage.getItem(LS_PRI); return d ? new Set(JSON.parse(d)) : new Set(); }
  catch { return new Set(); }
}

export function savePriority(p) {
  try { localStorage.setItem(LS_PRI, JSON.stringify([...p])); } catch {}
}

// Struggle functions
export function loadStruggle() {
  try { const d = localStorage.getItem(LS_STRUGGLE); return d ? JSON.parse(d) : {}; }
  catch { return {}; }
}

export function saveStruggle(data) {
  try { localStorage.setItem(LS_STRUGGLE, JSON.stringify(data)); } catch {}
}

export function clearStruggle() {
  try { localStorage.removeItem(LS_STRUGGLE); } catch {}
}

// Wordlists functions
export function loadWordlists() {
  try { const d = localStorage.getItem(LS_WORDLISTS); return d ? JSON.parse(d) : {}; }
  catch { return {}; }
}

export function saveWordlists(w) {
  try { localStorage.setItem(LS_WORDLISTS, JSON.stringify(w)); } catch {}
}

// Active wordlist functions
export function loadActiveWordlist() {
  try { const d = localStorage.getItem(LS_ACTIVE_WORDLIST); return d || null; }
  catch { return null; }
}

export function saveActiveWordlist(id) {
  try { localStorage.setItem(LS_ACTIVE_WORDLIST, id); } catch {}
}

// Config functions
export function loadConfig() {
  try { 
    const d = localStorage.getItem(LS_CONFIG); 
    return d ? JSON.parse(d) : { min: 0, max: 100, sort: "random", weight2: 0.5, weight3: 0.5, weightsEnabled: false }; 
  }
  catch { return { min: 0, max: 100, sort: "random", weight2: 0.5, weight3: 0.5, weightsEnabled: false }; }
}

export function saveConfig(c) {
  try { localStorage.setItem(LS_CONFIG, JSON.stringify(c)); } catch {}
}