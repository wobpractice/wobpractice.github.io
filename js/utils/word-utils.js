import { rareScore, hypoScore } from "./data.js";
import WORDS from "../../data/words.js";

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
