window.renderAttentionCheckPage = function renderAttentionCheckPage(app) {
  utils.scrollToTop();

  const appRoot = document.getElementById("app");
  const pageData = (state.sessionData && state.sessionData.pages && state.sessionData.pages.attentionCheck) || {};
  const responses = pageData.responses || {};
  const statusMessage = pageData.statusMessage || "";
  const statusType = pageData.statusType || "info";

  const messageMarkup = statusMessage
    ? `<div class="message show ${statusType === "warning" ? "message-warning" : ""}">${utils.escapeHtml(statusMessage)}</div>`
    : '<div class="message" id="messageBox"></div>';

  appRoot.innerHTML = `
    <p class="lead">
      Please answer these two questions based on the instructions you just read.
    </p>

    ${messageMarkup}

    <form id="attentionCheckForm">
      <div class="task-panel feedback-panel">
        <p class="task-label"><strong>In the model output, what do the label and confidence score mean?</strong></p>
        <div class="question-box">
          <div class="option-row">
            <input type="radio" id="attentionCheckQ1A" name="q1" value="A" ${responses.q1 === "A" ? "checked" : ""} />
            <label for="attentionCheckQ1A">The label is the percentage score, and confidence is whether it is truthful or deceptive.</label>
          </div>
          <div class="option-row">
            <input type="radio" id="attentionCheckQ1B" name="q1" value="B" ${responses.q1 === "B" ? "checked" : ""} />
            <label for="attentionCheckQ1B">The label is the participant ID, and confidence is the number of attempts used.</label>
          </div>
          <div class="option-row">
            <input type="radio" id="attentionCheckQ1C" name="q1" value="C" ${responses.q1 === "C" ? "checked" : ""} />
            <label for="attentionCheckQ1C">The label is whether the model predicts truthful or deceptive, and confidence is how sure the model is.</label>
          </div>
          <div class="option-row">
            <input type="radio" id="attentionCheckQ1D" name="q1" value="D" ${responses.q1 === "D" ? "checked" : ""} />
            <label for="attentionCheckQ1D">The label is the original statement text, and confidence is the rewritten statement text.</label>
          </div>
        </div>
      </div>

      <div class="task-panel feedback-panel">
        <p class="task-label"><strong>How many attempts do you have to modify the statement?</strong></p>
        <div class="question-box">
          <div class="option-row">
            <input type="radio" id="attentionCheckQ2A" name="q2" value="A" ${responses.q2 === "A" ? "checked" : ""} />
            <label for="attentionCheckQ2A">3 attempts</label>
          </div>
          <div class="option-row">
            <input type="radio" id="attentionCheckQ2B" name="q2" value="B" ${responses.q2 === "B" ? "checked" : ""} />
            <label for="attentionCheckQ2B">10 attempts</label>
          </div>
          <div class="option-row">
            <input type="radio" id="attentionCheckQ2C" name="q2" value="C" ${responses.q2 === "C" ? "checked" : ""} />
            <label for="attentionCheckQ2C">5 attempts</label>
          </div>
          <div class="option-row">
            <input type="radio" id="attentionCheckQ2D" name="q2" value="D" ${responses.q2 === "D" ? "checked" : ""} />
            <label for="attentionCheckQ2D">Unlimited attempts</label>
          </div>
        </div>
      </div>

      <div class="actions">
        <button type="submit" class="button" id="attentionCheckNextButton">Next</button>
      </div>
    </form>
  `;

  document.getElementById("attentionCheckForm").addEventListener("submit", function (event) {
    event.preventDefault();
    app.handleAttentionCheckSubmit();
  });

  document.querySelectorAll('input[name="q1"], input[name="q2"]').forEach(function (radio) {
    radio.addEventListener("change", function (event) {
      const attentionPage = state.sessionData.pages.attentionCheck;
      attentionPage.responses = attentionPage.responses || {};
      attentionPage.responses[event.target.name] = event.target.value;

      if (attentionPage.responses.q1 && attentionPage.responses.q2) {
        attentionPage.statusMessage = "";
        attentionPage.statusType = "info";
      }

      storage.setSessionData(state.sessionData);
    });
  });
};
