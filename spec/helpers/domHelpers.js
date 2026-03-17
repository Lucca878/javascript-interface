window.testHelpers = {
  mountAppContainer() {
    const testRoot = document.getElementById("test-root");
    testRoot.innerHTML = '<div id="app"></div>';
  },

  clearTestRoot() {
    const testRoot = document.getElementById("test-root");
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
    }

    if (window.corpusService) {
      corpusService.corpus = null;
      corpusService.loadPromise = null;
      corpusService.corpusSource = "placeholder";
      corpusService.phpEndpoint = "api/statements.php";
    }
  }
};