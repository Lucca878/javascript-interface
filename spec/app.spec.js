describe("app core", function () {
  beforeEach(function () {
    testHelpers.resetAppState();
    testHelpers.mountAppContainer();
  });

  afterEach(function () {
    testHelpers.clearTestRoot();
  });

  it("generates a fallback participant ID when none exists", function () {
    spyOn(app, "getProlificIdFromUrl").and.returnValue(null);

    app.initializeParticipantId();

    expect(state.participantId).toBeTruthy();
    expect(storage.getParticipantId()).toBe(state.participantId);
  });

  it("uses the Prolific ID when present", function () {
    spyOn(app, "getProlificIdFromUrl").and.returnValue("abc123");

    app.initializeParticipantId();

    expect(state.participantId).toBe("abc123");
    expect(storage.getParticipantId()).toBe("abc123");
  });

  it("reuses the stored participant ID when no Prolific ID exists", function () {
    storage.setParticipantId("stored-001");
    spyOn(app, "getProlificIdFromUrl").and.returnValue(null);

    app.initializeParticipantId();

    expect(state.participantId).toBe("stored-001");
  });

  it("restores the consent page when the stored screen is consent", function () {
    spyOn(app, "getProlificIdFromUrl").and.returnValue(null);
    storage.setParticipantId("stored-001");
    storage.setCurrentScreen("consent");

    app.init();

    expect(document.getElementById("app").textContent).toContain("Informed Consent");
    expect(document.getElementById("acceptButton")).not.toBeNull();
    expect(document.getElementById("denyButton")).not.toBeNull();
  });

  it("shows the welcome page when no stored screen exists", function () {
    spyOn(app, "getProlificIdFromUrl").and.returnValue(null);
    storage.setParticipantId("stored-001");

    app.init();

    expect(document.getElementById("app").textContent).toContain("Welcome");
    expect(document.getElementById("nextButton")).not.toBeNull();
  });
  it("restores the instructions page when the stored screen is instructions", function () {
    spyOn(app, "getProlificIdFromUrl").and.returnValue(null);
    storage.setParticipantId("stored-001");
    storage.setCurrentScreen("instructions");

    app.init();

    expect(document.getElementById("app").textContent).toContain("Instructions");
    expect(document.getElementById("instructionsNextButton")).not.toBeNull();
  });
  it("stores the current screen and pushes history when showing the consent page", function () {
    spyOn(app, "pushHistoryState");
    testHelpers.mountAppContainer();

    app.showConsentPage();

    expect(storage.getCurrentScreen()).toBe("consent");
    expect(app.pushHistoryState).toHaveBeenCalledWith("consent");
  });
  it("stores the current screen and pushes history when showing the instructions page", function () {
    spyOn(app, "pushHistoryState");
    testHelpers.mountAppContainer();

    app.showInstructionsPage();

    expect(storage.getCurrentScreen()).toBe("instructions");
    expect(app.pushHistoryState).toHaveBeenCalledWith("instructions");
  });
  it("restores the stored screen when popstate is handled", function () {
    storage.setCurrentScreen("instructions");
    spyOn(app, "restoreScreen");
    spyOn(app, "replaceHistoryState");

    app.handlePopState();

    expect(app.replaceHistoryState).toHaveBeenCalledWith("instructions");
    expect(app.restoreScreen).toHaveBeenCalled();
  });
  it("registers a popstate listener when setting up the history guard", function () {
    spyOn(window, "addEventListener");
    spyOn(app, "replaceHistoryState");

    app.setupHistoryGuard();

    expect(app.replaceHistoryState).toHaveBeenCalled();
    expect(window.addEventListener).toHaveBeenCalledWith("popstate", jasmine.any(Function));
  });
});