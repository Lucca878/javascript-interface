window.renderEndPage = function renderEndPage(app) {
  utils.scrollToTop();

  const appRoot = document.getElementById("app");

  appRoot.innerHTML = `
    <h1 class="title">End of Study</h1>

    <p class="lead">Thank you for participating in our study.</p>

    <div class="task-panel">
      <h2>Debriefing</h2>
      <p>
        This study investigated how humans (you) modify statements in a live human-AI interaction.
      </p>
      <p>
        We will compare these human modifications with modifications done by a large language model to understand how an AI model can best be misled. Consequently, we aim to use these insights to develop more secure and robust AI classification systems.
      </p>
      <p>
        Thank you for your valuable contribution.
      </p>
      <p>
        You will now be redirected to Prolific.
      </p>
    </div>

    <div class="actions">
      <a href="https://app.prolific.com/submissions/complete?cc=CPSXYUWC" class="button" target="_blank">
        Return to Prolific
      </a>
    </div>

    <p class="note" style="text-align: center; margin-top: 2rem; font-size: 0.9rem;">
      If you're not automatically redirected, <a href="https://app.prolific.com/submissions/complete?cc=CPSXYUWC" target="_blank">click here</a>.
    </p>
  `;
};
