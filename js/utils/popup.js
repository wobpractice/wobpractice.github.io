export function CustomAlert(message, title = "Notice") {
  const modal = document.getElementById("popup-modal");
  const titleEl = document.getElementById("popup-title");
  const messageEl = document.getElementById("popup-message");
  const cancelBtn = document.getElementById("popup-cancel");
  const okBtn = document.getElementById("popup-ok");
  
  titleEl.textContent = title;
  messageEl.textContent = message;
  cancelBtn.style.display = "none";
  
  modal.classList.add("show");
  
  return new Promise((resolve) => {
    const handleOk = () => {
      modal.classList.remove("show");
      okBtn.removeEventListener("click", handleOk);
      resolve(true);
    };
    
    okBtn.addEventListener("click", handleOk);
  });
}

export function CustomConfirm(message, title = "Confirm") {
  const modal = document.getElementById("popup-modal");
  const titleEl = document.getElementById("popup-title");
  const messageEl = document.getElementById("popup-message");
  const cancelBtn = document.getElementById("popup-cancel");
  const okBtn = document.getElementById("popup-ok");
  
  titleEl.textContent = title;
  messageEl.textContent = message;
  cancelBtn.style.display = "block";
  
  modal.classList.add("show");
  
  return new Promise((resolve) => {
    const handleOk = () => {
      modal.classList.remove("show");
      okBtn.removeEventListener("click", handleOk);
      cancelBtn.removeEventListener("click", handleCancel);
      resolve(true);
    };
    
    const handleCancel = () => {
      modal.classList.remove("show");
      okBtn.removeEventListener("click", handleOk);
      cancelBtn.removeEventListener("click", handleCancel);
      resolve(false);
    };
    
    okBtn.addEventListener("click", handleOk);
    cancelBtn.addEventListener("click", handleCancel);
  });
}
