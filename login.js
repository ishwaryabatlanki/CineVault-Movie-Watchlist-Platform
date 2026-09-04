const form = document.querySelector("#loginForm");
const username = document.querySelector("#username");
const password = document.querySelector("#password");
const message = document.querySelector("#formMessage");
const togglePassword = document.querySelector("#togglePassword");

togglePassword.addEventListener("click", () => {
  const isPassword = password.type === "password";
  password.type = isPassword ? "text" : "password";
  togglePassword.textContent = isPassword ? "Hide" : "Show";
  togglePassword.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  message.textContent = "";

  const usernameValue = username.value.trim();
  const passwordValue = password.value;

  if (!usernameValue || !passwordValue) {
    message.textContent = "Please enter both your TMDB username and password.";
    return;
  }

  // This stores only the signed-in display name for the frontend session.
  // The password is intentionally not stored.
  sessionStorage.setItem("cinevault-user", usernameValue);
  sessionStorage.setItem("cinevault-session", "active");

  window.location.href = "/";
});
