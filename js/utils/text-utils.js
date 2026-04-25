import { WORD_SET } from "./data.js";

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

export function formatTime(s) {
  if (s < 60)   return s + "s";
  if (s < 3600) return Math.floor(s/60) + "m " + Math.floor(s%60) + "s";
  return Math.floor(s/3600) + "h " + Math.floor((s%3600)/60) + "m";
}
