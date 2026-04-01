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
      <fieldset class="question-box">
        <legend class="lead"><strong>1)</strong> In the model output, what do the label and confidence score mean?</legend>
        <label class="option-row">
          <input type="radio" name="q1" value="A" ${responses.q1 === "A" ? "checked" : ""} />
          The label is the percentage score, and confidence is whether it is truthful or deceptive.
        </label>
        <label class="option-row">
          <input type="radio" name="q1" value="B" ${responses.q1 === "B" ? "checked" : ""} />
          The label is the participant ID, and confidence is the number of attempts used.
        </label>
        <label class="option-row">
          <input type="radio" name="q1" value="C" ${responses.q1 === "C" ? "checked" : ""} />
          The label is whether the model predicts truthful or deceptive, and confidence is how sure the model is.
        </label>
        <label class="option-row">
          <input type="radio" name="q1" value="D" ${responses.q1 === "D" ? "checked" : ""} />
          The label is the original statement text, and confidence is the rewritten statement text.
        </label>
      </fieldset>

      <fieldset class="question-box">
        <legend class="lead"><strong>2)</strong> How many attempts do you have to modify the statement?</legend>
        <label class="option-row">
          <input type="radio" name="q2" value="A" ${responses.q2 === "A" ? "checked" : ""} />
          3 attempts
        </label>
        <label class="option-row">
          <input type="radio" name="q2" value="B" ${responses.q2 === "B" ? "checked" : ""} />
          5 attempts
        </label>
        <label class="option-row">
          <input type="radio" name="q2" value="C" ${responses.q2 === "C" ? "checked" : ""} />
          10 attempts
        </label>
        <label class="option-row">
          <input type="radio" name="q2" value="D" ${responses.q2 === "D" ? "checked" : ""} />
          Unlimited attempts
        </label>
      </fieldset>

      <div class="actions">
        <button type="submit" class="button" id="attentionCheckNextButton">Continue</button>
      </div>
    </form>
  `;

  document.getElementById("attentionCheckForm").addEventListener("submit", function (event) {
    event.preventDefault();
    app.handleAttentionCheckSubmit();
  });
};
