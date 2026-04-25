import { PROMPTS_LIST, SN_PROMPTS, sortWords, wordsContaining, REGENMODE_WEIGHTS } from "./utils/index.js";
import { loadConfig } from "./storage.js";

let promptList = [], promptIndex = 0;
let currentMode = "normal";

export function generatePromptList(cfg) {
  const valid = PROMPTS_LIST.filter(([k, v]) => v >= cfg.min && v <= cfg.max);
  valid.sort((a, b) => b[1] - a[1] || (a[0].length - b[0].length));
  promptList = valid; 
  promptIndex = 0;
}

export function setMode(mode) {
  currentMode = mode;
}

export function getWeightedRandomPrompt(pool, cfg) {
  if (!cfg.weightsEnabled) return pool[Math.floor(Math.random() * pool.length)];
  
  const weighted = [];
  pool.forEach(entry => {
    const [prompt] = entry;
    let weight = 1;
    
    if (prompt.length === 2) weight = cfg.weight2 !== undefined ? cfg.weight2 : 0.5;
    else if (prompt.length === 3) weight = cfg.weight3 !== undefined ? cfg.weight3 : 0.5;
    
    const copies = Math.round(weight * 10);
    for (let i = 0; i < copies; i++) weighted.push(entry);
  });
  
  return weighted.length === 0 ? pool[Math.floor(Math.random() * pool.length)] : weighted[Math.floor(Math.random() * weighted.length)];
}

export function getNextPrompt(cfg, favorites, priority, struggleData) {
  if (currentMode === "all") {
    if (promptIndex >= promptList.length) generatePromptList(cfg);
    const result = promptList[promptIndex++];
    return result;
  }
  
  if (currentMode === "fav-rand" || currentMode === "fav-seq") {
    return getNextFavoritePrompt(currentMode, favorites, priority);
  }
  
  if (currentMode === "priority") {
    return getNextPriorityPrompt(favorites, priority);
  }
  
  if (currentMode === "struggle") {
    return getNextStrugglePrompt(cfg, struggleData);
  }
  
  if (currentMode === "sn") {
    return getNextSNPrompt();
  }
  
  const valid = PROMPTS_LIST.filter(([k, v]) => v >= cfg.min && v <= cfg.max);
  const pool = valid.length ? valid : PROMPTS_LIST;
  return getWeightedRandomPrompt(pool, cfg);
}

function getNextFavoritePrompt(mode, favorites, priority) {
  const favArr = [...favorites];
  if (!favArr.length) return null;
  
  if (mode === "fav-seq") {
    const sorted = [...favArr].sort();
    const key = sorted[Math.floor(Math.random() * sorted.length)];
    const diff = 50;
    return [key, diff];
  } else {
    const priArr = [...priority].filter(p => favorites.has(p));
    const weighted = [...favArr];
    priArr.forEach(p => { weighted.push(p); weighted.push(p); });
    for (let i = weighted.length - 1; i > 0; i--) { 
      const j = Math.floor(Math.random() * (i + 1)); 
      [weighted[i], weighted[j]] = [weighted[j], weighted[i]]; 
    }
    const key = weighted[Math.floor(Math.random() * weighted.length)];
    const diff = 50;
    return [key, diff];
  }
}

function getNextPriorityPrompt(favorites, priority) {
  const priArr = [...priority].filter(p => favorites.has(p));
  if (!priArr.length) return null;
  
  const key = priArr[Math.floor(Math.random() * priArr.length)];
  const diff = 50;
  return [key, diff];
}

function getNextStrugglePrompt(cfg, struggleData) {
  const valid = PROMPTS_LIST.filter(([k, v]) => v >= cfg.min && v <= cfg.max);
  const pool = valid.length ? valid : PROMPTS_LIST;
  const weighted = [];
  
  pool.forEach(entry => {
    const key = entry[0];
    let score = 1;
    
    if (struggleData[key]) {
      const d = struggleData[key];
      if (d && d.count) {
        score = Math.max(1, Math.round(1 + ((d.totalTime / d.count) * 0.6 + (d.autoSolves / d.count) * 20) * 0.5));
      }
    }
    
    for (let i = 0; i < score; i++) weighted.push(entry);
  });
  
  return weighted[Math.floor(Math.random() * weighted.length)];
}

function getNextSNPrompt() {
  if (SN_PROMPTS.length === 0) return null;
  
  const weighted = [];
  SN_PROMPTS.forEach(entry => {
    const [prompt, solveCount] = entry;
    const copies = solveCount;
    for (let i = 0; i < copies; i++) weighted.push(entry);
  });
  
  return weighted[Math.floor(Math.random() * weighted.length)];
}

export function solveForPlayer(currentPrompt, cfg, activeWordlist, regenRandomLetter, regenLetters, REGENMODE_WEIGHTS) {
  let pool = wordsContaining(currentPrompt);
  
  if (currentMode === "regen-random" && regenRandomLetter) {
    pool = pool.filter(w => w.toUpperCase().includes(regenRandomLetter));
  }
  
  if (activeWordlist) {
    const wordlistWords = new Set(activeWordlist.words);
    const wordlistMatches = pool.filter(w => wordlistWords.has(w));
    if (wordlistMatches.length > 0) pool = wordlistMatches;
  }
  
  pool = sortWords(pool, cfg.sort);
  
  if (currentMode.startsWith("regen") && currentMode !== "regen-random") {
    const filteredPool = pool.filter(word => {
      for (let i = 0; i < word.length; i++) {
        const char = word[i];
        if (char >= 'A' && char <= 'Z' && regenLetters[char] > 0) return true;
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
  
  return pool.length > 0 ? pool[0] : null;
}

export function validateInput(mode, val, currentPrompt, WORD_SET, regenRandomLetter) {
  const hasPrompt = val.includes(currentPrompt.toLowerCase());
  const isWord = WORD_SET.has(val.toUpperCase());
  
  if (!hasPrompt) return { valid: false, message: `"${val}" doesn't contain "${currentPrompt}"` };
  if (!isWord) return { valid: false, message: `"${val}" isn't a valid word` };
  
  if (mode === "regen-random" && regenRandomLetter) {
    const hasLetter = val.toUpperCase().includes(regenRandomLetter);
    if (!hasLetter) return { valid: false, message: `"${val}" doesn't contain required letter "${regenRandomLetter}"` };
  }
  
  return { valid: true };
}
