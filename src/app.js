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

  countWords(text) {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
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

  createTaskSession() {
    const statement = corpusService.getRandomStatement();
    const originalPrediction = modelService.getPrediction(statement.text_truncated);

    state.taskSession = {
      statementId: String(statement.index),
      originalText: statement.text_truncated,
      originalPrediction,
      attemptsUsed: 0,
      maxAttempts: 10,
      lastRewrite: "",
      draftText: "",
      latestPrediction: null,
      statusMessage: "",
      statusType: "info"
    };

    storage.setTaskSession(state.taskSession);
  },

  ensureTaskSession() {
    if (state.taskSession) {
      return;
    }

    const storedTaskSession = storage.getTaskSession();

    if (storedTaskSession) {
      state.taskSession = storedTaskSession;
      return;
    }

    this.createTaskSession();
  },

  showTaskPage() {
    this.ensureTaskSession();
    storage.setCurrentScreen("task");
    this.pushHistoryState("task");
    renderTaskPage(this);
  },

  restoreScreen() {
    const storedScreen = storage.getCurrentScreen();

    if (storedScreen === "task") {
      this.ensureTaskSession();
      renderTaskPage(this);
      return;
    }

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
    this.showTaskPage();

    console.log("Instructions completed");
  },

  handleTaskSubmit() {
    const taskSession = state.taskSession;
    const rewriteInput = document.getElementById("taskRewriteInput");
    const rewriteText = rewriteInput.value.trim();

    if (!rewriteText) {
      taskSession.statusMessage = "Please write a statement before submitting.";
      taskSession.statusType = "warning";
      storage.setTaskSession(taskSession);
      renderTaskPage(this);
      return;
    }

    const originalWordCount = this.countWords(taskSession.originalText);
    const rewriteWordCount = this.countWords(rewriteText);

    if (Math.abs(rewriteWordCount - originalWordCount) > 20) {
      taskSession.draftText = rewriteText;
      taskSession.statusMessage = `Your rewritten statement must stay within ${originalWordCount} +/- 20 words. Your current rewrite has ${rewriteWordCount} words.`;
      taskSession.statusType = "warning";
      storage.setTaskSession(taskSession);
      renderTaskPage(this);
      return;
    }

    if (taskSession.attemptsUsed >= taskSession.maxAttempts) {
      taskSession.draftText = rewriteText;
      taskSession.statusMessage = "You have already used all available attempts for this statement.";
      taskSession.statusType = "warning";
      storage.setTaskSession(taskSession);
      renderTaskPage(this);
      return;
    }

    const latestPrediction = modelService.getPrediction(rewriteText);
    taskSession.attemptsUsed += 1;
    taskSession.lastRewrite = rewriteText;
    taskSession.draftText = "";
    taskSession.latestPrediction = latestPrediction;
    taskSession.statusType = "info";

    if (latestPrediction.label !== taskSession.originalPrediction.label) {
      taskSession.statusMessage = "Placeholder success state: the rewrite flipped the model prediction.";
    } else if (taskSession.attemptsUsed >= taskSession.maxAttempts) {
      taskSession.statusMessage = "Placeholder end-of-attempts state: you reached the maximum number of rewrites for this statement.";
      taskSession.statusType = "warning";
    } else {
      taskSession.statusMessage = "Placeholder feedback state: the prediction did not flip yet, so the participant can try another rewrite.";
    }

    storage.setTaskSession(taskSession);
    renderTaskPage(this);
  },

  init() {
    this.initializeParticipantId();
    this.restoreScreen();
    this.setupHistoryGuard();
  }
};