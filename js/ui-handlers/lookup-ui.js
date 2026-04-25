import { sortWords, wordsContaining, esc, hlWord } from "../utils/index.js";

export function createLookupHandlers(cfg, PROMPTS_RAW) {
  const lookupInp = document.getElementById("lookup-inp");
  lookupInp.addEventListener("input", () => { 
    lookupInp.value = lookupInp.value.replace(/[^a-zA-Z]/g, "").slice(0, 5).toUpperCase(); 
  });

  function doLookup() {
    const raw = lookupInp.value; 
    if (!raw) return;
    const p = raw.toLowerCase();
    const solves = sortWords(wordsContaining(p), cfg.sort);
    const rate = PROMPTS_RAW[raw] ?? PROMPTS_RAW[p];
    const rateStr = rate !== undefined ? rate + "%" : "?";
    
    document.getElementById("lookup-res").innerHTML = `Solve Rate = <b>${rateStr}</b>, Sub = <b>${solves.length}</b>`;
    const wl = document.getElementById("word-list"); 
    wl.innerHTML = "";
    solves.slice(0, 222).forEach(w => {
      const pill = document.createElement("div"); 
      pill.className = "wpill";
      pill.innerHTML = hlWord(w, p); 
      wl.appendChild(pill);
    });
  }

  document.getElementById("lookup-btn").addEventListener("click", doLookup);
  lookupInp.addEventListener("keydown", e => { 
    if (e.key === "Enter") doLookup(); 
  });
}

export function createBreakdownHandlers(PROMPTS_LIST) {
  const bdInp = document.getElementById("word-breakdown-inp");
  bdInp.addEventListener("input", () => { 
    bdInp.value = bdInp.value.replace(/[^a-zA-Z\-']/g, "").toUpperCase(); 
  });

  function doBreakdown() {
    const word = bdInp.value.toLowerCase(); 
    if (!word) return;
    const container = document.getElementById("breakdown-list"); 
    container.innerHTML = "";
    const matches = [];
    
    PROMPTS_LIST.forEach(([key, rate]) => { 
      if (word.includes(key.toLowerCase())) matches.push([key, rate]); 
    });
    matches.sort((a, b) => a[1] - b[1]);
    
    if (!matches.length) { 
      container.innerHTML = '<span style="font-size:13px;color:var(--t-txt3);">no known prompts found in this word</span>';
      return; 
    }
    
    matches.forEach(([key, rate]) => {
      const pill = document.createElement("div"); 
      pill.className = "bpill";
      pill.innerHTML = `<span style="font-family:monospace;color:var(--t-txt)">${esc(key)}</span><span class="bpill-rate">${rate.toFixed(1)}%</span>`;
      container.appendChild(pill);
    });
  }

  document.getElementById("breakdown-btn").addEventListener("click", doBreakdown);
  bdInp.addEventListener("keydown", e => { 
    if (e.key === "Enter") doBreakdown(); 
  });
}
