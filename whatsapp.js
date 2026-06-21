document.addEventListener("DOMContentLoaded", () => {
  const wrapper = document.getElementById("whatsappWrapper");
  const closeBtn = document.getElementById("whatsappClose");

  if (!wrapper || !closeBtn) return;

  const prompt = document.createElement("div");
  prompt.className = "whatsapp-prompt";
  prompt.textContent = "Need help with a visa or study pathway? Message us on WhatsApp.";
  wrapper.appendChild(prompt);

  if (localStorage.getItem("whatsappClosed") === "true") {
    wrapper.style.display = "none";
    return;
  }

  window.setTimeout(() => {
    wrapper.classList.add("show-prompt");
  }, 2500);

  window.setTimeout(() => {
    wrapper.classList.remove("show-prompt");
  }, 11000);

  closeBtn.addEventListener("click", () => {
    wrapper.style.display = "none";
    localStorage.setItem("whatsappClosed", "true");
  });
});
