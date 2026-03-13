window.renderWelcomePage = function renderWelcomePage(app) {
  utils.scrollToTop();

  const appRoot = document.getElementById("app");

  appRoot.innerHTML = `
    <h1 class="title">Welcome to the <em>'REWRITING TRUTHS AND LIES'</em> study</h1>

    <p class="lead">
      In this study, your task is to interact with an AI model that classifies
      statements as truthful or deceptive.
    </p>

    <p class="lead">
      On the next pages you will receive detailed task instructions.
    </p>

    <p class="lead">
      Once you complete the experiment, you will be redirected to Prolific.
    </p>

    <div class="info-box">
      <div class="info-label">Participant ID</div>
      <div class="info-value">${utils.escapeHtml(state.participantId)}</div>
    </div>

    <div class="actions">
      <button class="button" id="nextButton">Next</button>
    </div>
  `;

  document
    .getElementById("nextButton")
    .addEventListener("click", () => app.showConsentPage());
};