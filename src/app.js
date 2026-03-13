window.app = {
  getProlificIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("PROLIFIC_PID");
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
      state.participantId = prolificId.trim();
      storage.setParticipantId(state.participantId);
      return;
    }

    const storedId = storage.getParticipantId();

    if (storedId && storedId.trim() !== "") {
      state.participantId = storedId.trim();
      return;
    }

    state.participantId = this.generateFallbackId();
    storage.setParticipantId(state.participantId);
  },

  showWelcomePage() {
    storage.setCurrentScreen("welcome");
    renderWelcomePage(this);
  },

  showConsentPage() {
    storage.setCurrentScreen("consent");
    renderConsentPage(this);
  },

  restoreScreen() {
    const storedScreen = storage.getCurrentScreen();

    if (storedScreen === "consent") {
      this.showConsentPage();
      return;
    }

    this.showWelcomePage();
  },

  handleConsentAccept() {
    state.consentData = "Accepted";

    const messageBox = document.getElementById("messageBox");
    messageBox.textContent =
      "Consent accepted. Next step placeholder: this will later open the instructions page.";
    messageBox.classList.add("show");

    console.log("Consent:", state.consentData);
  },

  handleConsentDeny() {
    state.consentData = "Denied";

    const messageBox = document.getElementById("messageBox");
    messageBox.textContent =
      "Consent denied. Next step placeholder: this will later open the end page.";
    messageBox.classList.add("show");

    console.log("Consent:", state.consentData);
  },

  init() {
    this.initializeParticipantId();
    this.restoreScreen();
  }
};