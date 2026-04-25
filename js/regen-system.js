import { wordsContaining, REGENMODE_WEIGHTS } from "./utils/index.js";

let regenLetters = {};
let regenHearts = 0;
let regenRandomLetter = null;
let regenStartingCount = 1;

export function initRegen(startingCount = 1) {
  regenStartingCount = startingCount;
  regenLetters = {};
  for (let i = 65; i <= 90; i++) {
    const letter = String.fromCharCode(i);
    regenLetters[letter] = regenStartingCount;
  }
  renderRegenBar();
}

export function getRegenState() {
  return { regenLetters, regenHearts, regenRandomLetter, regenStartingCount };
}

export function setRegenRandomLetter(letter) {
  regenRandomLetter = letter;
}

export function updateRegenLetters(word) {
  const uniqueLetters = new Set();
  for (const char of word.toUpperCase()) {
    if (char >= 'A' && char <= 'Z') uniqueLetters.add(char);
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
    regenStartingCount++;
    initRegen(regenStartingCount);
    return { levelUp: true, newHearts: regenHearts };
  } else {
    renderRegenBar();
    return { levelUp: false };
  }
}

export function getRandomLetterForPrompt(prompt) {
  const promptLetters = new Set(prompt.toUpperCase());
  const availableLetters = [];
  const promptWords = wordsContaining(prompt);
  
  for (let i = 65; i <= 90; i++) {
    const letter = String.fromCharCode(i);
    if (!promptLetters.has(letter)) {
      const wordsWithBoth = promptWords.filter(w => w.toUpperCase().includes(letter));
      if (wordsWithBoth.length > 0) availableLetters.push(letter);
    }
  }
  
  return availableLetters.length > 0 
    ? availableLetters[Math.floor(Math.random() * availableLetters.length)]
    : null;
}

function renderRegenBar() {
  const container = document.getElementById("regen-letters");
  if (!container) return;
  
  container.innerHTML = "";
  
  for (let i = 65; i <= 90; i++) {
    const letter = String.fromCharCode(i);
    const count = regenLetters[letter];
    
    const letterDiv = document.createElement("div");
    letterDiv.className = "regen-letter";
    if (count === 0) letterDiv.classList.add("disabled");
    else if (count > 0) letterDiv.classList.add("active");
    
    letterDiv.innerHTML = `<div class="letter">${letter}</div><div class="count">${count}</div>`;
    container.appendChild(letterDiv);
  }
}

export function calculateRegenScore(word, regenLetters) {
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
  
  return score;
}

export function filterWordsForRegen(pool, regenLetters) {
  return pool.filter(word => {
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      if (char >= 'A' && char <= 'Z' && regenLetters[char] > 0) return true;
    }
    return false;
  });
}

export function selectBestRegenWord(pool, regenLetters) {
  if (pool.length === 0) return null;
  
  let bestWord = pool[0];
  let bestScore = 0;
  
  for (let i = 0; i < pool.length; i++) {
    const word = pool[i];
    const score = calculateRegenScore(word, regenLetters);
    
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
  
  return pool[0];
}

export function resetRegenSystem() {
  regenHearts = 0;
  regenRandomLetter = null;
  regenStartingCount = 1;
  initRegen(1);
}
