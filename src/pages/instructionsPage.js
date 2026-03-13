window.renderInstructionsPage = function renderInstructionsPage(app) {
  utils.scrollToTop();

  const appRoot = document.getElementById("app");

  appRoot.innerHTML = `
    <h1 class="title">Instructions</h1>

    <p class="lead">
      In this experiment, you will read <strong>1</strong> short statement written by
      participants in another study. This statement is either <strong>truthful</strong>
      or <strong>deceptive</strong>. Some statements have been truncated.
    </p>

    <p class="lead">
      Alongside this statement, you see the predictions of a state-of-the-art AI lie
      detection algorithm that was trained on a large dataset of truths and lies.
    </p>

    <p class="lead">
      The predictions show you whether the AI classifies the statement as deceptive
      or truthful and how confident it is about this classification. This is shown
      as the <strong>confidence score</strong>. The closer the confidence score is
      to 100%, the higher the confidence of the model’s prediction. Confidence values
      closer to 50% indicate uncertainty, with 50% implying equal confidence in the
      statement being deceptive and truthful.
    </p>

    <p class="lead">
      Your task is to <strong>rewrite</strong> this statement with a specific task
      in mind. Specifically, your task is to rewrite or paraphrase the statement so
      that it is classified as the opposite by the model. For example, when the
      original prediction is that a statement is truthful, you need to modify it so
      that it is classified as deceptive. Vice versa, when a statement is initially
      classified as deceptive by the model, your task is to modify it to be classified
      as truthful. You will be able to see how your modifications affect the model by
      directly interacting with it and receiving live predictions for your modified statement.
    </p>

    <p class="lead">
      In total, you will have <strong>10</strong> attempts to decrease
      the confidence score of the AI’s original prediction as much as possible. If you
      manage to change the original prediction, you will immediately move on to the end of the study.
    </p>

    <div class="info-box">
      <p class="lead instructions-emphasis">
        There is one very important condition to be met: You must maintain the meaning
        of the original statement, be grammatically correct, and appear natural.
      </p>

      <p class="lead instructions-emphasis">
        <strong>Please read and rewrite the statement carefully.</strong>
      </p>
    </div>

    <div class="actions">
      <button class="button" id="instructionsNextButton">Next</button>
    </div>

    <div class="message" id="messageBox"></div>
  `;

  document
    .getElementById("instructionsNextButton")
    .addEventListener("click", () => app.handleInstructionsNext());
};