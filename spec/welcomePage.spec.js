describe("welcome page", function () {
  beforeEach(function () {
    testHelpers.resetAppState();
    testHelpers.mountAppContainer();
  });

  afterEach(function () {
    testHelpers.clearTestRoot();
  });

  it("renders the welcome page title", function () {
    state.participantId = "test-123";

    app.showWelcomePage();

    expect(document.getElementById("app").textContent).toContain("Welcome");
  });

  it("shows the participant ID on the welcome page", function () {
    state.participantId = "test-123";

    app.showWelcomePage();

    expect(document.getElementById("app").textContent).toContain("test-123");
  });

  it("opens the consent page when Next is clicked", function () {
    state.participantId = "test-123";

    app.showWelcomePage();
    document.getElementById("nextButton").click();

    expect(document.getElementById("app").textContent).toContain("Informed Consent");
    expect(document.getElementById("acceptButton")).not.toBeNull();
    expect(document.getElementById("denyButton")).not.toBeNull();
  });
});