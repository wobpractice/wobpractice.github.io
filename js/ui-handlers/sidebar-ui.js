export function createSidebarHandlers(switchTab) {
  document.querySelectorAll(".ni").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });
  
  document.getElementById("stoggle").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("collapsed");
  });
}
