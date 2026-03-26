window.renderNoConsentPage = function renderNoConsentPage() {
  utils.scrollToTop();

  const appRoot = document.getElementById("app");

  appRoot.innerHTML = `
    <h1 class="title">Study Ended</h1>

    <p class="lead">
      You did not provide consent to participate in this study, so the study ends here.
    </p>

    <div class="task-panel">
      <p class="task-summary">
        Because consent was not provided, the study ends and your study responses will not be submitted.
      </p>
      <p class="task-summary">
        You may now close this page.
      </p>
    </div>
  `;
};