import { saveConfig } from "../storage.js";

export function createConfigHandlers(cfg, generatePromptList) {
  document.getElementById("cfg-min").addEventListener("blur", () => {
    let v = parseInt(document.getElementById("cfg-min").value);
    if (isNaN(v) || v < 0) v = 0; 
    if (v > cfg.max) v = cfg.max;
    cfg.min = v; 
    document.getElementById("cfg-min").value = v; 
    generatePromptList(cfg);
    saveConfig(cfg);
  });

  document.getElementById("cfg-max").addEventListener("blur", () => {
    let v = parseInt(document.getElementById("cfg-max").value);
    if (isNaN(v) || v > 100) v = 100; 
    if (v < cfg.min) v = cfg.min;
    cfg.max = v; 
    document.getElementById("cfg-max").value = v; 
    generatePromptList(cfg);
    saveConfig(cfg);
  });

  ["cfg-min", "cfg-max"].forEach(id => {
    document.getElementById(id).addEventListener("keydown", e => { 
      if (e.key === "Enter") e.target.blur(); 
    });
  });

  document.getElementById("cfg-sort").addEventListener("change", e => { 
    cfg.sort = e.target.value; 
    saveConfig(cfg); 
  });

  function updateWeightSliders(changedSlider) {
    const slider2 = document.getElementById("cfg-weight-2");
    const slider3 = document.getElementById("cfg-weight-3");
    const value2El = document.getElementById("weight-2-value");
    const value3El = document.getElementById("weight-3-value");
    
    let weight2 = parseFloat(slider2.value);
    let weight3 = parseFloat(slider3.value);
    
    if (changedSlider === '2') {
      weight3 = Math.max(0, Math.min(1, 1 - weight2));
      slider3.value = weight3;
    } else if (changedSlider === '3') {
      weight2 = Math.max(0, Math.min(1, 1 - weight3));
      slider2.value = weight2;
    }
    
    cfg.weight2 = weight2;
    cfg.weight3 = weight3;
    
    value2El.textContent = weight2.toFixed(1);
    value3El.textContent = weight3.toFixed(1);
    
    saveConfig(cfg);
  }

  document.getElementById("cfg-weight-2").addEventListener("input", () => updateWeightSliders('2'));
  document.getElementById("cfg-weight-3").addEventListener("input", () => updateWeightSliders('3'));
  document.getElementById("cfg-weights-enabled").addEventListener("change", e => {
    cfg.weightsEnabled = e.target.checked;
    saveConfig(cfg);
  });
}
