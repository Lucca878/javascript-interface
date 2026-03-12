const app = {
  state: {
    participantId: null
  },

  STORAGE_KEY: "participantId",

  getProlificIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("PROLIFIC_PID");
  },

  getStoredParticipantId() {
    return sessionStorage.getItem(this.STORAGE_KEY);
  },

  storeParticipantId(participantId) {
    sessionStorage.setItem(this.STORAGE_KEY, participantId);
  },

  generateFallbackId() {
    if (window.crypto && crypto.randomUUID) {
      return crypto.randomUUID();
    }

    return "pid-" + Math.random().toString(36).slice(2, 11);
  },

  initializeParticipantId() {
    const prolificId = this.getProlificIdFromUrl();

    if (prolificId && prolificId.trim() !== "") {
      this.state.participantId = prolificId.trim();
      this.storeParticipantId(this.state.participantId);
      return;
    }

    const storedId = this.getStoredParticipantId();

    if (storedId && storedId.trim() !== "") {
      this.state.participantId = storedId.trim();
      return;
    }

    this.state.participantId = this.generateFallbackId();
    this.storeParticipantId(this.state.participantId);
  },

  renderWelcomePage() {
    const appRoot = document.getElementById("app");

    appRoot.innerHTML = `
      <h1 class="title">Welcome to the <em>'REWRITING TRUTHS AND LIES'</em> study</h1>

      <p class="lead">
        In this study, your task is to interact with an AI model that classifies
        statements as truthful or deceptive.
      </p>

      <p class="lead">
        On the next pages you will receive detailed task instructions.
      </p>

      <p class="lead">
        Once you complete the experiment, you will be redirected to Prolific.
      </p>

      <div class="info-box">
        <div class="info-label">Participant ID</div>
        <div class="info-value">${this.escapeHtml(this.state.participantId)}</div>
      </div>

      <div class="actions">
        <button class="button" id="nextButton">Next</button>
      </div>

      <div class="message" id="messageBox"></div>
    `;

    document
      .getElementById("nextButton")
      .addEventListener("click", this.handleNextClick.bind(this));
  },

  handleNextClick() {
    const messageBox = document.getElementById("messageBox");
    messageBox.textContent =
      "Next step placeholder: this will later open the consent page.";
    messageBox.classList.add("show");

    console.log("Participant ID:", this.state.participantId);
  },

  escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  init() {
    this.initializeParticipantId();
    this.renderWelcomePage();
  }
};

window.app = app;

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