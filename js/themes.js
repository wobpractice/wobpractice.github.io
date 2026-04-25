export const THEMES = {
  light:   { label:"light",   bg:"#ffffff", bg2:"#f5f5f4", bg3:"#eeede8", txt:"#1a1a1a", txt2:"#666",    txt3:"#aaa",    brd:"rgba(0,0,0,0.11)",   brd2:"rgba(0,0,0,0.2)",    acc:"#1D9E75", acc2:"rgba(29,158,117,0.13)",  err:"#E24B4A", fav:"#BA7517", inp:"#ffffff", card:"#ffffff" },
  dark:    { label:"dark",    bg:"#1a1a1a", bg2:"#242424", bg3:"#2e2e2e", txt:"#e8e8e8", txt2:"#999",    txt3:"#555",    brd:"rgba(255,255,255,0.1)",brd2:"rgba(255,255,255,0.18)",acc:"#1D9E75",acc2:"rgba(29,158,117,0.18)", err:"#E24B4A", fav:"#EF9F27", inp:"#242424", card:"#1f1f1f" },
  hacker:  { label:"hacker",  bg:"#0d0d0d", bg2:"#111",   bg3:"#161616", txt:"#00ff41", txt2:"#00cc33", txt3:"#006618", brd:"rgba(0,255,65,0.15)", brd2:"rgba(0,255,65,0.3)",  acc:"#00ff41",acc2:"rgba(0,255,65,0.1)",   err:"#ff3333", fav:"#ffff00", inp:"#111",   card:"#111"   },
  pink:    { label:"pink",    bg:"#fff0f5", bg2:"#ffe4ee", bg3:"#ffd6e5", txt:"#4b1528", txt2:"#993556", txt3:"#d4537e", brd:"rgba(212,83,126,0.15)",brd2:"rgba(212,83,126,0.3)",acc:"#D4537E",acc2:"rgba(212,83,126,0.12)",err:"#a32d2d", fav:"#BA7517", inp:"#fff0f5",card:"#fff8fb" },
  blue:    { label:"blue",    bg:"#f0f5ff", bg2:"#e0eafa", bg3:"#ccddf7", txt:"#042C53", txt2:"#185FA5", txt3:"#378ADD", brd:"rgba(55,138,221,0.15)",brd2:"rgba(55,138,221,0.3)",acc:"#185FA5",acc2:"rgba(24,95,165,0.12)", err:"#E24B4A", fav:"#BA7517", inp:"#f0f5ff",card:"#f8fbff" },
  crimson: { label:"crimson", bg:"#1a0505", bg2:"#240808", bg3:"#2e0a0a", txt:"#ffcccc", txt2:"#ff6666", txt3:"#882222", brd:"rgba(255,80,80,0.15)", brd2:"rgba(255,80,80,0.28)", acc:"#E24B4A",acc2:"rgba(226,75,74,0.15)", err:"#ff9999", fav:"#ffcc44", inp:"#240808",card:"#200707" },
  amber:   { label:"amber",   bg:"#1a1200", bg2:"#221800", bg3:"#2e2100", txt:"#fff8e0", txt2:"#EF9F27", txt3:"#854F0B", brd:"rgba(239,159,39,0.15)",brd2:"rgba(239,159,39,0.28)",acc:"#EF9F27",acc2:"rgba(239,159,39,0.15)",err:"#E24B4A", fav:"#EF9F27", inp:"#221800",card:"#1e1500" },
  mint:    { label:"mint",    bg:"#f0fff8", bg2:"#e0f7ef", bg3:"#c5f0e0", txt:"#04342C", txt2:"#0F6E56", txt3:"#1D9E75", brd:"rgba(29,158,117,0.15)",brd2:"rgba(29,158,117,0.28)",acc:"#0F6E56",acc2:"rgba(15,110,86,0.12)", err:"#E24B4A", fav:"#BA7517", inp:"#f0fff8",card:"#f8fffb" },
};

export let currentTheme = "light";

export function applyTheme(name) {
  const t = THEMES[name] || THEMES.light;
  const r = document.documentElement.style;
  r.setProperty("--t-bg",   t.bg);   r.setProperty("--t-bg2",  t.bg2);  r.setProperty("--t-bg3",  t.bg3);
  r.setProperty("--t-txt",  t.txt);  r.setProperty("--t-txt2", t.txt2); r.setProperty("--t-txt3", t.txt3);
  r.setProperty("--t-brd",  t.brd);  r.setProperty("--t-brd2", t.brd2);
  r.setProperty("--t-acc",  t.acc);  r.setProperty("--t-acc2", t.acc2);
  r.setProperty("--t-err",  t.err);  r.setProperty("--t-fav",  t.fav);
  r.setProperty("--t-inp-bg",  t.inp);
  r.setProperty("--t-card-bg", t.card);
  document.querySelectorAll(".theme-btn").forEach(b => b.classList.toggle("active", b.dataset.theme === name));
  currentTheme = name;
  try { localStorage.setItem("wb_theme", name); } catch {}
}

export function initThemes() {
  const tgrid = document.getElementById("theme-grid");
  Object.entries(THEMES).forEach(([k, t]) => {
    const btn = document.createElement("button");
    btn.className = "theme-btn";
    btn.dataset.theme = k;
    btn.style.cssText = `background:${t.bg};color:${t.txt};border-color:${t.brd2};`;
    btn.innerHTML = `<div style="width:100%;height:14px;border-radius:4px;background:${t.acc};margin-bottom:4px;"></div>${t.label}`;
    btn.addEventListener("click", () => applyTheme(k));
    tgrid.appendChild(btn);
  });
  try {
    const saved = localStorage.getItem("wb_theme");
    applyTheme(saved && THEMES[saved] ? saved : "light");
  } catch { applyTheme("light"); }
}
