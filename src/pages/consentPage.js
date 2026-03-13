window.renderConsentPage = function renderConsentPage(app) {
  const appRoot = document.getElementById("app");

  appRoot.innerHTML = `
    <h1 class="title">Informed Consent</h1>

    <p class="lead">
      This study is conducted by researchers at Tilburg University and the
      University of Amsterdam (The Netherlands).
    </p>

    <p class="lead">
      Name and email address of the principal investigator:
      Dr Bennett Kleinberg, bennett.kleinberg@tilburguniversity.edu
    </p>

    <div class="info-box">
      <p class="lead consent-intro">
        By proceeding, you voluntarily agree to participate in this study.
        This does not interfere with your right to withdraw from this study
        at any time without an explanation.
      </p>

      <p class="lead consent-intro">
        The study was reviewed and approved by the university’s ethics committee.
        Please proceed if you agree to the following:
      </p>

      <ul class="consent-list">
        <li>I confirm that I have read and understood the information provided for this study.</li>
        <li>I understand that my participation is voluntary.</li>
        <li>I understand that I remain fully anonymous, and that I will not be identifiable in any publications or reports on the results of this study.</li>
        <li>I understand that the data collected in this survey might be made publicly available. I know that no personal information whatsoever will be included in this dataset and that my anonymous research data can be stored for the period of 10 years.</li>
        <li>I understand that the results of this survey will be reported in academic publications or conference presentations.</li>
        <li>I understand that I will not benefit financially from this study or from any possible outcome it may result in in the future.</li>
        <li>I understand that I will be compensated for participation in this study as detailed in the task description on Prolific.</li>
        <li>I am aware of who I should contact if I wish to lodge a complaint or ask a question.</li>
      </ul>
    </div>

    <p class="lead">
      Please click on "Accept" if you want to give your consent and proceed with
      the experiment. Otherwise, click on "Deny" and the experiment ends.
    </p>

    <div class="actions consent-actions">
      <button class="button button-danger" id="denyButton">Deny</button>
      <button class="button" id="acceptButton">Accept</button>
    </div>

    <div class="message" id="messageBox"></div>
  `;

  document
    .getElementById("acceptButton")
    .addEventListener("click", () => app.handleConsentAccept());

  document
    .getElementById("denyButton")
    .addEventListener("click", () => app.handleConsentDeny());
};