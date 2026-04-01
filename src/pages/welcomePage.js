window.renderWelcomePage = function renderWelcomePage(app) {
  utils.scrollToTop();

  // Pre-warm the model backend so the cold-start completes before the task page.
  const warmupEndpoint = modelService.getApiEndpoint();
  if (warmupEndpoint) {
    const healthUrl = warmupEndpoint.replace(/\/predict\/?$/, "/health");
    fetch(healthUrl).catch(() => {});
  }

  const appRoot = document.getElementById("app");

  appRoot.innerHTML = `
    <h1 class="title">Welcome to our study <em>'REWRITING TRUTHS AND LIES'</em></h1>

    <p class="lead">
      Your task is to interact with an AI model that has been trained to identify 
      statements written by human participants as truthful or deceptive.
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