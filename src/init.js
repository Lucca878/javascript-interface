function startApp() {
  if (!window.SKIP_APP_INIT && document.getElementById("app")) {
    app.init();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startApp);
} else {
  startApp();
}