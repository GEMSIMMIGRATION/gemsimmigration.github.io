/* GEMS Updates — Supabase integration is added after the project credentials are connected. */
document.addEventListener("DOMContentLoaded", () => {
  const search = document.getElementById("updateSearch");
  const grid = document.getElementById("updatesGrid");
  const login = document.getElementById("loginBtn");
  const status = document.getElementById("accountStatus");

  search?.addEventListener("input", () => {
    const term = search.value.trim().toLowerCase();
    grid?.querySelectorAll(".article-card").forEach(card => {
      card.hidden = term && !card.textContent.toLowerCase().includes(term);
    });
  });

  login?.addEventListener("click", () => {
    status.hidden = false;
    status.className = "account-status";
    status.textContent = "Google login will be connected here. Once connected, regular users will be returned to Updates and approved admins will see the publishing dashboard.";
  });
});