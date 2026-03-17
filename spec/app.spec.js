describe("app core", function () {
  beforeEach(function () {
    testHelpers.resetAppState();
    testHelpers.mountAppContainer();
  });

  afterEach(function () {
    testHelpers.clearTestRoot();
    delete window.APP_CONFIG;
  });

  it("generates a fallback participant ID when none exists", function () {
    spyOn(app, "getProlificIdFromUrl").and.returnValue(null);

    app.initializeParticipantId();

    expect(state.participantId).toBeTruthy();
    expect(storage.getParticipantId()).toBe(state.participantId);
  });

  it("uses the Prolific ID when present", function () {
    spyOn(app, "getProlificIdFromUrl").and.returnValue("abc123");

    app.initializeParticipantId();

    expect(state.participantId).toBe("abc123");
    expect(storage.getParticipantId()).toBe("abc123");
  });

  it("reuses the stored participant ID when no Prolific ID exists", function () {
    storage.setParticipantId("stored-001");
    spyOn(app, "getProlificIdFromUrl").and.returnValue(null);

    app.initializeParticipantId();

    expect(state.participantId).toBe("stored-001");
  });

  it("restores the consent page when the stored screen is consent", function () {
    spyOn(app, "getProlificIdFromUrl").and.returnValue(null);
    storage.setParticipantId("stored-001");
    storage.setCurrentScreen("consent");

    app.init();

    expect(document.getElementById("app").textContent).toContain("Informed Consent");
    expect(document.getElementById("acceptButton")).not.toBeNull();
    expect(document.getElementById("denyButton")).not.toBeNull();
  });

  it("shows the welcome page when no stored screen exists", function () {
    spyOn(app, "getProlificIdFromUrl").and.returnValue(null);
    storage.setParticipantId("stored-001");

    app.init();

    expect(document.getElementById("app").textContent).toContain("Welcome");
    expect(document.getElementById("nextButton")).not.toBeNull();
  });
  it("restores the instructions page when the stored screen is instructions", function () {
    spyOn(app, "getProlificIdFromUrl").and.returnValue(null);
    storage.setParticipantId("stored-001");
    storage.setCurrentScreen("instructions");

    app.init();

    expect(document.getElementById("app").textContent).toContain("Instructions");
    expect(document.getElementById("instructionsNextButton")).not.toBeNull();
  });
  it("restores the task page when the stored screen is task", function () {
    spyOn(app, "getProlificIdFromUrl").and.returnValue(null);
    storage.setParticipantId("stored-001");
    storage.setCurrentScreen("task");
    storage.setTaskSession({
      statementId: "stmt-001",
      originalText: "Stored task statement.",
      originalPrediction: { label: 1, labelStr: "truthful", confidence: 88 },
      attemptsUsed: 0,
      maxAttempts: 10,
      lastRewrite: "",
      latestPrediction: null,
      statusMessage: "",
      statusType: "info"
    });

    app.init();

    expect(document.getElementById("app").textContent).toContain("Main Task");
    expect(document.getElementById("taskSubmitButton")).not.toBeNull();
  });

  it("restores the feedback page when the stored screen is feedback", function () {
    spyOn(app, "getProlificIdFromUrl").and.returnValue(null);
    storage.setParticipantId("stored-001");
    storage.setCurrentScreen("feedback");

    app.init();

    expect(document.getElementById("app").textContent).toContain("Feedback");
    expect(document.getElementById("submitFeedbackButton")).not.toBeNull();
  });

  it("restores stored feedback values when returning to the feedback page", function () {
    spyOn(app, "getProlificIdFromUrl").and.returnValue(null);
    storage.setParticipantId("stored-001");
    storage.setCurrentScreen("feedback");
    storage.setFeedbackSession({
      motivationScale: 4,
      difficultyScale: 8,
      strategies: "I altered narrative style and structure.",
      feedback: "Smooth flow.",
      statusMessage: "",
      statusType: "info",
      submitted: false
    });

    app.init();

    expect(document.getElementById("motivationScaleInput").value).toBe("4");
    expect(document.getElementById("difficultyScaleInput").value).toBe("8");
    expect(document.getElementById("strategiesInput").value).toContain("narrative style");
    expect(document.getElementById("feedbackInput").value).toBe("Smooth flow.");
  });

  it("restores the end page when the stored screen is end", function () {
    spyOn(app, "getProlificIdFromUrl").and.returnValue(null);
    storage.setParticipantId("stored-001");
    storage.setCurrentScreen("end");

    app.init();

    expect(document.getElementById("app").textContent).toContain("End of Study");
    expect(document.getElementById("app").textContent).toContain("Thank you for participating in our study");
  });

  it("stores the current screen and pushes history when showing the consent page", function () {
    spyOn(app, "pushHistoryState");
    testHelpers.mountAppContainer();

    app.showConsentPage();

    expect(storage.getCurrentScreen()).toBe("consent");
    expect(app.pushHistoryState).toHaveBeenCalledWith("consent");
  });
  it("stores the current screen and pushes history when showing the instructions page", function () {
    spyOn(app, "pushHistoryState");
    testHelpers.mountAppContainer();

    app.showInstructionsPage();

    expect(storage.getCurrentScreen()).toBe("instructions");
    expect(app.pushHistoryState).toHaveBeenCalledWith("instructions");
  });
  it("stores the current screen and pushes history when showing the task page", function () {
    spyOn(app, "pushHistoryState");
    spyOn(app, "ensureTaskSession").and.callFake(function () {
      state.taskSession = {
        statementId: "stmt-001",
        originalText: "Task statement.",
        originalPrediction: { label: 1, labelStr: "truthful", confidence: 75 },
        attemptsUsed: 0,
        maxAttempts: 10,
        lastRewrite: "",
        latestPrediction: null,
        statusMessage: "",
        statusType: "info"
      };
      return true;
    });
    testHelpers.mountAppContainer();

    app.showTaskPage();

    expect(storage.getCurrentScreen()).toBe("task");
    expect(app.pushHistoryState).toHaveBeenCalledWith("task");
  });

  it("stores the current screen and pushes history when showing the feedback page", function () {
    spyOn(app, "pushHistoryState");
    testHelpers.mountAppContainer();

    app.showFeedbackPage();

    expect(storage.getCurrentScreen()).toBe("feedback");
    expect(app.pushHistoryState).toHaveBeenCalledWith("feedback");
  });

  it("stores the current screen and pushes history when showing the end page", function () {
    spyOn(app, "pushHistoryState");
    testHelpers.mountAppContainer();

    app.showEndPage();

    expect(storage.getCurrentScreen()).toBe("end");
    expect(app.pushHistoryState).toHaveBeenCalledWith("end");
  });

  it("restores the stored screen when popstate is handled", function () {
    storage.setCurrentScreen("instructions");
    spyOn(app, "restoreScreen");
    spyOn(app, "replaceHistoryState");

    app.handlePopState();

    expect(app.replaceHistoryState).toHaveBeenCalledWith("instructions");
    expect(app.restoreScreen).toHaveBeenCalled();
  });
  it("registers a popstate listener when setting up the history guard", function () {
    spyOn(window, "addEventListener");
    spyOn(app, "replaceHistoryState");

    app.setupHistoryGuard();

    expect(app.replaceHistoryState).toHaveBeenCalled();
    expect(window.addEventListener).toHaveBeenCalledWith("popstate", jasmine.any(Function));
  });

  it("shows a loading state on task page while PHP corpus is still loading", function () {
    window.APP_CONFIG = { corpusPhpEndpoint: "api/statements.php" };
    corpusService.loadPromise = new Promise(function () {});
    corpusService.corpus = null;
    corpusService.corpusSource = "placeholder";

    app.showTaskPage();

    expect(document.getElementById("app").textContent).toContain("Loading statements...");
    expect(document.getElementById("taskSubmitButton")).toBeNull();
  });

  it("renders the task page after PHP corpus load completes", function (done) {
    window.APP_CONFIG = { corpusPhpEndpoint: "api/statements.php" };
    let resolveLoad;

    corpusService.loadPromise = new Promise(function (resolve) {
      resolveLoad = resolve;
    });
    corpusService.corpus = null;
    corpusService.corpusSource = "placeholder";

    app.showTaskPage();

    corpusService.corpus = [{ index: "901", text_truncated: "Loaded from strict PHP wait path." }];
    corpusService.corpusSource = "php";
    resolveLoad();

    setTimeout(function () {
      expect(document.getElementById("app").textContent).toContain("Loaded from strict PHP wait path.");
      expect(document.getElementById("taskSubmitButton")).not.toBeNull();
      done();
    }, 0);
  });

  it("shows an error state when PHP corpus cannot be loaded", function (done) {
    window.APP_CONFIG = { corpusPhpEndpoint: "api/statements.php" };
    let resolveLoad;

    corpusService.loadPromise = new Promise(function (resolve) {
      resolveLoad = resolve;
    });
    corpusService.corpus = null;
    corpusService.corpusSource = "placeholder";

    app.showTaskPage();
    resolveLoad();

    setTimeout(function () {
      expect(document.getElementById("app").textContent).toContain("could not load the statement corpus");
      expect(document.getElementById("taskRetryLoadButton")).not.toBeNull();
      done();
    }, 0);
  });

  it("refreshes untouched placeholder task sessions when PHP corpus is ready", function () {
    corpusService.corpusSource = "php";
    corpusService.corpus = [{ index: "777", text_truncated: "Fresh statement from loaded PHP corpus." }];
    storage.setTaskSession({
      statementId: "1",
      originalText: "Placeholder statement",
      corpusSource: "placeholder",
      originalPrediction: { label: 1, labelStr: "truthful", confidence: 75 },
      attemptsUsed: 0,
      maxAttempts: 10,
      lastRewrite: "",
      latestPrediction: null,
      statusMessage: "",
      statusType: "info"
    });

    app.ensureTaskSession();

    expect(state.taskSession.originalText).toBe("Fresh statement from loaded PHP corpus.");
    expect(state.taskSession.corpusSource).toBe("php");
  });

  it("uses configured corpus endpoint and preloads corpus on init", function () {
    const previousConfig = window.APP_CONFIG;
    window.APP_CONFIG = { corpusPhpEndpoint: "api/custom-statements.php" };

    spyOn(corpusService, "setPhpEndpoint");
    spyOn(corpusService, "preloadCorpus").and.returnValue(Promise.resolve([]));
    spyOn(app, "initializeParticipantId");
    spyOn(app, "restoreScreen");
    spyOn(app, "setupHistoryGuard");

    app.init();

    expect(corpusService.setPhpEndpoint).toHaveBeenCalledWith("api/custom-statements.php");
    expect(corpusService.preloadCorpus).toHaveBeenCalled();

    window.APP_CONFIG = previousConfig;
  });

  it("renders task page after async task session initialization resolves", function (done) {
    spyOn(app, "pushHistoryState");
    spyOn(app, "ensureTaskSession").and.returnValue(
      Promise.resolve().then(function () {
        state.taskSession = {
          statementId: "stmt-123",
          originalText: "Async task statement.",
          originalPrediction: { label: 1, labelStr: "truthful", confidence: 77.0 },
          attemptsUsed: 0,
          maxAttempts: 10,
          lastRewrite: "",
          draftText: "",
          latestPrediction: null,
          statusMessage: "",
          statusType: "info"
        };
      })
    );

    app.showTaskPage();

    expect(document.getElementById("app").textContent).toContain("Loading statements...");

    setTimeout(function () {
      expect(document.getElementById("app").textContent).toContain("Main Task");
      expect(document.getElementById("taskSubmitButton")).not.toBeNull();
      done();
    }, 0);
  });
});