describe("consent page", function () {
  beforeEach(function () {
    testHelpers.resetAppState();
    testHelpers.mountAppContainer();
    app.showConsentPage();
  });

  afterEach(function () {
    testHelpers.clearTestRoot();
  });

  it("renders the informed consent page", function () {
    expect(document.getElementById("app").textContent).toContain("Informed Consent");
    expect(document.getElementById("acceptButton")).not.toBeNull();
    expect(document.getElementById("denyButton")).not.toBeNull();
  });

  it("sets consentData to Accepted and opens the instructions page when Accept is clicked", function () {
    document.getElementById("acceptButton").click();

    expect(state.consentData).toBe("Accepted");
    expect(document.getElementById("app").textContent).toContain("Instructions");
    expect(document.getElementById("instructionsNextButton")).not.toBeNull();
  });

  it("shows a confirmation popup and opens the no-consent page when Deny is confirmed", function () {
    spyOn(window, "confirm").and.returnValue(true);
    spyOn(app, "showNoConsentPage");
    document.getElementById("denyButton").click();

    expect(state.consentData).toBe("Denied");
    expect(window.confirm).toHaveBeenCalled();
    expect(app.showNoConsentPage).toHaveBeenCalled();
  });

  it("keeps the participant on the consent page when the deny popup is cancelled", function () {
    spyOn(window, "confirm").and.returnValue(false);
    spyOn(app, "showNoConsentPage");

    document.getElementById("denyButton").click();

    expect(state.consentData).toBeNull();
    expect(app.showNoConsentPage).not.toHaveBeenCalled();
    expect(document.getElementById("app").textContent).toContain("Informed Consent");
  });

  it("clears persisted study data and skips the normal end page when deny is confirmed", function () {
    spyOn(window, "confirm").and.returnValue(true);
    spyOn(app, "showEndPage");

    storage.setParticipantId("stored-001");
    storage.setCurrentScreen("task");
    storage.setTaskSession({ statementId: "stmt-001" });
    storage.setFeedbackSession({ strategies: "example" });
    storage.setFeedbackSubmission({ submittedAt: "2026-03-26T10:00:00.000Z" });
    storage.setSessionData({ sessionId: "session-1", pages: { consent: {}, task: {} } });

    document.getElementById("denyButton").click();

    expect(app.showEndPage).not.toHaveBeenCalled();
    expect(storage.getParticipantId()).toBeNull();
    expect(storage.getCurrentScreen()).toBeNull();
    expect(storage.getTaskSession()).toBeNull();
    expect(storage.getFeedbackSession()).toBeNull();
    expect(storage.getFeedbackSubmission()).toBeNull();
    expect(storage.getSessionData()).toBeNull();
    expect(document.getElementById("app").textContent).toContain("Study Ended");
  });
  it("scrolls to the top when the consent page is rendered", function () {
    spyOn(utils, "scrollToTop");

    app.showConsentPage();

    expect(utils.scrollToTop).toHaveBeenCalled();
  });
});