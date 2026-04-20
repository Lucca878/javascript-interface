window.renderTaskReminderPage = function renderTaskReminderPage(app) {
  utils.scrollToTop();

  const appRoot = document.getElementById("app");

  appRoot.innerHTML = `
    <h1 class="title">Task Reminder</h1>

    <p class="lead">
      You are now about to start the main task. Here is a recap of the key points:
    </p>

    <div class="task-reminder-grid">
      <section class="task-panel task-reminder-panel task-reminder-panel-do">
        <h2 class="task-panel-title">What To Do</h2>
        <ul class="task-reminder-list">
          <li>
            <strong>Try to flip the model prediction:</strong> Rewrite the statement to reduce the AI's confidence so much that it changes its initial prediction.
          </li>
            <strong>Keep the same core meaning:</strong> Key facts and events must remain recognizable in your modification.
          </li>
          <li>
            <strong>Write naturally:</strong> Your modified statement should be grammatically correct and sound natural.
          </li>
        </ul>
      </section>

      <section class="task-panel task-reminder-panel task-reminder-panel-dont">
        <h2 class="task-panel-title">What Not To Do</h2>
        <ul class="task-reminder-list">
          <li>
            <strong>No outside tools:</strong> Please do not use Google, ChatGPT, or any other external resources.
          </li>
          <li>
            <strong>No unrealistic edits:</strong> Do not make the statement absurd or clearly false just to change the prediction. For example:
            <ul class="task-reminder-list task-reminder-example-list">
              <li>Changing "my grandmother died at age 76" to "my grandmother died at age 765"</li>
              <li>Adding unrealistic details such as "aliens abducted me on the way home"</li>
            </ul>
          </li>
        </ul>
      </section>
    </div>

    <div class="actions task-reminder-actions">
      <button class="button" id="taskReminderNextButton">Start Main Task</button>
    </div>
  `;

  document.getElementById("taskReminderNextButton").addEventListener("click", function () {
    app.handleTaskReminderNext();
  });
};
