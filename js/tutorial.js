const PAGES = [
  {
    title: "welcome",
    h: "welcome to wordbomb practice",
    body: `
      <p>This tool is a practice companion for Word Bomb. Use it to drill prompts, track your weak spots, and build the instant word recall that separates good players from great ones.</p>
      <p>Navigate using the sidebar on the left. Click <b>?</b> at the bottom of the sidebar to return here at any time.</p>
      <div class="tut-tip">New here? Read through the pages in order. Already familiar? Jump to any section using the left panel.</div>
    `
  },
  /*{
    title: "how to play",
    h: "how to play",
    body: `
      <p>Each round gives you a short prompt — 2 to 3 letters. Type any valid English word containing that prompt as a substring, then press Enter.</p>
      <div class="tut-tip"><b>Example:</b> Prompt is <span class="tut-key">str</span> → valid answers include <span class="tut-key">street</span>, <span class="tut-key">strong</span>, <span class="tut-key">abstract</span>.</div>
      <p>If the prompt itself is a valid dictionary word, it turns <b>green</b> — you can type it directly and submit.</p>
      <p>While typing, the preview above the input highlights the prompt inside your word in real time.</p>
      <div class="tut-tip">
        <b>Shortcuts:</b><br>
        <span class="tut-key">Enter</span> on empty input → auto-solve<br>
        <span class="tut-key">^</span> or <span class="tut-key">6</span> → also auto-solves<br>
        Both are useful when stuck, but struggle mode will notice frequent use.
      </div>
    `
  },*/
  {
    title: "modes",
    h: "practice modes",
    body: `
      <p>Open the <b>modes</b> tab to choose how you practice. Click a card to start immediately.</p>
      <div class="tut-tip"><b>Normal</b> — random prompts within your configured solve rate range. Good for general sessions.</div>
      <div class="tut-tip"><b>All prompts — sequential</b> — every prompt in the game, hardest first. Full coverage drill.</div>
      <div class="tut-tip"><b>Favorites — random</b> — your starred prompts shuffled. Priority (✦) prompts appear 3× more.</div>
      <div class="tut-tip"><b>Favorites — sequential</b> — starred prompts alphabetically, one by one.</div>
      <div class="tut-tip"><b>Priority only</b> — exclusively drills ✦ prompts. For focused cramming.</div>
      <div class="tut-tip warn"><b>Struggle mode</b> — weights prompts you're slow on or frequently auto-solve. Self-adjusts as you improve.</div>
    `
  },
  {
    title: "favorites & priority",
    h: "favorites & priority",
    body: `
      <p>Two star buttons appear in the top-right of the prompt card during the game.</p>
      <div class="tut-tip"><b>★ gold star</b> — favorites the prompt. Saved locally, available for all favorites modes.</div>
      <div class="tut-tip"><b>✦ pink star</b> — marks a favorited prompt as priority. Appears only after favoriting. Gets 3× weight in random favorites practice.</div>
      <p>Use favorites to track prompts you need to work on. Use priority for the ones actively costing you lives.</p>
      <p>Export your list from the Favorites tab as JSON and import it back later — useful for backups or moving to another device.</p>
    `
  },
  {
    title: "struggle mode",
    h: "struggle mode",
    body: `
      <p>Struggle mode tracks two signals per prompt: <b>how long you take</b> and <b>how often you auto-solve</b>. These combine into a struggle score.</p>
      <p>Prompts with higher scores appear more often. Ones you nail quickly appear less. The pool shifts as you play.</p>
      <div class="tut-tip"><b>Recommended flow:</b> Run a normal or all-prompts session first to populate data. Then switch to struggle mode to focus automatically on your weakest prompts.</div>
      <p>The Modes tab shows which prompts are currently weighted highest. Use the "clear struggle data" button there to reset.</p>
    `
  },
  {
    title: "lookup tool",
    h: "lookup tool",
    body: `
      <p>The <b>lookup</b> tab has two tools.</p>
      <div class="tut-tip"><b>Prompt lookup</b> — type a prompt to see its solve rate and every valid word containing it (up to 222). Sorted by your current solve sort setting.</div>
      <div class="tut-tip"><b>Word → prompts breakdown</b> — type a word to see every prompt from the game's list that appears inside it, sorted hardest first with solve rates. Use this to find "multi-cover" words.</div>
      <p>Multi-cover words are one of the highest-leverage tools in Word Bomb preparation. A single memorised word can serve as a reliable answer for several hard prompts at once.</p>
    `
  },
  {
    title: "wordlists",
    h: "wordlists",
    body: `
      <p>The <b>wordlists</b> tab lets you create custom word collections that enhance the solve sort functionality. Auto-solve will prioritize words from your active wordlist.</p>
      <div class="tut-tip"><b>Default wordlists</b> - Five fixed lists containing all words with specific substrings: fish, wood, super, hyper, and man.</div>
      <div class="tut-tip"><b>Custom wordlists</b> - Create your own lists with up to 500 words each. Edit title, description, and word content.</div>
      <div class="tut-tip"><b>Import from files</b> - Import line-separated TXT files. Words are validated and converted to uppercase.</div>
      <div class="tut-tip"><b>Substring insertion</b> - Add all words containing a specific substring to a wordlist.</div>
      <div class="tut-tip"><b>Active wordlist</b> - Click "make active" to prioritize that wordlist's words in auto-solve. Auto-solve will choose from the active wordlist first when possible.</div>
      <p>Use wordlists to organize vocabulary by theme, difficulty, or learning goals. Great for focused practice sessions.</p>
    `
  },
  {
    title: "regen modes",
    h: "regen game modes",
    body: `
      <p><b>Regen modes</b> are special game modes that add unique challenges beyond standard Word Bomb practice.</p>
      <div class="tut-tip"><b>Regen Random Letter</b> - Type a word containing both the prompt AND a random letter shown beside the prompt. The random letter is guaranteed to have valid solutions.</div>
      <div class="tut-tip"><b>Regen Regular</b> - Collect hearts by using letters until all counts reach 0. Each letter starts at count 1. Score = hearts collected. Uses letters with highest counts first for auto-solve.</div>
      <div class="tut-tip"><b>Regen Ranked</b> - Same as Regen Regular but more challenging - letters start at count 3 instead of 1.</div>
      <div class="tut-tip"><b>How Regen works</b> - The letter bar shows all 26 letters with their current counts. Using a word decrements the count for each letter used. When all letters reach 0, you collect a heart and the bar regenerates.</div>
      <div class="tut-tip"><b>Auto-solve priority</b> - In Regen modes, auto-solve prioritizes words with the highest letter counts, accounting for letter rarity (J > E).</div>
      <p>Regen modes add strategic depth - you must balance using high-count letters with finding valid words quickly!</p>
    `
  },
  {
    title: "configuration",
    h: "configuration",
    body: `
      <div class="tut-tip"><b>Solve rate filter</b> — controls which prompts appear in normal mode. Min 0 / Max 50 = hard prompts only. Min 60 / Max 100 = easy warm-up. No effect on favorites or all-prompts modes.</div>
      <div class="tut-tip"><b>Solve sort</b> — order auto-solve uses when revealing a word. "Shortest first" → easiest to remember. "Rare letters first" → uncommon words useful for bonus rounds.</div>
      <div class="tut-tip"><b>Theme</b> — 8 visual themes. Saved between visits.</div>
    `
  },
  {
    title: "tips & tricks",
    h: "vocabulary strategy",
    body: `
      <p>How you organise your vocabulary matters as much as the size of it. Here are the principles that make the biggest difference.</p>

      <div class="tut-tip">
        <b>Prefixes and suffixes + Compound Words</b><br>
        Many prompts become obvious once you recognise the prefix or suffix they slot into. For example:<br>
        &nbsp;· <span class="tut-key">tih</span> → think <b>anti + h</b> → <span class="tut-key">antihistamine</span>, <span class="tut-key">antihero</span><br>
        &nbsp;· <span class="tut-key">utf</span> → think <b>out + f</b> → <span class="tut-key">oufish</span>, <span class="tut-key">outfield</span>, <span class="tut-key">outfight</span><br>
        &nbsp;· <span class="tut-key">ntm</span> → think <b>nt + man or nt + ment</b> → <span class="tut-key">stuntman</span>, <span class="tut-key">enchantment</span><br>
        <br>
        Additionally, compound words can help you solve many prompts. Think of letters at word/syllable boundaries.<br>
        &nbsp;· <span class="tut-key">hq</span> → <b>earthquake</b><br>
        &nbsp;· <span class="tut-key">shc</span> → <b>ashcake</b><br>
        &nbsp;· <span class="tut-key">eov</span> → <b>voiceover</b><br>
        &nbsp;· <span class="tut-key">doh</span> → <b>pseudopseudohypoparathyroidism</b><br>
        &nbsp;· <span class="tut-key">oen</span> → <b>gastroenterological</b><br>
        Train yourself to see prompts as fragments of larger structural patterns, not isolated letter strings.
      </div>

      <div class="tut-tip">
        <b>Easy vs. hard prompts — keep your word banks separate.</b><br>
        Don't waste your best words on easy prompts. If a prompt has a 70%+ solve rate, almost any word works — use whatever comes to mind. Save your memorised backup words for prompts below 40%. That's where having a prepared word is the actual difference between surviving and losing a life.
      </div>

      <div class="tut-tip">
        <b>Know two words per hard prompt.</b><br>
        One backup word is the minimum. Two is reliable. If your go-to word gets stolen by another player (Word Bomb penalises repeating used words), you need an immediate second option. Drill both. Don't need a third — just two fast, confident answers.
      </div>

      <div class="tut-tip">
        <b>Word families: verbs > adjectives > nouns.</b><br>
        When building your backup words, prefer verbs and adjectives over nouns. Here's why:<br>
        &nbsp;· <b>Verbs</b> inflect the most: base, -s, -ed, -ing, -er — five forms from one root<br>
        &nbsp;· <b>Adjectives</b> give you: base, -er, -est, -ly, -ness, -nesses — multiple forms<br>
        &nbsp;· <b>Nouns</b> usually give you only two: singular and plural<br>
        A single verb like <span class="tut-key">strengthen</span> covers <span class="tut-key">strengthens</span>, <span class="tut-key">strengthened</span>, <span class="tut-key">strengthening</span> — all valid, all different answers if needed.
      </div>

      <div class="tut-tip">
        <b>Multi-cover words are the most efficient preparation.</b><br>
        Use the word → prompts breakdown tool to find words that contain several hard prompts at once. A word like <span class="tut-key">straightforward</span> covers <span class="tut-key">str</span>, <span class="tut-key">rai</span>, <span class="tut-key">aig</span>, <span class="tut-key">igh</span>, <span class="tut-key">ght</span>, <span class="tut-key">htf</span>, <span class="tut-key">tfo</span>, <span class="tut-key">for</span>, <span class="tut-key">orw</span>, <span class="tut-key">rwa</span>, <span class="tut-key">war</span>, <span class="tut-key">ard</span> — memorising one long word can handle a dozen prompts simultaneously.
      </div>
    `
  },
];

export function initTutorial() {
  const overlay = document.getElementById("tut-overlay");
  const nav     = document.getElementById("tut-nav");
  const body    = document.getElementById("tut-body");

  PAGES.forEach((page, i) => {
    const btn = document.createElement("button");
    btn.className = "tni" + (i === 0 ? " active" : "");
    btn.dataset.page = i;
    btn.textContent = page.title;
    nav.appendChild(btn);

    const div = document.createElement("div");
    div.className = "tut-page" + (i === 0 ? " active" : "");
    div.dataset.page = i;
    div.innerHTML = `<div class="tut-h">${page.h}</div>${page.body}`;
    body.appendChild(div);
  });

  nav.querySelectorAll(".tni").forEach(btn => {
    btn.addEventListener("click", () => {
      nav.querySelectorAll(".tni").forEach(b => b.classList.remove("active"));
      body.querySelectorAll(".tut-page").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      body.querySelector(`.tut-page[data-page="${btn.dataset.page}"]`).classList.add("active");
    });
  });

  document.getElementById("help-btn").addEventListener("click", () => overlay.classList.add("show"));
  document.getElementById("tut-close").addEventListener("click", () => overlay.classList.remove("show"));
  overlay.addEventListener("click", e => { if (e.target === overlay) overlay.classList.remove("show"); });

  try {
    if (!localStorage.getItem("wb_seen")) {
      overlay.classList.add("show");
      localStorage.setItem("wb_seen", "1");
    }
  } catch {}
}
