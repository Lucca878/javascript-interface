window.renderFeedbackPage = function renderFeedbackPage(app) {
  utils.scrollToTop();

  const appRoot = document.getElementById("app");
  const feedbackSession = app.ensureFeedbackSession();
  const motivationLabel = feedbackSession.motivationAnswered ? String(feedbackSession.motivationScale) : "Not answered";
  const difficultyLabel = feedbackSession.difficultyAnswered ? String(feedbackSession.difficultyScale) : "Not answered";
  const statusMarkup = feedbackSession.statusMessage
    ? `<div class="message show ${feedbackSession.statusType === "warning" ? "message-warning" : ""}">${utils.escapeHtml(feedbackSession.statusMessage)}</div>`
    : '<div class="message" id="messageBox"></div>';

  appRoot.innerHTML = `
    <h1 class="title">Feedback</h1>

    <p class="lead">
      Please provide feedback about the study. Your feedback is valuable and helps us improve the experiment.
    </p>

    <p class="note">Move both sliders to confirm your answers.</p>

    ${statusMarkup}

    <div class="task-panel feedback-panel">
      <label class="task-label" for="motivationScaleInput"><strong>1. How motivated were you to perform well?</strong></label>
      <input id="motivationScaleInput" class="feedback-range" type="range" min="0" max="10" step="1" value="${feedbackSession.motivationScale}" />
      <p class="task-summary">0 = Not at all, 10 = Very much. Current value: <strong id="motivationScaleValue">${motivationLabel}</strong></p>
    </div>

    <div class="task-panel feedback-panel">
      <label class="task-label" for="difficultyScaleInput"><strong>2. How difficult did you find the study?</strong></label>
      <input id="difficultyScaleInput" class="feedback-range" type="range" min="0" max="10" step="1" value="${feedbackSession.difficultyScale}" />
      <p class="task-summary">0 = Very easy, 10 = Very difficult. Current value: <strong id="difficultyScaleValue">${difficultyLabel}</strong></p>
    </div>

    <label class="task-label" for="strategiesInput">
      <strong>3. Which strategies did you use to manipulate statements so the AI would be misled?</strong>
    </label>
    <textarea
      id="strategiesInput"
      class="task-textarea"
      rows="7"
      placeholder="Describe your approach in as much detail as you can."
    >${utils.escapeHtml(feedbackSession.strategies || "")}</textarea>

    <label class="task-label" for="feedbackInput">
      <strong>Optional: Any additional remarks about this experiment?</strong>
    </label>
    <textarea
      id="feedbackInput"
      class="task-textarea"
      rows="6"
      placeholder="Optional comments"
    >${utils.escapeHtml(feedbackSession.feedback || "")}</textarea>

    <div class="actions task-actions">
      <button class="button" id="submitFeedbackButton">Submit Feedback</button>
    </div>
  `;

  document.getElementById("motivationScaleInput").addEventListener("input", function (event) {
    const nextValue = Number(event.target.value);
    document.getElementById("motivationScaleValue").textContent = String(nextValue);
    app.updateFeedbackSessionField("motivationScale", nextValue);
    app.updateFeedbackSessionField("motivationAnswered", true);
  });

  document.getElementById("difficultyScaleInput").addEventListener("input", function (event) {
    const nextValue = Number(event.target.value);
    document.getElementById("difficultyScaleValue").textContent = String(nextValue);
    app.updateFeedbackSessionField("difficultyScale", nextValue);
    app.updateFeedbackSessionField("difficultyAnswered", true);
  });

  document.getElementById("strategiesInput").addEventListener("input", function (event) {
    app.updateFeedbackSessionField("strategies", event.target.value);
  });

  document.getElementById("feedbackInput").addEventListener("input", function (event) {
    app.updateFeedbackSessionField("feedback", event.target.value);
  });

  document.getElementById("submitFeedbackButton").addEventListener("click", function () {
    app.handleFeedbackSubmit();
  });
};
