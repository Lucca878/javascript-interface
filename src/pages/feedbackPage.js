window.renderFeedbackPage = function renderFeedbackPage(app) {
  utils.scrollToTop();

  const appRoot = document.getElementById("app");
  const feedbackSession = app.ensureFeedbackSession();
  const taskSession = state.taskSession;
  const motivationValue = Math.max(1, Math.min(7, Number(feedbackSession.motivationScale) || 4));
  const difficultyValue = Math.max(1, Math.min(7, Number(feedbackSession.difficultyScale) || 4));
  const motivationLabel = feedbackSession.motivationAnswered ? String(motivationValue) : "Not answered";
  const difficultyLabel = feedbackSession.difficultyAnswered ? String(difficultyValue) : "Not answered";
  const rewriteHistory = taskSession && Array.isArray(taskSession.rewriteHistory) ? taskSession.rewriteHistory : [];
  const originalLabel = taskSession && taskSession.originalPrediction ? taskSession.originalPrediction.label : null;
  const originalConfidence = taskSession && taskSession.originalPrediction
    ? Number(taskSession.originalPrediction.confidence || 0)
    : null;

  let mostSuccessfulAttempt = null;

  if (rewriteHistory.length > 0) {
    const flippedAttempts = rewriteHistory.filter(function (attempt) {
      return originalLabel !== null && attempt.label !== originalLabel;
    });

    if (flippedAttempts.length > 0) {
      mostSuccessfulAttempt = flippedAttempts[0];
    } else if (originalLabel !== null && originalConfidence !== null) {
      // If the prediction never flipped, choose the rewrite with the largest confidence change.
      mostSuccessfulAttempt = rewriteHistory.reduce(function (best, current) {
        const bestDelta = Math.abs(Number(best.confidence || 0) - originalConfidence);
        const currentDelta = Math.abs(Number(current.confidence || 0) - originalConfidence);
        return currentDelta > bestDelta ? current : best;
      });
    } else {
      mostSuccessfulAttempt = rewriteHistory[rewriteHistory.length - 1];
    }
  }

  const recapMarkup = taskSession && taskSession.originalText
    ? `
      <div class="task-panel history-panel">
        <details class="history-details">
          <summary class="history-summary">Review original statement and most successful modification</summary>
          <div class="history-list">
            <article class="history-item">
              <h3 class="history-item-title">Original statement</h3>
              <p class="task-summary">${utils.escapeHtml(taskSession.originalText)}</p>
              ${taskSession.originalPrediction
                ? `<p class="task-summary">
                     Original model output: <strong>${utils.escapeHtml(String(taskSession.originalPrediction.labelStr || "unknown")).toUpperCase()}</strong>
                     at <strong>${Number(taskSession.originalPrediction.confidence || 0).toFixed(2)}%</strong> confidence.
                   </p>
                   <div class="confidence-bar-wrap">
                     <div class="confidence-bar-track">
                       <div class="confidence-bar-fill ${taskSession.originalPrediction.label === 1 ? "fill-truthful" : "fill-deceptive"}"
                         style="width: ${Number(taskSession.originalPrediction.confidence || 0).toFixed(1)}%">
                       </div>
                     </div>
                     <div class="confidence-bar-pct">${Number(taskSession.originalPrediction.confidence || 0).toFixed(1)}% confident</div>
                   </div>`
                : ""}
            </article>
            <article class="history-item">
              <h3 class="history-item-title">Most successful modification</h3>
              ${mostSuccessfulAttempt
                ? `<p class="task-summary">${utils.escapeHtml(mostSuccessfulAttempt.rewriteText || "")}</p>
                   <p class="task-summary">
                     Model output: <strong>${utils.escapeHtml(String(mostSuccessfulAttempt.labelStr || "unknown")).toUpperCase()}</strong>
                     at <strong>${Number(mostSuccessfulAttempt.confidence || 0).toFixed(2)}%</strong> confidence.
                   </p>
                   <div class="confidence-bar-wrap">
                     <div class="confidence-bar-track">
                       <div class="confidence-bar-fill ${mostSuccessfulAttempt.label === 1 ? "fill-truthful" : "fill-deceptive"}"
                         style="width: ${Number(mostSuccessfulAttempt.confidence || 0).toFixed(1)}%">
                       </div>
                     </div>
                     <div class="confidence-bar-pct">${Number(mostSuccessfulAttempt.confidence || 0).toFixed(1)}% confident</div>
                   </div>`
                : '<p class="task-summary">No submitted modifications found.</p>'}
            </article>
          </div>
        </details>
      </div>
    `
    : "";

  const statusMarkup = feedbackSession.statusMessage
    ? `<div class="message show ${feedbackSession.statusType === "warning" ? "message-warning" : ""}">${utils.escapeHtml(feedbackSession.statusMessage)}</div>`
    : '<div class="message" id="messageBox"></div>';

  appRoot.innerHTML = `
    <h1 class="title">Feedback</h1>

    <p class="lead">
      We are keen to hear your feedback about this study. Your feedback is valuable and helps us improve the experiment.
    </p>

    <p class="note">Move both sliders and answer every question to confirm your responses.</p>

    ${statusMarkup}

    <div class="task-panel feedback-panel">
      <label class="task-label" for="motivationScaleInput"><strong>1. How motivated were you to perform well?</strong></label>
      <div class="slider-top-labels">
        <span>Not at all motivated</span>
        <span>Very motivated</span>
      </div>
      <input id="motivationScaleInput" class="feedback-range" type="range" min="1" max="7" step="1" value="${motivationValue}" />
      <p class="task-summary">Current value: <strong id="motivationScaleValue">${motivationLabel}</strong></p>
    </div>

    <div class="task-panel feedback-panel">
      <p class="task-label"><strong>2. What was the goal of the main task?</strong></p>
      <div class="question-box">
        <div class="option-row">
          <input type="radio" id="taskGoalA" name="taskGoalInput" value="A" ${feedbackSession.taskGoalAnswer === "A" ? "checked" : ""}/>
          <label for="taskGoalA">To evaluate the accuracy of the AI's predictions</label>
        </div>
        <div class="option-row">
          <input type="radio" id="taskGoalB" name="taskGoalInput" value="B" ${feedbackSession.taskGoalAnswer === "B" ? "checked" : ""}/>
          <label for="taskGoalB">To modify statements so the AI prediction would change</label>
        </div>
        <div class="option-row">
          <input type="radio" id="taskGoalC" name="taskGoalInput" value="C" ${feedbackSession.taskGoalAnswer === "C" ? "checked" : ""}/>
          <label for="taskGoalC">To improve the clarity and grammar of statements</label>
        </div>
        <div class="option-row">
          <input type="radio" id="taskGoalD" name="taskGoalInput" value="D" ${feedbackSession.taskGoalAnswer === "D" ? "checked" : ""}/>
          <label for="taskGoalD">To write entirely new statements from scratch</label>
        </div>
      </div>
    </div>

    <div class="task-panel feedback-panel">
      <label class="task-label" for="difficultyScaleInput"><strong>3. How difficult did you find the study?</strong></label>
      <div class="slider-top-labels">
        <span>Very easy</span>
        <span>Very difficult</span>
      </div>
      <input id="difficultyScaleInput" class="feedback-range" type="range" min="1" max="7" step="1" value="${difficultyValue}" />
      <p class="task-summary">Current value: <strong id="difficultyScaleValue">${difficultyLabel}</strong></p>
    </div>

    <label class="task-label" for="strategiesInput">
      <strong>4. How did you modify the statement so the AI would change its initial prediction?</strong>
    </label>

    ${recapMarkup}

    <textarea
      id="strategiesInput"
      class="task-textarea"
      style="margin-top: 1rem;"
      rows="7"
      placeholder="Describe your approach in 2-3 sentences."
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

  const motivationSlider = document.getElementById("motivationScaleInput");
  const difficultySlider = document.getElementById("difficultyScaleInput");
  utils.updateSliderFill(motivationSlider);
  utils.updateSliderFill(difficultySlider);

  document.getElementById("motivationScaleInput").addEventListener("input", function (event) {
    const nextValue = Number(event.target.value);
    document.getElementById("motivationScaleValue").textContent = String(nextValue);
    app.updateFeedbackSessionField("motivationScale", nextValue);
    app.updateFeedbackSessionField("motivationAnswered", true);
    utils.updateSliderFill(this);
  });

  document.getElementById("difficultyScaleInput").addEventListener("input", function (event) {
    const nextValue = Number(event.target.value);
    document.getElementById("difficultyScaleValue").textContent = String(nextValue);
    app.updateFeedbackSessionField("difficultyScale", nextValue);
    app.updateFeedbackSessionField("difficultyAnswered", true);
    utils.updateSliderFill(this);
  });

  document.querySelectorAll('input[name="taskGoalInput"]').forEach(function (radio) {
    radio.addEventListener("change", function (event) {
      app.updateFeedbackSessionField("taskGoalAnswer", event.target.value);
      app.updateFeedbackSessionField("taskGoalAnswered", true);
    });
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
