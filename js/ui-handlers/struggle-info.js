import { PROMPTS_LIST } from "../utils/data.js";
import { esc } from "../utils/text-utils.js";

export function updateStruggleInfo(getStruggleScore) {
  const info = document.getElementById("struggle-info");
  const entries = PROMPTS_LIST.map(([k]) => ({ key: k, score: getStruggleScore(k) }))
    .filter(e => e.score > 0).sort((a, b) => b.score - a.score).slice(0, 10);
  
  if (!entries.length) {
    info.textContent = "no struggle data yet — play some rounds first.";
  } else {
    info.innerHTML = "<b style='color:var(--t-txt);font-weight:500'>currently weighted high:</b> " +
      entries.map(e => `<span style='font-family:monospace'>${esc(e.key)}</span>`).join(", ");
  }
  info.classList.add("show");
}
