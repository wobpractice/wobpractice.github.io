import { loadStats, saveStats, loadStruggle, saveStruggle } from "./storage.js";

let stats = loadStats();
let struggleData = loadStruggle();
let currentPrompt = "";
let currentDiff = 0;
let startTime = Date.now();
let sessionStart = Date.now();
let score = 0;
let currentMode = "normal";
let practiceQueue = [];
let autoSolvedThisPrompt = false;

export function getState() {
  return { stats, struggleData, currentPrompt, currentDiff, startTime, sessionStart, score, currentMode, practiceQueue, autoSolvedThisPrompt };
}

export function updateState(updates) {
  Object.assign(getState(), updates);
}

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

export function getStruggleScore(key) {
  const d = struggleData[key]; 
  if (!d || !d.count) return 0;
  return Math.max(0, (d.totalTime / d.count) * 0.6 + (d.autoSolves / d.count) * 20);
}

export function setCurrentMode(mode) { currentMode = mode; }
export function getCurrentMode() { return currentMode; }
export function setCurrentPrompt(prompt, diff) { currentPrompt = prompt; currentDiff = diff; startTime = Date.now(); }
export function getCurrentPrompt() { return currentPrompt; }
export function getCurrentDiff() { return currentDiff; }
export function setAutoSolvedThisPrompt(value) { autoSolvedThisPrompt = value; }
export function getAutoSolvedThisPrompt() { return autoSolvedThisPrompt; }
