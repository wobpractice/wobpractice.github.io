import PROMPTS_RAW from "../../data/prompts.js";
import WORDS from "../../data/words.js";
import { SN_PROMPTS } from "../../data/sn.js";

export const PROMPTS_LIST = Object.entries(PROMPTS_RAW);
export const WORD_SET = new Set(WORDS);
export { SN_PROMPTS };

const LETTER_WEIGHTS = { q:2, j:2, z:1, x:1.5, k:0.6, v:0.35, w:0.25, y:0.05, g:0.05, f:0.05 };
const HYPO_WEIGHTS = { "-":1, "'":3 };
export const REGENMODE_WEIGHTS = {
  q: 8.0, j: 7.5, x: 6.5, z: 6.0, k: 4.0, v: 3.5, w: 3.0, y: 2.5, 
  b: 2.0, f: 1.8, g: 1.5, h: 1.3, m: 1.2, p: 1.1, c: 1.0, d: 0.9,
  u: 0.8, l: 0.7, r: 0.6, t: 0.5, n: 0.4, s: 0.3, o: 0.2, i: 0.15, 
  a: 0.1, e: 0.05
};

function rareScore(w) { let s = 0; for (const c of w) s += (LETTER_WEIGHTS[c] || 0); return s; }
function hypoScore(w) { let s = 0; for (const c of w) s += (HYPO_WEIGHTS[c] || 0); return s; }

export { rareScore, hypoScore };
