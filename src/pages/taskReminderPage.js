window.renderTaskReminderPage = function renderTaskReminderPage(app) {
  utils.scrollToTop();

  const appRoot = document.getElementById("app");

  appRoot.innerHTML = `
    <h1 class="title">Task Reminder</h1>

    <p class="lead">
      You are now about to start the main task. Here is a recap of the key points:
    </p>

    <div class="task-panel">
      <h2 class="task-panel-title">Key Points</h2>
      <ul class="consent-list">
        <li><strong>Understand the task:</strong> Your goal is to modify statements to lower the AI's confidence score so that it changes the predicted class (truthful or deceptive).</li>
        <li><strong>Maintain meaning:</strong> Ensure your modifications preserve the original meaning of the statement.</li>
        <li><strong>Use natural language:</strong> Use natural and grammatically correct language to modify the statements.</li>
        <li><strong>Attempts:</strong> In the main task, you have 10 attempts per statement to obtain AI feedback and try to change the prediction.</li>
      </ul>
    </div>

    <div class="task-panel">
      <h2 class="task-panel-title">What Not To Do</h2>
      <p class="task-summary">
        <strong>IMPORTANT:</strong> Please do not use any outside tools (for example Google or ChatGPT) to assist you in this task. This study is a test of your own ability.
      </p>

      <p class="task-summary">
        Do not make the statement obviously unrealistic, absurd, or clearly false just to change the AI prediction. For example, avoid:
      </p>

      <ul class="consent-list">
        <li>Changing "my grandmother died at age 76" to "my grandmother died at age 765"</li>
        <li>Adding unrealistic details such as "aliens abducted me on the way home"</li>
      </ul>
    </div>

    <div class="actions">
      <button class="button" id="taskReminderNextButton">Start Main Task</button>
    </div>
  `;

  document.getElementById("taskReminderNextButton").addEventListener("click", function () {
    app.handleTaskReminderNext();
  });
};
