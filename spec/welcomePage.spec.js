describe("welcome page app", function () {
  beforeEach(function () {
    sessionStorage.clear();
    app.state.participantId = null;

    const testRoot = document.getElementById("test-root");
    testRoot.innerHTML = '<div id="app"></div>';
  });

  afterEach(function () {
    const testRoot = document.getElementById("test-root");
    testRoot.innerHTML = "";
  });

  it("generates a fallback participant ID when none exists", function () {
    spyOn(app, "getProlificIdFromUrl").and.returnValue(null);

    app.initializeParticipantId();

    expect(app.state.participantId).toBeTruthy();
    expect(sessionStorage.getItem(app.STORAGE_KEY)).toBe(app.state.participantId);
  });

  it("uses the Prolific ID when present", function () {
    spyOn(app, "getProlificIdFromUrl").and.returnValue("abc123");

    app.initializeParticipantId();

    expect(app.state.participantId).toBe("abc123");
    expect(sessionStorage.getItem(app.STORAGE_KEY)).toBe("abc123");
  });

  it("reuses the stored participant ID when no Prolific ID exists", function () {
    sessionStorage.setItem(app.STORAGE_KEY, "stored-001");
    spyOn(app, "getProlificIdFromUrl").and.returnValue(null);

    app.initializeParticipantId();

    expect(app.state.participantId).toBe("stored-001");
  });

  it("renders the welcome page", function () {
    app.state.participantId = "test-123";

    app.renderWelcomePage();

    expect(document.getElementById("app").textContent).toContain("Welcome");
    expect(document.getElementById("app").textContent).toContain("test-123");
    expect(document.getElementById("nextButton")).not.toBeNull();
  });
});