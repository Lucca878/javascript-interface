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

      this.resolveTaskSessionAndRender();
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
    const statementId = String(statement.index);
    const originalText = statement.text_truncated;

    if (modelService.getApiEndpoint()) {
      return modelService.getPrediction(originalText, {
        participantId: state.participantId,
        statementIndex: statementId
      }).then((originalPrediction) => {
        state.taskSession = {
          statementId,
          originalText,
          corpusSource: corpusService.corpusSource || "placeholder",
          originalPrediction,
          attemptsUsed: 0,
          maxAttempts: 10,
          isComplete: false,
          lastRewrite: "",
          draftText: "",
          latestPrediction: null,
          statusMessage: "",
          statusType: "info"
        };

        storage.setTaskSession(state.taskSession);
        return true;
      });
    }

    const originalPrediction = modelService.getPredictionSync(originalText);

    state.taskSession = {
      statementId,
      originalText,
      corpusSource: corpusService.corpusSource || "placeholder",
      originalPrediction,
      attemptsUsed: 0,
      maxAttempts: 10,
      isComplete: false,
      lastRewrite: "",
      draftText: "",
      latestPrediction: null,
      statusMessage: "",
      statusType: "info"
    };

    storage.setTaskSession(state.taskSession);
    return true;
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
        return this.createTaskSession();
      }
      return true;
    }

    const storedTaskSession = storage.getTaskSession();

    if (storedTaskSession) {
      if (this.shouldRefreshTaskSessionFromPhp(storedTaskSession)) {
        return this.createTaskSession();
      }

      state.taskSession = storedTaskSession;
      return true;
    }

    if (this.shouldRequirePhpCorpus() && !this.isPhpCorpusReady()) {
      return false;
    }

    return this.createTaskSession();
  },

  resolveTaskSessionAndRender() {
    const sessionResult = this.ensureTaskSession();

    if (sessionResult && typeof sessionResult.then === "function") {
      this.renderTaskLoadingState();
      sessionResult
        .then(() => {
          if (storage.getCurrentScreen() !== "task") {
            return;
          }

          renderTaskPage(this);
        })
        .catch((error) => {
          const appRoot = document.getElementById("app");
          if (appRoot) {
            appRoot.innerHTML = `
              <h1 class="title">Main Task</h1>
              <p class="subtitle">We could not load the original AI prediction.</p>
              <p class="subtitle">${utils.escapeHtml(error.message || "Please try again.")}</p>
              <div class="actions">
                <button class="button" id="taskRetryLoadButton">Retry loading task</button>
              </div>
            `;
            document.getElementById("taskRetryLoadButton").addEventListener("click", () => {
              state.taskSession = null;
              storage.clearTaskSession();
              this.showTaskPage();
            });
          }
        });
      return;
    }

    if (!sessionResult) {
      this.waitForCorpusAndRenderTask(storage.getCurrentScreen() !== "task");
      return;
    }

    renderTaskPage(this);
  },

  showTaskPage() {
    if (this.hasPendingCorpusLoadWithoutTaskSession()) {
      this.waitForCorpusAndRenderTask(true);
      return;
    }

    storage.setCurrentScreen("task");
    this.pushHistoryState("task");
    this.resolveTaskSessionAndRender();
  },

  showFeedbackPage() {
    this.ensureFeedbackSession();
    storage.setCurrentScreen("feedback");
    this.pushHistoryState("feedback");
    renderFeedbackPage(this);
  },

  getDefaultFeedbackSession() {
    return {
      motivationScale: 5,
      difficultyScale: 5,
      motivationAnswered: false,
      difficultyAnswered: false,
      strategies: "",
      feedback: "",
      statusMessage: "",
      statusType: "info",
      submitted: false
    };
  },

  ensureFeedbackSession() {
    if (state.feedbackSession) {
      return state.feedbackSession;
    }

    const storedFeedbackSession = storage.getFeedbackSession();

    if (storedFeedbackSession) {
      state.feedbackSession = {
        ...this.getDefaultFeedbackSession(),
        ...storedFeedbackSession
      };
      storage.setFeedbackSession(state.feedbackSession);
      return state.feedbackSession;
    }

    state.feedbackSession = this.getDefaultFeedbackSession();
    storage.setFeedbackSession(state.feedbackSession);
    return state.feedbackSession;
  },

  updateFeedbackSessionField(fieldName, value) {
    const feedbackSession = this.ensureFeedbackSession();
    feedbackSession[fieldName] = value;
    storage.setFeedbackSession(feedbackSession);
  },

  handleFeedbackSubmit() {
    const feedbackSession = this.ensureFeedbackSession();
    const strategiesInput = document.getElementById("strategiesInput");
    const feedbackInput = document.getElementById("feedbackInput");
    const motivationScaleInput = document.getElementById("motivationScaleInput");
    const difficultyScaleInput = document.getElementById("difficultyScaleInput");

    feedbackSession.motivationScale = Number(motivationScaleInput.value);
    feedbackSession.difficultyScale = Number(difficultyScaleInput.value);
    feedbackSession.strategies = strategiesInput.value;
    feedbackSession.feedback = feedbackInput.value;

    if (
      !feedbackSession.strategies.trim() ||
      !feedbackSession.motivationAnswered ||
      !feedbackSession.difficultyAnswered
    ) {
      feedbackSession.statusMessage = "Please answer all required questions before submitting.";
      feedbackSession.statusType = "warning";
      storage.setFeedbackSession(feedbackSession);
      renderFeedbackPage(this);
      return;
    }

    feedbackSession.statusMessage = "Thank you for your feedback.";
    feedbackSession.statusType = "info";
    feedbackSession.submitted = true;
    storage.setFeedbackSession(feedbackSession);

    state.feedbackSubmission = {
      pid: state.participantId,
      motivation_scale: feedbackSession.motivationScale,
      difficulty_scale: feedbackSession.difficultyScale,
      strategies: feedbackSession.strategies,
      feedback: feedbackSession.feedback,
      submittedAt: new Date().toISOString()
    };
    storage.setFeedbackSubmission(state.feedbackSubmission);

    renderFeedbackPage(this);
  },

  restoreScreen() {
    const storedScreen = storage.getCurrentScreen();

    if (storedScreen === "feedback") {
      this.ensureFeedbackSession();
      renderFeedbackPage(this);
      return;
    }

    if (storedScreen === "task") {
      if (this.hasPendingCorpusLoadWithoutTaskSession()) {
        this.waitForCorpusAndRenderTask(false);
        return;
      }
      this.resolveTaskSessionAndRender();
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

  async handleTaskSubmit() {
    const taskSession = state.taskSession;

    if (taskSession.isComplete) {
      taskSession.statusMessage = "Task is complete. Continue to the feedback page.";
      taskSession.statusType = "info";
      storage.setTaskSession(taskSession);
      renderTaskPage(this);
      return;
    }

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

    let latestPrediction;

    try {
      latestPrediction = await modelService.getPrediction(rewriteText, {
        participantId: state.participantId,
        statementIndex: taskSession.statementId
      });
    } catch (error) {
      taskSession.draftText = rewriteText;
      taskSession.statusMessage = `Model prediction failed. ${error.message || "Please try again."}`;
      taskSession.statusType = "warning";
      storage.setTaskSession(taskSession);
      renderTaskPage(this);
      return;
    }

    taskSession.attemptsUsed += 1;
    taskSession.lastRewrite = rewriteText;
    taskSession.draftText = "";
    taskSession.latestPrediction = latestPrediction;
    taskSession.statusType = "info";

    if (latestPrediction.label !== taskSession.originalPrediction.label) {
      taskSession.statusMessage = "Success! You flipped the model prediction. Please continue to the feedback page.";
      taskSession.isComplete = true;
    } else if (taskSession.attemptsUsed >= taskSession.maxAttempts) {
      taskSession.statusMessage = "You have reached the maximum number of attempts for this statement. Please continue to the feedback page.";
      taskSession.statusType = "warning";
      taskSession.isComplete = true;
    } else {
      taskSession.statusMessage = "Placeholder feedback state: the prediction did not flip yet, so the participant can try another rewrite.";
      taskSession.isComplete = false;
    }

    storage.setTaskSession(taskSession);
    renderTaskPage(this);
  },

  handleTaskContinueToFeedback() {
    const taskSession = state.taskSession;

    if (!taskSession || !taskSession.isComplete) {
      return;
    }

    this.showFeedbackPage();
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