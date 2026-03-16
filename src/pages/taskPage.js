window.renderTaskPage = function renderTaskPage(app) {
  utils.scrollToTop();

  const appRoot = document.getElementById("app");
  const taskSession = state.taskSession;
  const targetLabel = taskSession.originalPrediction.label === 1 ? "deceptive" : "truthful";
  const originalWordCount = app.countWords(taskSession.originalText);
  const latestPredictionMarkup = taskSession.latestPrediction
    ? `
      <div class="task-panel">
        <h2 class="task-panel-title">Latest rewrite feedback</h2>
        <p class="task-summary"><strong>Your rewrite:</strong> ${utils.escapeHtml(taskSession.lastRewrite)}</p>
        <p class="task-summary">
          The AI now classifies your rewrite as <strong>${taskSession.latestPrediction.labelStr.toUpperCase()}</strong>
          with a confidence score of <strong>${taskSession.latestPrediction.confidence.toFixed(2)}%</strong>.
        </p>
      </div>
    `
    : "";

  const statusMarkup = taskSession.statusMessage
    ? `<div class="message show ${taskSession.statusType === "warning" ? "message-warning" : ""}">${utils.escapeHtml(taskSession.statusMessage)}</div>`
    : '<div class="message" id="messageBox"></div>';

  appRoot.innerHTML = `
    <h1 class="title">Main Task</h1>

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
      </div>

      <div class="task-panel">
        <h2 class="task-panel-title">Task goal</h2>
        <p class="task-summary">
          Rewrite the statement so that it appears <strong>${targetLabel.toUpperCase()}</strong> to the AI while preserving meaning, grammar, and naturalness.
        </p>
        <p class="task-summary">
          Your rewrite must stay within <strong>${originalWordCount} +/- 20 words</strong>. You have used <strong>${taskSession.attemptsUsed}</strong> of <strong>${taskSession.maxAttempts}</strong> attempts.
        </p>
      </div>
    </div>

    ${latestPredictionMarkup}

    <label class="task-label" for="taskRewriteInput">Write your rewrite below</label>
    <textarea
      id="taskRewriteInput"
      class="task-textarea"
      rows="8"
      placeholder="${utils.escapeHtml(taskSession.lastRewrite || taskSession.originalText)}"
    >${utils.escapeHtml(taskSession.draftText || "")}</textarea>

    <div class="task-meta">
      <span>Attempts remaining: ${taskSession.maxAttempts - taskSession.attemptsUsed}</span>
      <span>Statement index: ${utils.escapeHtml(taskSession.statementId)}</span>
    </div>

    <div class="actions task-actions">
      <button class="button" id="taskSubmitButton">Submit rewrite</button>
    </div>

    ${statusMarkup}
  `;

  document
    .getElementById("taskSubmitButton")
    .addEventListener("click", () => app.handleTaskSubmit());
};