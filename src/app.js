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

  renderTaskLoadingState() {
    const appRoot = document.getElementById("app");

    if (appRoot) {
      appRoot.innerHTML = `
        <h1 class="title">Main Task</h1>
        <p class="subtitle">Loading statements...</p>
      `;
    }
  },

  renderTaskLoadErrorState() {
    const appRoot = document.getElementById("app");

    if (!appRoot) {
      return;
    }

    appRoot.innerHTML = `
      <h1 class="title">Main Task</h1>
      <p class="subtitle">We could not load the statement corpus from the server.</p>
      <div class="actions">
        <button class="button" id="taskRetryLoadButton">Retry loading statements</button>
      </div>
    `;

    document.getElementById("taskRetryLoadButton").addEventListener("click", () => {
      corpusService.corpus = null;
      corpusService.corpusSource = "placeholder";
      corpusService.loadPromise = null;
      this.showTaskPage();
    });
  },

  shouldRequirePhpCorpus() {
    return Boolean(window.APP_CONFIG && window.APP_CONFIG.corpusPhpEndpoint);
  },

  isPhpCorpusReady() {
    return (
      corpusService.corpusSource === "php" &&
      Array.isArray(corpusService.corpus) &&
      corpusService.corpus.length > 0
    );
  },

  waitForCorpusAndRenderTask(pushHistory) {
    if (!corpusService.loadPromise) {
      corpusService.preloadCorpus();
    }

    storage.setCurrentScreen("task");

    if (pushHistory) {
      this.pushHistoryState("task");
    }

    this.renderTaskLoadingState();

    corpusService.loadPromise.finally(() => {
      if (storage.getCurrentScreen() !== "task") {
        return;
      }

      if (!this.isPhpCorpusReady()) {
        this.renderTaskLoadErrorState();
        return;
      }

      const hasSession = this.ensureTaskSession();

      if (!hasSession) {
        this.renderTaskLoadErrorState();
        return;
      }

      renderTaskPage(this);
    });
  },

  hasPendingCorpusLoadWithoutTaskSession() {
    if (state.taskSession || storage.getTaskSession()) {
      return false;
    }

    const corpusAlreadyLoaded = Array.isArray(corpusService.corpus) && corpusService.corpus.length > 0;

    if (this.shouldRequirePhpCorpus()) {
      return !this.isPhpCorpusReady();
    }

    return Boolean(corpusService.loadPromise) && !corpusAlreadyLoaded;
  },

  createTaskSession() {
    const statement = corpusService.getRandomStatement();
    const originalPrediction = modelService.getPrediction(statement.text_truncated);

    state.taskSession = {
      statementId: String(statement.index),
      originalText: statement.text_truncated,
      corpusSource: corpusService.corpusSource || "placeholder",
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

  shouldRefreshTaskSessionFromPhp(taskSession) {
    if (!taskSession) {
      return false;
    }

    const phpCorpusLoaded = corpusService.corpusSource === "php";
    const sessionFromPhp = taskSession.corpusSource === "php";
    const untouchedSession =
      taskSession.attemptsUsed === 0 &&
      !taskSession.lastRewrite &&
      !taskSession.latestPrediction;

    return phpCorpusLoaded && !sessionFromPhp && untouchedSession;
  },

  ensureTaskSession() {
    if (state.taskSession) {
      if (this.shouldRefreshTaskSessionFromPhp(state.taskSession)) {
        this.createTaskSession();
      }
      return true;
    }

    const storedTaskSession = storage.getTaskSession();

    if (storedTaskSession) {
      if (this.shouldRefreshTaskSessionFromPhp(storedTaskSession)) {
        this.createTaskSession();
        return true;
      }

      state.taskSession = storedTaskSession;
      return true;
    }

    if (this.shouldRequirePhpCorpus() && !this.isPhpCorpusReady()) {
      return false;
    }

    this.createTaskSession();
    return true;
  },

  showTaskPage() {
    if (this.hasPendingCorpusLoadWithoutTaskSession()) {
      this.waitForCorpusAndRenderTask(true);
      return;
    }

    const hasSession = this.ensureTaskSession();

    if (!hasSession) {
      this.waitForCorpusAndRenderTask(true);
      return;
    }

    storage.setCurrentScreen("task");
    this.pushHistoryState("task");
    renderTaskPage(this);
  },

  restoreScreen() {
    const storedScreen = storage.getCurrentScreen();

    if (storedScreen === "task") {
      if (this.hasPendingCorpusLoadWithoutTaskSession()) {
        this.waitForCorpusAndRenderTask(false);
        return;
      }

      const hasSession = this.ensureTaskSession();

      if (!hasSession) {
        this.waitForCorpusAndRenderTask(false);
        return;
      }

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
    const configuredEndpoint = window.APP_CONFIG && window.APP_CONFIG.corpusPhpEndpoint;

    if (configuredEndpoint) {
      corpusService.setPhpEndpoint(configuredEndpoint);
    }

    // Start loading statements from PHP immediately; task flow will fallback safely if unavailable.
    corpusService.preloadCorpus();

    this.initializeParticipantId();
    this.restoreScreen();
    this.setupHistoryGuard();
  }
};