window.testHelpers = {
  ensureTestRoot() {
    let testRoot = document.getElementById("test-root");
    if (!testRoot) {
      testRoot = document.createElement("div");
      testRoot.id = "test-root";
      document.body.appendChild(testRoot);
    }
    return testRoot;
  },

  mountAppContainer() {
    const testRoot = this.ensureTestRoot();
    testRoot.innerHTML = '<div id="app"></div>';
  },

  clearTestRoot() {
    const testRoot = this.ensureTestRoot();
    testRoot.innerHTML = "";
  },

  resetAppState() {
    sessionStorage.clear();
    localStorage.clear();

    if (window.state) {
      state.participantId = null;
      state.consentData = null;
      state.taskSession = null;
      state.feedbackSession = null;
      state.feedbackSubmission = null;
      if (typeof window.createSessionData === "function") {
        state.sessionData = window.createSessionData();
      }
    }

    if (window.corpusService) {
      corpusService.corpus = null;
      corpusService.loadPromise = null;
      corpusService.corpusSource = "placeholder";
      corpusService.phpEndpoint = "api/statements.php";
    }
  }
};