import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://ttdwrfasdedlwldxwetp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_w_4Vv6NURyKovbEIOgfGyA_sxYxeuVp";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const $ = (id) => document.getElementById(id);
const search = $("updateSearch");
const grid = $("updatesGrid");
const loginBtn = $("loginBtn");
const status = $("accountStatus");
const adminPanel = $("adminPanel");

function showStatus(message, type = "") {
  if (!status) return;
  status.hidden = false;
  status.className = "account-status " + type;
  status.textContent = message;
}

async function getAdminStatus() {
  const { data, error } = await supabase.rpc("get_my_admin_status");

  if (error) {
    console.error("Admin status check failed:", error);
    return false;
  }

  return data === true;
}

async function handleUser(user) {
  if (!user) {
    if (adminPanel) adminPanel.hidden = true;
    if (loginBtn) loginBtn.innerHTML = "<span>Continue with Google</span>";
    return;
  }

  if (loginBtn) loginBtn.innerHTML = "<span>Sign out</span>";

  // Ensure the user's profile exists.
  const { data: existing, error: lookupError } = await supabase
    .from("login_users")
    .select("email, full_name, avatar_url")
    .eq("email", user.email)
    .maybeSingle();

  if (lookupError) {
    console.error("Profile lookup failed:", lookupError);
  }

  if (!existing) {
    const { error } = await supabase.from("login_users").insert({
      email: user.email,
      full_name:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email,
      avatar_url:
        user.user_metadata?.avatar_url ||
        user.user_metadata?.picture ||
        null,
      is_admin: false
    });

    if (error) console.error("Profile creation failed:", error);
  }

  // IMPORTANT: admin status is checked through the secure database function,
  // not by trusting a client-readable is_admin field.
  const isAdmin = await getAdminStatus();

  if (isAdmin) {
    if (adminPanel) adminPanel.hidden = false;
    showStatus("Signed in as an administrator.");
  } else {
    if (adminPanel) adminPanel.hidden = true;
    showStatus("Signed in successfully. You have read-only access to Updates.");
  }

  await loadUpdates();
}

loginBtn?.addEventListener("click", async () => {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (session) {
    await supabase.auth.signOut();
    if (adminPanel) adminPanel.hidden = true;
    showStatus("Signed out.");
    loginBtn.innerHTML = "<span>Continue with Google</span>";
    return;
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin + window.location.pathname
    }
  });

  if (error) {
    showStatus("Google login could not start: " + error.message, "error");
  }
});

search?.addEventListener("input", () => {
  const term = search.value.trim().toLowerCase();

  grid?.querySelectorAll(".article-card").forEach((card) => {
    card.hidden =
      term.length > 0 &&
      !card.textContent.toLowerCase().includes(term);
  });
});

async function loadUpdates() {
  const { data, error } = await supabase
    .from("updates")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Updates load failed:", error);
    return;
  }

  if (!data?.length) {
    if ($("updateCount")) $("updateCount").textContent = "0 updates";
    if ($("noUpdates")) $("noUpdates").hidden = false;
    return;
  }

  grid.innerHTML = data
    .map(
      (update) => `
      <article class="article-card">
        <div class="article-category">${escapeHtml(update.category)}</div>
        <div class="article-body">
          <p class="article-meta">${formatDate(update.created_at)}</p>
          <h3>${escapeHtml(update.title)}</h3>
          <p>${escapeHtml(update.summary)}</p>
          <button class="text-link update-read-btn" data-id="${update.id}" type="button">
            Read update
          </button>
        </div>
      </article>
    `
    )
    .join("");

  if ($("updateCount")) {
    $("updateCount").textContent =
      data.length + (data.length === 1 ? " update" : " updates");
  }

  if ($("noUpdates")) $("noUpdates").hidden = true;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

supabase.auth.getSession().then(({ data: { session } }) => {
  handleUser(session?.user || null);
});

supabase.auth.onAuthStateChange((_event, session) => {
  handleUser(session?.user || null);
});

loadUpdates();
