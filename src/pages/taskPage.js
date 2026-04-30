window.renderTaskPage = function renderTaskPage(app) {
  utils.scrollToTop();

  const appRoot = document.getElementById("app");
  const taskSession = state.taskSession;
  const targetLabel = taskSession.originalPrediction.label === 1 ? "deceptive" : "truthful";
  const originalWordCount = app.countWords(taskSession.originalText);
  const minAllowedWords = Math.max(0, originalWordCount - 20);
  const maxAllowedWords = originalWordCount + 20;
  const rewriteHistory = Array.isArray(taskSession.rewriteHistory) ? taskSession.rewriteHistory : [];
  const previousAttempts = rewriteHistory.slice(0, -1);
  const latestPredictionMarkup = taskSession.latestPrediction
    ? `
      <div class="task-panel">
        <h2 class="task-panel-title">Latest modification feedback</h2>
        <p class="task-summary"><strong>Your modification:</strong> ${utils.escapeHtml(taskSession.lastRewrite)}</p>
        <p class="task-summary">
          The AI now classifies your modification as <strong>${taskSession.latestPrediction.labelStr.toUpperCase()}</strong>
          with a confidence score of <strong>${taskSession.latestPrediction.confidence.toFixed(2)}%</strong>.
        </p>
        <div class="confidence-bar-wrap">
          <div class="confidence-bar-track">
            <div class="confidence-bar-fill ${taskSession.latestPrediction.label === 1 ? "fill-truthful" : "fill-deceptive"}"
              style="width: ${taskSession.latestPrediction.confidence.toFixed(1)}%">
            </div>
          </div>
          <div class="confidence-bar-pct">${taskSession.latestPrediction.confidence.toFixed(1)}% confident</div>
        </div>
      </div>
    `
    : "";

  const previousAttemptsMarkup = previousAttempts.length
    ? `
      <div class="task-panel history-panel">
        <details class="history-details">
          <summary class="history-summary">See previous modifications (${previousAttempts.length})</summary>
          <div class="history-list">
            ${previousAttempts.map((attempt) => `
              <article class="history-item">
                <h3 class="history-item-title">Attempt ${attempt.attemptNumber}</h3>
                <p class="task-summary"><strong>Modification:</strong> ${utils.escapeHtml(attempt.rewriteText)}</p>
                <p class="task-summary">
                  Model feedback: <strong>${utils.escapeHtml(String(attempt.labelStr || "unknown")).toUpperCase()}</strong>
                  at <strong>${Number(attempt.confidence || 0).toFixed(2)}%</strong> confidence.
                </p>
                <div class="confidence-bar-wrap">
                  <div class="confidence-bar-track">
                    <div class="confidence-bar-fill ${attempt.label === 1 ? "fill-truthful" : "fill-deceptive"}"
                      style="width: ${Number(attempt.confidence || 0).toFixed(1)}%">
                    </div>
                  </div>
                  <div class="confidence-bar-pct">${Number(attempt.confidence || 0).toFixed(1)}% confident</div>
                </div>
              </article>
            `).join("")}
          </div>
        </details>
      </div>
    `
    : "";

  const statusMarkup = taskSession.statusMessage
    ? `<div class="message show ${taskSession.statusType === "warning" ? "message-warning" : ""}">${utils.escapeHtml(taskSession.statusMessage)}</div>`
    : '<div class="message" id="messageBox"></div>';
  const continueButtonMarkup = taskSession.isComplete
    ? '<button class="button" id="taskContinueButton">Continue to Feedback</button>'
    : "";
  const hasDraftText = typeof taskSession.draftText === "string" && taskSession.draftText.length > 0;
  const shouldPrefillPreviousAttempt = !taskSession.isComplete
    && taskSession.attemptsUsed > 0
    && !hasDraftText
    && Boolean(taskSession.lastRewrite);
  const rewriteInputValue = shouldPrefillPreviousAttempt
    ? taskSession.lastRewrite
    : (taskSession.draftText || "");
  const prefillNoteMarkup = shouldPrefillPreviousAttempt
    ? '<p class="task-prefill-note">Your previous modification has been prefilled. Edit it before submitting this attempt.</p>'
    : "";
  const rewriteControlsMarkup = taskSession.isComplete
    ? ""
    : `
    <label class="task-label" for="taskRewriteInput">Write your modification below</label>
    <textarea
      id="taskRewriteInput"
      class="task-textarea"
      rows="8"
    >${utils.escapeHtml(rewriteInputValue)}</textarea>

    <p class="task-summary" id="taskWordCountHint" aria-live="polite"></p>

    ${prefillNoteMarkup}

    <div class="task-meta">
      <span>Attempts remaining: ${taskSession.maxAttempts - taskSession.attemptsUsed}</span>
      <span>Statement index: ${utils.escapeHtml(taskSession.statementId)}</span>
    </div>
    `;
  const submitButtonMarkup = taskSession.isComplete
    ? ""
    : '<button class="button" id="taskSubmitButton">Submit modification</button>';

  appRoot.innerHTML = `
    <h1 class="title">Main Task</h1>

    ${statusMarkup}

    <div class="task-panel">
      <h2 class="task-panel-title">Original statement</h2>
      <p class="task-statement">${utils.escapeHtml(taskSession.originalText)}</p>
    </div>

    <div class="task-grid">
      <div class="task-panel">
        <h2 class="task-panel-title">Original AI prediction</h2>
        <p class="task-summary">
          The AI classifies this statement as <strong>${taskSession.originalPrediction.labelStr.toUpperCase()}</strong>.
        </p>
        <p class="task-summary">Confidence score: <strong>${taskSession.originalPrediction.confidence.toFixed(2)}%</strong></p>
        <div class="confidence-bar-wrap">
          <div class="confidence-bar-track">
            <div class="confidence-bar-fill ${taskSession.originalPrediction.label === 1 ? "fill-truthful" : "fill-deceptive"}"
              style="width: ${taskSession.originalPrediction.confidence.toFixed(1)}%">
            </div>
          </div>
          <div class="confidence-bar-pct">${taskSession.originalPrediction.confidence.toFixed(1)}% confident</div>
        </div>
      </div>

      <div class="task-panel">
        <h2 class="task-panel-title">Task goal</h2>
        <p class="task-summary">
          Modify the statement so that it appears <strong>${targetLabel.toUpperCase()}</strong> to the AI while preserving meaning, grammar, and naturalness.
        </p>
        <p class="task-summary">
          Your modification must stay within <strong>${originalWordCount} +/- 20 words</strong>. You have used <strong>${taskSession.attemptsUsed}</strong> of <strong>${taskSession.maxAttempts}</strong> attempts.
        </p>
      </div>
    </div>

    ${previousAttemptsMarkup}

    ${latestPredictionMarkup}

    ${rewriteControlsMarkup}

    <div class="actions task-actions">
      ${submitButtonMarkup}
      ${continueButtonMarkup}
    </div>
  `;

  if (!taskSession.isComplete) {
    document
      .getElementById("taskSubmitButton")
      .addEventListener("click", () => app.handleTaskSubmit());

    const rewriteInput = document.getElementById("taskRewriteInput");
    const wordCountHint = document.getElementById("taskWordCountHint");
    const updateWordCountHint = () => {
      const currentWordCount = app.countWords(rewriteInput.value);
      const inRange = currentWordCount >= minAllowedWords && currentWordCount <= maxAllowedWords;
      wordCountHint.textContent = `Word count: ${currentWordCount} (allowed: ${minAllowedWords}-${maxAllowedWords})`;
      wordCountHint.style.color = inRange ? "" : "#b42318";
    };

    updateWordCountHint();

    document
      .getElementById("taskRewriteInput")
      .addEventListener("input", (event) => {
        taskSession.draftText = event.target.value;
        storage.setTaskSession(taskSession);
        updateWordCountHint();
      });
  }

  if (taskSession.isComplete) {
    document
      .getElementById("taskContinueButton")
      .addEventListener("click", () => app.handleTaskContinueToFeedback());
  }

  const textarea = document.getElementById("taskRewriteInput");
  if (textarea) {
    textarea.addEventListener("paste", (e) => e.preventDefault());
    textarea.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "v") e.preventDefault();
    });
  }
  document.addEventListener("contextmenu", (e) => e.preventDefault());
};