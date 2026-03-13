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

  it("sets consentData to Accepted when Accept is clicked", function () {
    document.getElementById("acceptButton").click();

    expect(state.consentData).toBe("Accepted");
  });

  it("sets consentData to Denied when Deny is clicked", function () {
    document.getElementById("denyButton").click();

    expect(state.consentData).toBe("Denied");
  });
});