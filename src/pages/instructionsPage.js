window.renderInstructionsPage = function renderInstructionsPage(app) {
  utils.scrollToTop();

  const appRoot = document.getElementById("app");

  appRoot.innerHTML = `
    <h1 class="title">Instructions</h1>

    <p class="lead">
      In this study, you will read <strong>1</strong> short statement written by
      participants in another study. This statement is either <strong>truthful</strong>
      or <strong>deceptive</strong>. Truthful statements describe events that have actually happened, while deceptive statements are fabricated. Some statements have been shortened.
    </p>

    <p class="lead">
      You will also see the predictions of a state-of-the-art AI deception detection algorithm, which was trained on large datasets of truths and lies.
    </p>

    <p class="lead">
      These predictions show you whether the AI classified the statement as <strong>deceptive</strong> or <strong>truthful</strong> and the <strong>confidence</strong> of the classification.
      The closer the confidence score is to 100%, the higher the confidence of the model’s prediction. 
      Confidence values closer to 50% indicate uncertainty. A confidence of 50% implies the highest possible uncertainty about the decision (i.e., a truthful and deceptive judgement are equally possible).
    </p>

    <p class="lead">
      Your task is to <strong>modify</strong> the original statement. Specifically, we want you to try to paraphrase the statement so that the model’s prediction changes. You will receive live feedback from the AI model. 
      Your goal is to modify the statement so much that the AI model’s original prediction is reversed: if the original prediction was ‘truthful’, your modification should render the prediction now as ‘deceptive’, and vice versa.
    </p>

    <p class="lead">
      In total, you have <strong>10</strong> attempts to lower the confidence score of the AI’s original prediction as much as possible. If you lower the confidence enough so that the AI model reverses its original prediction, you will immediately move on to the end of the study.
    </p>

    <div class="info-box">
      <p class="lead instructions-emphasis">
        There is one very important condition to be met: You must maintain the meaning of the original statement. In other words, in your modification, core facts, events or the overall claim of the original statement should remain recognizable. Your modification should also be grammatically correct and appear natural.
      </p>

      <p class="lead instructions-emphasis">
        <strong>Please read and modify the statement carefully.</strong>
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