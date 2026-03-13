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

    if (window.state) {
      state.participantId = null;
      state.consentData = null;
    }
  }
};