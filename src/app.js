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

  pushHistoryState(screenName) {
    window.history.pushState({ screen: screenName }, "", window.location.href);
  },

  replaceHistoryState(screenName) {
    window.history.replaceState({ screen: screenName }, "", window.location.href);
  },

  handlePopState() {
    const currentScreen = storage.getCurrentScreen() || "welcome";
    this.replaceHistoryState(currentScreen);
    this.restoreScreen();
  },

  setupHistoryGuard() {
    this.replaceHistoryState(storage.getCurrentScreen() || "welcome");

    window.addEventListener("popstate", () => {
      this.handlePopState();
    });
  },

  showWelcomePage() {
    storage.setCurrentScreen("welcome");
    this.pushHistoryState("welcome");
    renderWelcomePage(this);
  },

  showConsentPage() {
    storage.setCurrentScreen("consent");
    this.pushHistoryState("consent");
    renderConsentPage(this);
  },

  showInstructionsPage() {
    storage.setCurrentScreen("instructions");
    this.pushHistoryState("instructions");
    renderInstructionsPage(this);
  },

  restoreScreen() {
    const storedScreen = storage.getCurrentScreen();

    if (storedScreen === "instructions") {
      renderInstructionsPage(this);
      return;
    }

    if (storedScreen === "consent") {
      renderConsentPage(this);
      return;
    }

    renderWelcomePage(this);
  },

  handleConsentAccept() {
    state.consentData = "Accepted";
    this.showInstructionsPage();

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

  handleInstructionsNext() {
    const messageBox = document.getElementById("messageBox");
    messageBox.textContent =
      "Next step placeholder: this will later open the task page.";
    messageBox.classList.add("show");

    console.log("Instructions completed");
  },

  init() {
    this.initializeParticipantId();
    this.restoreScreen();
    this.setupHistoryGuard();
  }
};